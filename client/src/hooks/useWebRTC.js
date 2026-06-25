import { useCallback, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';

const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:4000';

const ICE_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
];

/**
 * Manages a mesh of RTCPeerConnections, one per remote participant.
 * Designed for small rooms (mesh does not scale past ~6-8 people).
 */
export function useWebRTC({ roomId, name }) {
  const [peers, setPeers] = useState({}); // id -> { name, stream, audioEnabled, videoEnabled }
  const [localStream, setLocalStream] = useState(null);
  const [joinError, setJoinError] = useState(null);
  const [connectionState, setConnectionState] = useState('connecting'); // connecting | joined | error

  const socketRef = useRef(null);
  const pcsRef = useRef({}); // id -> RTCPeerConnection
  const localStreamRef = useRef(null);
  const makingOfferRef = useRef({}); // id -> bool, for perfect negotiation

  const createPeerConnection = useCallback((peerId, peerName) => {
    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });

    // Add our local tracks to this new connection
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        pc.addTrack(track, localStreamRef.current);
      });
    }

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socketRef.current?.emit('signal', {
          to: peerId,
          type: 'ice-candidate',
          data: event.candidate,
        });
      }
    };

    pc.ontrack = (event) => {
      const [stream] = event.streams;
      setPeers((prev) => ({
        ...prev,
        [peerId]: {
          ...(prev[peerId] || { name: peerName, audioEnabled: true, videoEnabled: true }),
          stream,
        },
      }));
    };

    pc.onnegotiationneeded = async () => {
      try {
        makingOfferRef.current[peerId] = true;
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socketRef.current?.emit('signal', {
          to: peerId,
          type: 'offer',
          data: pc.localDescription,
        });
      } catch (err) {
        console.error('Negotiation error:', err);
      } finally {
        makingOfferRef.current[peerId] = false;
      }
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'failed' || pc.connectionState === 'closed') {
        removePeer(peerId);
      }
    };

    pcsRef.current[peerId] = pc;
    return pc;
  }, []);

  const removePeer = useCallback((peerId) => {
    const pc = pcsRef.current[peerId];
    if (pc) {
      pc.close();
      delete pcsRef.current[peerId];
    }
    setPeers((prev) => {
      const next = { ...prev };
      delete next[peerId];
      return next;
    });
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 1280, height: 720 },
          audio: { echoCancellation: true, noiseSuppression: true },
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        localStreamRef.current = stream;
        setLocalStream(stream);

        const socket = io(SERVER_URL, { transports: ['websocket', 'polling'] });
        socketRef.current = socket;

        socket.on('connect', () => {
          socket.emit('join-room', { roomId, name }, (response) => {
            if (!response?.ok) {
              setJoinError(response?.error || 'Could not join room');
              setConnectionState('error');
              return;
            }
            setConnectionState('joined');
            // Connect to everyone already in the room
            response.peers.forEach((peer) => {
              setPeers((prev) => ({
                ...prev,
                [peer.id]: { name: peer.name, stream: null, audioEnabled: true, videoEnabled: true },
              }));
              createPeerConnection(peer.id, peer.name);
              // Lower socket id initiates the offer to avoid glare
              if (socket.id < peer.id) {
                // onnegotiationneeded will fire automatically after addTrack
              }
            });
          });
        });

        socket.on('peer-joined', ({ id, name: peerName }) => {
          setPeers((prev) => ({
            ...prev,
            [id]: { name: peerName, stream: null, audioEnabled: true, videoEnabled: true },
          }));
          createPeerConnection(id, peerName);
        });

        socket.on('signal', async ({ from, type, data }) => {
          let pc = pcsRef.current[from];
          if (!pc) {
            pc = createPeerConnection(from, peers[from]?.name || 'Guest');
          }

          try {
            if (type === 'offer') {
              await pc.setRemoteDescription(new RTCSessionDescription(data));
              const answer = await pc.createAnswer();
              await pc.setLocalDescription(answer);
              socket.emit('signal', { to: from, type: 'answer', data: pc.localDescription });
            } else if (type === 'answer') {
              await pc.setRemoteDescription(new RTCSessionDescription(data));
            } else if (type === 'ice-candidate') {
              await pc.addIceCandidate(new RTCIceCandidate(data));
            }
          } catch (err) {
            console.error('Signal handling error:', err);
          }
        });

        socket.on('peer-left', ({ id }) => {
          removePeer(id);
        });

        socket.on('peer-media-toggle', ({ id, kind, enabled }) => {
          setPeers((prev) => {
            if (!prev[id]) return prev;
            return {
              ...prev,
              [id]: {
                ...prev[id],
                [kind === 'audio' ? 'audioEnabled' : 'videoEnabled']: enabled,
              },
            };
          });
        });

        socket.on('connect_error', () => {
          setJoinError('Could not reach the signaling server. Is it running?');
          setConnectionState('error');
        });
      } catch (err) {
        console.error('Media access error:', err);
        setJoinError(
          err.name === 'NotAllowedError'
            ? 'Camera/microphone access was denied. Allow access and reload.'
            : 'Could not access camera or microphone.'
        );
        setConnectionState('error');
      }
    }

    init();

    return () => {
      cancelled = true;
      socketRef.current?.emit('leave-room');
      socketRef.current?.disconnect();
      Object.values(pcsRef.current).forEach((pc) => pc.close());
      pcsRef.current = {};
      localStreamRef.current?.getTracks().forEach((t) => t.stop());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId, name]);

  const toggleAudio = useCallback(() => {
    const stream = localStreamRef.current;
    if (!stream) return false;
    const audioTrack = stream.getAudioTracks()[0];
    if (!audioTrack) return false;
    audioTrack.enabled = !audioTrack.enabled;
    socketRef.current?.emit('toggle-media', { kind: 'audio', enabled: audioTrack.enabled });
    return audioTrack.enabled;
  }, []);

  const toggleVideo = useCallback(() => {
    const stream = localStreamRef.current;
    if (!stream) return false;
    const videoTrack = stream.getVideoTracks()[0];
    if (!videoTrack) return false;
    videoTrack.enabled = !videoTrack.enabled;
    socketRef.current?.emit('toggle-media', { kind: 'video', enabled: videoTrack.enabled });
    return videoTrack.enabled;
  }, []);

  const leaveRoom = useCallback(() => {
    socketRef.current?.emit('leave-room');
    socketRef.current?.disconnect();
    Object.values(pcsRef.current).forEach((pc) => pc.close());
    pcsRef.current = {};
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
  }, []);

  return {
    localStream,
    peers,
    joinError,
    connectionState,
    toggleAudio,
    toggleVideo,
    leaveRoom,
  };
}
