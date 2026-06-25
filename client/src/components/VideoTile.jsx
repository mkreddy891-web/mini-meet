import { useEffect, useRef } from 'react';
import MicOffIcon from './icons/MicOffIcon.jsx';

export default function VideoTile({ stream, name, isLocal, audioEnabled, videoEnabled, isSpeaking }) {
  const videoRef = useRef(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream, videoEnabled]);

  const initials = (name || 'Guest')
    .trim()
    .split(/\s+/)
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div
      className={`relative aspect-video w-full overflow-hidden rounded-card bg-surface border transition-colors ${
        isSpeaking ? 'border-signal' : 'border-line'
      }`}
    >
      {stream && videoEnabled !== false ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={isLocal}
          className={`h-full w-full object-cover ${isLocal ? 'scale-x-[-1]' : ''}`}
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-surface2">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-line font-display text-lg text-zinc-300">
            {initials}
          </div>
        </div>
      )}

      <div className="absolute bottom-2 left-2 flex items-center gap-1.5 rounded-md bg-black/55 px-2 py-1 backdrop-blur-sm">
        {audioEnabled === false && <MicOffIcon className="h-3.5 w-3.5 text-danger" />}
        <span className="font-body text-xs text-zinc-100">
          {name} {isLocal && <span className="text-zinc-400">(you)</span>}
        </span>
      </div>
    </div>
  );
}
