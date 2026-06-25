import MicIcon from './icons/MicIcon.jsx';
import MicOffIcon from './icons/MicOffIcon.jsx';
import CameraIcon from './icons/CameraIcon.jsx';
import CameraOffIcon from './icons/CameraOffIcon.jsx';
import PhoneOffIcon from './icons/PhoneOffIcon.jsx';

function ControlButton({ active, onClick, children, label, danger }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-pressed={active}
      className={`flex h-12 w-12 items-center justify-center rounded-full transition-colors focus-visible:ring-2 focus-visible:ring-signal ${
        danger
          ? 'bg-danger text-white hover:bg-danger/90'
          : active
          ? 'bg-surface2 text-zinc-100 hover:bg-line'
          : 'bg-danger/15 text-danger hover:bg-danger/25'
      }`}
    >
      {children}
    </button>
  );
}

export default function ControlsBar({
  audioEnabled,
  videoEnabled,
  onToggleAudio,
  onToggleVideo,
  onLeave,
}) {
  return (
    <div className="flex items-center justify-center gap-4 border-t border-line bg-surface px-6 py-4">
      <ControlButton
        active={audioEnabled}
        onClick={onToggleAudio}
        label={audioEnabled ? 'Mute microphone' : 'Unmute microphone'}
      >
        {audioEnabled ? <MicIcon /> : <MicOffIcon />}
      </ControlButton>

      <ControlButton
        active={videoEnabled}
        onClick={onToggleVideo}
        label={videoEnabled ? 'Turn off camera' : 'Turn on camera'}
      >
        {videoEnabled ? <CameraIcon /> : <CameraOffIcon />}
      </ControlButton>

      <ControlButton active danger onClick={onLeave} label="Leave meeting">
        <PhoneOffIcon />
      </ControlButton>
    </div>
  );
}
