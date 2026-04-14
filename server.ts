import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { createServer as createViteServer } from "vite";
import path from "path";
import { nanoid } from "nanoid";

const PORT = 3000;

interface Player {
  id: string;
  name: string;
  score: number;
  isHost: boolean;
}

interface Clue {
  playerId: string;
  playerName: string;
  text: string;
}

interface RoomState {
  id: string;
  players: Player[];
  status: "lobby" | "role_reveal" | "clue_round" | "discussion" | "vote" | "vote_reveal" | "faker_guess" | "round_end";
  currentRound: number;
  maxRounds: number;
  fakerId: string | null;
  secretWord: string | null;
  category: string | null;
  clues: Clue[];
  votes: Record<string, string>; // voterId -> votedId
  fakerGuess: string | null;
  winner: "group" | "faker" | null;
  settings: {
    timer: number;
    fakerCount: number;
  };
}

const DEFAULT_PACKS = [
  {
    name: "Household Items",
    words: ["Sofa", "Mirror", "Fridge", "Pillow", "Kettle", "Clock", "Towel", "Lamp", "Spoon", "Broom"]
  },
  {
    name: "Daily Activities",
    words: ["Cooking", "Sleeping", "Showering", "Reading", "Walking", "Driving", "Working", "Eating", "Exercising", "Cleaning"]
  },
  {
    name: "Places in Town",
    words: ["School", "Hospital", "Library", "Park", "Supermarket", "Bank", "Cinema", "Restaurant", "Gym", "Pharmacy"]
  },
  {
    name: "Common Electronics",
    words: ["Phone", "Laptop", "Television", "Camera", "Headphones", "Tablet", "Microwave", "Toaster", "Blender", "Fan"]
  },
  {
    name: "Clothing",
    words: ["Shirt", "Jeans", "Jacket", "Shoes", "Socks", "Hat", "Dress", "Scarf", "Gloves", "Belt"]
  }
];

const rooms: Record<string, RoomState> = {};

async function startServer() {
  const app = express();
  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
    },
  });

  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    socket.on("create_room", ({ name }) => {
      const roomId = nanoid(6).toUpperCase();
      const player: Player = { id: socket.id, name, score: 0, isHost: true };
      rooms[roomId] = {
        id: roomId,
        players: [player],
        status: "lobby",
        currentRound: 1,
        maxRounds: 5,
        fakerId: null,
        secretWord: null,
        category: null,
        clues: [],
        votes: {},
        fakerGuess: null,
        winner: null,
        settings: {
          timer: 60,
          fakerCount: 1,
        },
      };
      socket.join(roomId);
      socket.emit("room_created", rooms[roomId]);
    });

    socket.on("join_room", ({ roomId, name }) => {
      const room = rooms[roomId];
      if (!room) {
        socket.emit("error", "Room not found");
        return;
      }
      if (room.players.length >= 10) {
        socket.emit("error", "Room is full");
        return;
      }
      const player: Player = { id: socket.id, name, score: 0, isHost: false };
      room.players.push(player);
      socket.join(roomId);
      io.to(roomId).emit("room_updated", room);
    });

    socket.on("start_game", ({ roomId }) => {
      const room = rooms[roomId];
      if (!room || room.players.length < 3) return;

      const pack = DEFAULT_PACKS[Math.floor(Math.random() * DEFAULT_PACKS.length)];
      room.category = pack.name;
      room.secretWord = pack.words[Math.floor(Math.random() * pack.words.length)];
      room.fakerId = room.players[Math.floor(Math.random() * room.players.length)].id;
      room.status = "role_reveal";
      room.clues = [];
      room.votes = {};
      room.fakerGuess = null;
      room.winner = null;

      io.to(roomId).emit("room_updated", room);
    });

    socket.on("next_phase", ({ roomId }) => {
      const room = rooms[roomId];
      if (!room) return;

      if (room.status === "role_reveal") {
        room.status = "clue_round";
      } else if (room.status === "clue_round") {
        room.status = "discussion";
      } else if (room.status === "discussion") {
        room.status = "vote";
      } else if (room.status === "vote") {
        // Tally votes
        const voteCounts: Record<string, number> = {};
        Object.values(room.votes).forEach(votedId => {
          voteCounts[votedId] = (voteCounts[votedId] || 0) + 1;
        });

        let maxVotes = 0;
        let caughtId = null;
        Object.entries(voteCounts).forEach(([id, count]) => {
          if (count > maxVotes) {
            maxVotes = count;
            caughtId = id;
          }
        });

        if (caughtId === room.fakerId) {
          room.status = "faker_guess";
        } else {
          room.winner = "faker";
          room.status = "round_end";
          // Update scores
          const faker = room.players.find(p => p.id === room.fakerId);
          if (faker) faker.score += 3;
        }
      }

      io.to(roomId).emit("room_updated", room);
    });

    socket.on("submit_clue", ({ roomId, text }) => {
      const room = rooms[roomId];
      if (!room) return;
      const player = room.players.find(p => p.id === socket.id);
      if (!player) return;

      room.clues.push({ playerId: socket.id, playerName: player.name, text });
      io.to(roomId).emit("room_updated", room);

      if (room.clues.length === room.players.length) {
        room.status = "discussion";
        io.to(roomId).emit("room_updated", room);
      }
    });

    socket.on("submit_vote", ({ roomId, votedId }) => {
      const room = rooms[roomId];
      if (!room) return;
      room.votes[socket.id] = votedId;
      io.to(roomId).emit("room_updated", room);

      if (Object.keys(room.votes).length === room.players.length) {
        // Automatically move to reveal if everyone voted
        // But maybe wait for a manual trigger or timer
      }
    });

    socket.on("submit_faker_guess", ({ roomId, guess }) => {
      const room = rooms[roomId];
      if (!room) return;
      room.fakerGuess = guess;
      
      if (guess.toLowerCase() === room.secretWord?.toLowerCase()) {
        room.winner = "faker";
        const faker = room.players.find(p => p.id === room.fakerId);
        if (faker) faker.score += 2;
        room.players.forEach(p => {
            if (p.id !== room.fakerId) p.score += 1;
        });
      } else {
        room.winner = "group";
        room.players.forEach(p => {
          if (p.id !== room.fakerId) p.score += 2;
        });
      }
      room.status = "round_end";
      io.to(roomId).emit("room_updated", room);
    });

    socket.on("play_again", ({ roomId }) => {
      const room = rooms[roomId];
      if (!room) return;
      room.currentRound++;
      if (room.currentRound > room.maxRounds) {
          room.currentRound = 1;
          room.players.forEach(p => p.score = 0);
      }
      
      const pack = DEFAULT_PACKS[Math.floor(Math.random() * DEFAULT_PACKS.length)];
      room.category = pack.name;
      room.secretWord = pack.words[Math.floor(Math.random() * pack.words.length)];
      room.fakerId = room.players[Math.floor(Math.random() * room.players.length)].id;
      room.status = "role_reveal";
      room.clues = [];
      room.votes = {};
      room.fakerGuess = null;
      room.winner = null;

      io.to(roomId).emit("room_updated", room);
    });

    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
      // Handle player removal from rooms
      Object.keys(rooms).forEach(roomId => {
        const room = rooms[roomId];
        const playerIndex = room.players.findIndex(p => p.id === socket.id);
        if (playerIndex !== -1) {
          const wasHost = room.players[playerIndex].isHost;
          room.players.splice(playerIndex, 1);
          if (room.players.length === 0) {
            delete rooms[roomId];
          } else {
            if (wasHost) {
              room.players[0].isHost = true;
            }
            io.to(roomId).emit("room_updated", room);
          }
        }
      });
    });
  });

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
