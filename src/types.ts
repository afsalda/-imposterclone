export interface Player {
  id: string;
  name: string;
  score: number;
  isHost: boolean;
}

export interface Clue {
  playerId: string;
  playerName: string;
  text: string;
}

export type GameStatus = 
  | "lobby" 
  | "role_reveal" 
  | "clue_round" 
  | "discussion" 
  | "vote" 
  | "vote_reveal" 
  | "faker_guess" 
  | "round_end";

export type GameMode = "online" | "local";

export interface RoomState {
  id: string;
  gameMode: GameMode;
  players: Player[];
  status: GameStatus;
  currentRound: number;
  maxRounds: number;
  fakerId: string | null;
  secretWord: string | null;
  category: string | null;
  clues: Clue[];
  votes: Record<string, string>;
  fakerGuess: string | null;
  winner: "group" | "faker" | null;
  settings: {
    timer: number;
    fakerCount: number;
  };
}
