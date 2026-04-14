import { create } from "zustand";
import { io, Socket } from "socket.io-client";
import { RoomState, Player, GameMode } from "../types";
import { nanoid } from "nanoid";

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

interface GameStore {
  socket: Socket | null;
  room: RoomState | null;
  playerName: string;
  error: string | null;
  localPlayerId: string | null; // Used for local play to track whose turn it is
  
  connect: () => void;
  setPlayerName: (name: string) => void;
  createRoom: (name: string) => void;
  createLocalRoom: () => void;
  addLocalPlayer: (name: string) => void;
  removeLocalPlayer: (id: string) => void;
  joinRoom: (roomId: string, name: string) => void;
  startGame: () => void;
  submitClue: (text: string) => void;
  submitVote: (votedId: string) => void;
  submitFakerGuess: (guess: string) => void;
  nextPhase: () => void;
  playAgain: () => void;
  setError: (error: string | null) => void;
  setLocalPlayerId: (id: string | null) => void;
}

export const useGameStore = create<GameStore>((set, get) => ({
  socket: null,
  room: null,
  playerName: "",
  error: null,
  localPlayerId: null,

  connect: () => {
    if (get().socket) return;
    const socket = io();
    
    socket.on("room_created", (room: RoomState) => {
      set({ room, error: null });
    });

    socket.on("room_updated", (room: RoomState) => {
      set({ room });
    });

    socket.on("error", (error: string) => {
      set({ error });
    });

    set({ socket });
  },

  setPlayerName: (name: string) => set({ playerName: name }),

  createRoom: (name: string) => {
    const { socket } = get();
    if (socket) {
      socket.emit("create_room", { name });
    }
  },

  createLocalRoom: () => {
    const roomId = "LOCAL";
    const newRoom: RoomState = {
      id: roomId,
      gameMode: "local",
      players: [],
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
    set({ room: newRoom, error: null });
  },

  addLocalPlayer: (name: string) => {
    const { room } = get();
    if (!room || room.gameMode !== "local") return;
    if (room.players.length >= 10) return;
    
    const newPlayer: Player = {
      id: nanoid(),
      name,
      score: 0,
      isHost: room.players.length === 0,
    };
    
    set({
      room: {
        ...room,
        players: [...room.players, newPlayer],
      }
    });
  },

  removeLocalPlayer: (id: string) => {
    const { room } = get();
    if (!room || room.gameMode !== "local") return;
    
    const newPlayers = room.players.filter(p => p.id !== id);
    if (newPlayers.length > 0 && !newPlayers.some(p => p.isHost)) {
      newPlayers[0].isHost = true;
    }
    
    set({
      room: {
        ...room,
        players: newPlayers,
      }
    });
  },

  joinRoom: (roomId: string, name: string) => {
    const { socket } = get();
    if (socket) {
      socket.emit("join_room", { roomId, name });
    }
  },

  startGame: () => {
    const { socket, room } = get();
    if (!room) return;

    if (room.gameMode === "online" && socket) {
      socket.emit("start_game", { roomId: room.id });
    } else if (room.gameMode === "local") {
      if (room.players.length < 3) return;
      
      const pack = DEFAULT_PACKS[Math.floor(Math.random() * DEFAULT_PACKS.length)];
      const secretWord = pack.words[Math.floor(Math.random() * pack.words.length)];
      const fakerId = room.players[Math.floor(Math.random() * room.players.length)].id;
      
      set({
        room: {
          ...room,
          category: pack.name,
          secretWord,
          fakerId,
          status: "role_reveal",
          clues: [],
          votes: {},
          fakerGuess: null,
          winner: null,
        },
        localPlayerId: room.players[0].id // Start with first player for reveal
      });
    }
  },

  submitClue: (text: string) => {
    const { socket, room, localPlayerId } = get();
    if (!room) return;

    if (room.gameMode === "online" && socket) {
      socket.emit("submit_clue", { roomId: room.id, text });
    } else if (room.gameMode === "local" && localPlayerId) {
      const player = room.players.find(p => p.id === localPlayerId);
      if (!player) return;

      const newClues = [...room.clues, { playerId: localPlayerId, playerName: player.name, text }];
      
      const nextPlayerIndex = room.players.findIndex(p => p.id === localPlayerId) + 1;
      const nextPlayerId = nextPlayerIndex < room.players.length ? room.players[nextPlayerIndex].id : null;

      set({
        room: {
          ...room,
          clues: newClues,
          status: nextPlayerId ? "clue_round" : "discussion",
        },
        localPlayerId: nextPlayerId,
      });
    }
  },

  submitVote: (votedId: string) => {
    const { socket, room, localPlayerId } = get();
    if (!room) return;

    if (room.gameMode === "online" && socket) {
      socket.emit("submit_vote", { roomId: room.id, votedId });
    } else if (room.gameMode === "local" && localPlayerId) {
      const newVotes = { ...room.votes, [localPlayerId]: votedId };
      
      const nextPlayerIndex = room.players.findIndex(p => p.id === localPlayerId) + 1;
      const nextPlayerId = nextPlayerIndex < room.players.length ? room.players[nextPlayerIndex].id : null;

      set({
        room: {
          ...room,
          votes: newVotes,
        },
        localPlayerId: nextPlayerId,
      });
      
      if (!nextPlayerId) {
        get().nextPhase();
      }
    }
  },

  submitFakerGuess: (guess: string) => {
    const { socket, room } = get();
    if (!room) return;

    if (room.gameMode === "online" && socket) {
      socket.emit("submit_faker_guess", { roomId: room.id, guess });
    } else if (room.gameMode === "local") {
      let winner: "faker" | "group" = "group";
      const newPlayers = [...room.players];
      const faker = newPlayers.find(p => p.id === room.fakerId);
      
      if (guess.toLowerCase() === room.secretWord?.toLowerCase()) {
        winner = "faker";
        if (faker) faker.score += 2;
        newPlayers.forEach(p => {
          if (p.id !== room.fakerId) p.score += 1;
        });
      } else {
        newPlayers.forEach(p => {
          if (p.id !== room.fakerId) p.score += 2;
        });
      }

      set({
        room: {
          ...room,
          fakerGuess: guess,
          winner,
          status: "round_end",
          players: newPlayers,
        }
      });
    }
  },

  nextPhase: () => {
    const { socket, room } = get();
    if (!room) return;

    if (room.gameMode === "online" && socket) {
      socket.emit("next_phase", { roomId: room.id });
    } else if (room.gameMode === "local") {
      const newRoom = { ...room };
      
      if (room.status === "role_reveal") {
        newRoom.status = "clue_round";
        set({ room: newRoom, localPlayerId: room.players[0].id });
      } else if (room.status === "clue_round") {
        newRoom.status = "discussion";
        set({ room: newRoom, localPlayerId: null });
      } else if (room.status === "discussion") {
        newRoom.status = "vote";
        set({ room: newRoom, localPlayerId: room.players[0].id });
      } else if (room.status === "vote") {
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
          newRoom.status = "faker_guess";
        } else {
          newRoom.winner = "faker";
          newRoom.status = "round_end";
          const faker = newRoom.players.find(p => p.id === room.fakerId);
          if (faker) faker.score += 3;
        }
        set({ room: newRoom, localPlayerId: null });
      }
    }
  },

  playAgain: () => {
    const { socket, room } = get();
    if (!room) return;

    if (room.gameMode === "online" && socket) {
      socket.emit("play_again", { roomId: room.id });
    } else if (room.gameMode === "local") {
      const newRoom = { ...room };
      newRoom.currentRound++;
      if (newRoom.currentRound > newRoom.maxRounds) {
        newRoom.currentRound = 1;
        newRoom.players.forEach(p => p.score = 0);
      }
      
      const pack = DEFAULT_PACKS[Math.floor(Math.random() * DEFAULT_PACKS.length)];
      newRoom.category = pack.name;
      newRoom.secretWord = pack.words[Math.floor(Math.random() * pack.words.length)];
      newRoom.fakerId = newRoom.players[Math.floor(Math.random() * newRoom.players.length)].id;
      newRoom.status = "role_reveal";
      newRoom.clues = [];
      newRoom.votes = {};
      newRoom.fakerGuess = null;
      newRoom.winner = null;

      set({ room: newRoom, localPlayerId: newRoom.players[0].id });
    }
  },

  setError: (error: string | null) => set({ error }),
  setLocalPlayerId: (id: string | null) => set({ localPlayerId: id }),
}));
