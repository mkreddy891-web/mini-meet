import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { generateRoomCode, isValidRoomCode } from '../utils/roomCode.js';

export default function Home() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [mode, setMode] = useState('join'); // 'join' | 'create'
  const [error, setError] = useState('');

  function handleCreate() {
    if (!name.trim()) {
      setError('Enter your name first.');
      return;
    }
    const code = generateRoomCode();
    sessionStorage.setItem('mini-meet-name', name.trim());
    navigate(`/room/${code}`);
  }

  function handleJoin(e) {
    e.preventDefault();
    if (!name.trim()) {
      setError('Enter your name first.');
      return;
    }
    if (!isValidRoomCode(roomCode)) {
      setError('Enter a valid room code.');
      return;
    }
    sessionStorage.setItem('mini-meet-name', name.trim());
    navigate(`/room/${roomCode.trim().toLowerCase()}`);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1">
            <span className="h-2 w-2 rounded-full bg-signal animate-pulseSignal" />
            <span className="font-mono text-xs tracking-wide text-zinc-400">SIGNAL READY</span>
          </div>
          <h1 className="font-display text-3xl font-semibold text-zinc-50">Mini Meet</h1>
          <p className="mt-1 font-body text-sm text-zinc-500">
            Dial into a room. No accounts, no downloads.
          </p>
        </div>

        <div className="rounded-card border border-line bg-surface p-6">
          <label className="mb-1.5 block font-body text-sm text-zinc-400" htmlFor="name">
            Your name
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setError('');
            }}
            placeholder="e.g. Priya"
            maxLength={40}
            className="mb-5 w-full rounded-md border border-line bg-surface2 px-3 py-2.5 font-body text-zinc-100 placeholder:text-zinc-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal"
          />

          <div className="mb-5 flex rounded-md border border-line bg-surface2 p-1">
            <button
              type="button"
              onClick={() => setMode('join')}
              className={`flex-1 rounded-sm py-1.5 font-body text-sm transition-colors ${
                mode === 'join' ? 'bg-line text-zinc-50' : 'text-zinc-500'
              }`}
            >
              Join a room
            </button>
            <button
              type="button"
              onClick={() => setMode('create')}
              className={`flex-1 rounded-sm py-1.5 font-body text-sm transition-colors ${
                mode === 'create' ? 'bg-line text-zinc-50' : 'text-zinc-500'
              }`}
            >
              New room
            </button>
          </div>

          {mode === 'join' ? (
            <form onSubmit={handleJoin}>
              <label className="mb-1.5 block font-body text-sm text-zinc-400" htmlFor="code">
                Room code
              </label>
              <input
                id="code"
                type="text"
                value={roomCode}
                onChange={(e) => {
                  setRoomCode(e.target.value);
                  setError('');
                }}
                placeholder="amber-grove-482"
                className="mb-4 w-full rounded-md border border-line bg-surface2 px-3 py-2.5 font-mono text-sm text-zinc-100 placeholder:text-zinc-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal"
              />
              <button
                type="submit"
                className="w-full rounded-md bg-signal py-2.5 font-display text-sm font-semibold text-canvas transition-colors hover:bg-signal/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
              >
                Join room
              </button>
            </form>
          ) : (
            <button
              type="button"
              onClick={handleCreate}
              className="w-full rounded-md bg-signal py-2.5 font-display text-sm font-semibold text-canvas transition-colors hover:bg-signal/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
            >
              Create new room
            </button>
          )}

          {error && <p className="mt-3 font-body text-sm text-danger">{error}</p>}
        </div>

        <p className="mt-5 text-center font-body text-xs text-zinc-600">
          Best for small calls — up to 8 people.
        </p>
      </div>
    </div>
  );
}
