import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';

const PORT = process.env.PORT || 4000;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || '*';

const app = express();
app.use(cors({ origin: CLIENT_ORIGIN }));
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

// Simple endpoint to check how many people are in a room before joining
app.get('/room/:roomId/exists', (req, res) => {
  const { roomId } = req.params;
  const room = rooms.get(roomId);
  res.json({
    exists: !!room,
    participantCount: room ? room.size : 0,
  });
});

const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: CLIENT_ORIGIN,
    methods: ['GET', 'POST'],
  },
});

// roomId -> Map<socketId, { name }>
const rooms = new Map();

const MAX_PARTICIPANTS_PER_ROOM = 8; // mesh topology degrades past this; keep small

function getRoomPeers(roomId) {
  const room = rooms.get(roomId);
  if (!room) return [];
  return Array.from(room.entries()).map(([id, info]) => ({ id, name: info.name }));
}

io.on('connection', (socket) => {
  console.log(`[connect] ${socket.id}`);

  socket.on('join-room', ({ roomId, name }, callback) => {
    if (!roomId || typeof roomId !== 'string') {
      callback?.({ ok: false, error: 'Invalid room ID' });
      return;
    }

    const safeName = (name || 'Guest').toString().slice(0, 40);

    if (!rooms.has(roomId)) {
      rooms.set(roomId, new Map());
    }
    const room = rooms.get(roomId);

    if (room.size >= MAX_PARTICIPANTS_PER_ROOM) {
      callback?.({ ok: false, error: 'Room is full' });
      return;
    }

    // Tell the new peer who is already in the room
    const existingPeers = getRoomPeers(roomId);

    room.set(socket.id, { name: safeName });
    socket.join(roomId);
    socket.data.roomId = roomId;
    socket.data.name = safeName;

    callback?.({ ok: true, peers: existingPeers, selfId: socket.id });

    // Tell everyone else a new peer joined
    socket.to(roomId).emit('peer-joined', { id: socket.id, name: safeName });

    console.log(`[join] ${safeName} (${socket.id}) -> room ${roomId} (${room.size} total)`);
  });

  // WebRTC signaling relay: offer, answer, ice-candidate
  socket.on('signal', ({ to, type, data }) => {
    if (!to || !type) return;
    io.to(to).emit('signal', {
      from: socket.id,
      type,
      data,
    });
  });

  socket.on('toggle-media', ({ kind, enabled }) => {
    const roomId = socket.data.roomId;
    if (!roomId) return;
    socket.to(roomId).emit('peer-media-toggle', {
      id: socket.id,
      kind, // 'audio' | 'video'
      enabled,
    });
  });

  socket.on('leave-room', () => {
    handleLeave(socket);
  });

  socket.on('disconnect', () => {
    handleLeave(socket);
    console.log(`[disconnect] ${socket.id}`);
  });
});

function handleLeave(socket) {
  const roomId = socket.data.roomId;
  if (!roomId) return;

  const room = rooms.get(roomId);
  if (room) {
    room.delete(socket.id);
    if (room.size === 0) {
      rooms.delete(roomId);
    }
  }

  socket.to(roomId).emit('peer-left', { id: socket.id });
  socket.leave(roomId);
  socket.data.roomId = null;
}

httpServer.listen(PORT, () => {
  console.log(`Signaling server running on port ${PORT}`);
});
