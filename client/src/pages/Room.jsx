import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useWebRTC } from '../hooks/useWebRTC.js';
import VideoTile from '../components/VideoTile.jsx';
import ControlsBar from '../components/ControlsBar.jsx';
import CopyIcon from '../components/icons/CopyIcon.jsx';

export default function Room() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const name = sessionStorage.getItem('mini-meet-name');

  const [audioEnabled, setAudioEnabled] = useState(true);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!name) {
      navigate('/', { replace: true });
    }
  }, [name, navigate]);

  const { localStream, peers, joinError, connectionState, toggleAudio, toggleVideo, leaveRoom } =
    useWebRTC({ roomId, name: name || 'Guest' });

  const participantCount = useMemo(() => Object.keys(peers).length + 1, [peers]);

  function handleToggleAudio() {
    const enabled = toggleAudio();
    setAudioEnabled(enabled);
  }

  function handleToggleVideo() {
    const enabled = toggleVideo();
    setVideoEnabled(enabled);
  }

  function handleLeave() {
    leaveRoom();
    navigate('/');
  }

  function handleCopyCode() {
    navigator.clipboard.writeText(roomId).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    });
  }

  if (!name) return null;

  if (connectionState === 'error') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-canvas px-4 text-center">
        <h2 className="font-display text-xl text-zinc-100">Couldn't join the room</h2>
        <p className="mt-2 max-w-sm font-body text-sm text-zinc-500">{joinError}</p>
        <button
          onClick={() => navigate('/')}
          className="mt-6 rounded-md bg-signal px-4 py-2 font-display text-sm font-semibold text-canvas"
        >
          Back to home
        </button>
      </div>
    );
  }

  const peerList = Object.entries(peers);
  const totalTiles = peerList.length + 1;
  const gridCols =
    totalTiles <= 1 ? 'grid-cols-1' : totalTiles <= 4 ? 'grid-cols-2' : 'grid-cols-3';

  return (
    <div className="flex h-[100dvh] flex-col overflow-hidden bg-canvas">
      <header className="flex shrink-0 items-center justify-between border-b border-line bg-surface px-5 py-3">
        <div className="flex items-center gap-3">
          <span className="h-2 w-2 rounded-full bg-signal animate-pulseSignal" />
          <button
            onClick={handleCopyCode}
            className="flex items-center gap-1.5 rounded-md border border-line bg-surface2 px-2.5 py-1 font-mono text-xs text-zinc-300 transition-colors hover:border-signal-dim"
          >
            {roomId}
            <CopyIcon className="h-3.5 w-3.5" />
          </button>
          {copied && <span className="font-body text-xs text-signal">Copied</span>}
        </div>
        <span className="font-body text-xs text-zinc-500">
          {participantCount} {participantCount === 1 ? 'participant' : 'participants'}
        </span>
      </header>

      <main className="min-h-0 flex-1 overflow-y-auto p-4">
        {connectionState === 'connecting' && (
          <div className="flex h-full items-center justify-center">
            <p className="font-body text-sm text-zinc-500">Connecting…</p>
          </div>
        )}

        <div className={`grid ${gridCols} gap-4`}>
          <VideoTile
            stream={localStream}
            name={name}
            isLocal
            audioEnabled={audioEnabled}
            videoEnabled={videoEnabled}
          />
          {peerList.map(([id, peer]) => (
            <VideoTile
              key={id}
              stream={peer.stream}
              name={peer.name}
              audioEnabled={peer.audioEnabled}
              videoEnabled={peer.videoEnabled}
            />
          ))}
        </div>

        {peerList.length === 0 && connectionState === 'joined' && (
          <p className="mt-6 text-center font-body text-sm text-zinc-600">
            You're the only one here. Share the room code to bring others in.
          </p>
        )}
      </main>

      <div className="shrink-0">
        <ControlsBar
          audioEnabled={audioEnabled}
          videoEnabled={videoEnabled}
          onToggleAudio={handleToggleAudio}
          onToggleVideo={handleToggleVideo}
          onLeave={handleLeave}
        />
      </div>
    </div>
  );
}