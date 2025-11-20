const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { Server } = require('socket.io');

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = process.env.PORT || 3000;
// when using middleware `hostname` and `port` must be provided below
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

const rooms = new Map(); // code -> Room Object

function generateRoomCode() {
  return Math.random().toString(36).substring(2, 7).toUpperCase();
}

app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  });

  const io = new Server(httpServer);

  io.on('connection', (socket) => {
    // console.log('Client connected', socket.id);

    socket.on('create_room', (callback) => {
      const code = generateRoomCode();
      rooms.set(code, {
        hostId: socket.id,
        users: [], // { id, name, stats: {} }
        settings: {
            mode: 'time',
            duration: 30,
            difficulty: 'medium',
            // Add other default settings here
        },
        status: 'waiting' // waiting, active
      });
      socket.join(code);
      // console.log(`Room created: ${code} by ${socket.id}`);
      callback({ code });
    });

    socket.on('join_room', ({ code, name }, callback) => {
      const room = rooms.get(code);
      if (!room) {
        return callback({ error: 'Room not found' });
      }
      
      const newUser = { id: socket.id, name, stats: { wpm: 0, accuracy: 0, progress: 0 } };
      room.users.push(newUser);
      socket.join(code);
      
      // Notify host
      io.to(room.hostId).emit('user_joined', newUser);
      
      // Send current state to joiner
      callback({ settings: room.settings, status: room.status });
      
      // console.log(`User ${name} joined room ${code}`);
    });

    socket.on('update_settings', ({ code, settings }) => {
      const room = rooms.get(code);
      if (room && room.hostId === socket.id) {
        room.settings = { ...room.settings, ...settings };
        io.to(code).emit('settings_updated', room.settings);
      }
    });
    
    socket.on('start_test', ({ code }) => {
        const room = rooms.get(code);
        if (room && room.hostId === socket.id) {
            room.status = 'active';
            io.to(code).emit('test_started');
        }
    });

    socket.on('stop_test', ({ code }) => {
        const room = rooms.get(code);
        if (room && room.hostId === socket.id) {
            room.status = 'waiting';
            io.to(code).emit('test_stopped');
        }
    });
    
    socket.on('reset_test', ({ code }) => {
        const room = rooms.get(code);
        if (room && room.hostId === socket.id) {
             room.status = 'waiting';
            // Reset stats for all users?
             room.users.forEach(u => u.stats = { wpm: 0, accuracy: 0, progress: 0 });
            io.to(code).emit('test_reset');
        }
    });

    socket.on('send_stats', ({ code, stats }) => {
      const room = rooms.get(code);
      if (room) {
        const user = room.users.find(u => u.id === socket.id);
        if (user) {
          user.stats = stats;
          // If this is a user update, forward to host (or everyone if we want a leaderboard)
          // Optimization: Maybe throttle this or only send to host
          io.to(room.hostId).emit('stats_update', { userId: socket.id, stats });
        }
      }
    });

    socket.on('disconnect', () => {
      // Handle user disconnect
        rooms.forEach((room, code) => {
            if (room.hostId === socket.id) {
                // Host left - destroy room or handle migration? PRD says "Users MUST be able to refresh and rejoin".
                // If host disconnects, maybe keep room alive for a bit?
                // For now, let's just notify.
                io.to(code).emit('host_disconnected');
                rooms.delete(code);
            } else {
                const index = room.users.findIndex(u => u.id === socket.id);
                if (index !== -1) {
                    const [removedUser] = room.users.splice(index, 1);
                    io.to(room.hostId).emit('user_left', { userId: socket.id });
                }
            }
        });
    });
  });

  httpServer.once('error', (err) => {
    console.error(err);
    process.exit(1);
  });

  httpServer.listen(port, () => {
    console.log(`> Ready on http://${hostname}:${port}`);
  });
});
