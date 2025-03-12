export interface Player {
  id: string;
  name: string;
  score: number;
  gamesWon: number;
  currentTurn: boolean;
  marks: {
    [key: string]: number; // Maps number (20-12, D, T, B) to marks count (0-3)
  };
  closedNumbers: string[]; // Numbers that have been closed by this player
  arrowsThrown?: number; // Number of arrows thrown in the current turn (0-3)
}

export interface Game {
  id: string;
  players: Player[];
  currentPlayerIndex: number;
  isActive: boolean;
  startTime: number;
  endTime?: number;
  winner?: string;
  gameType: 'mickeyMouse';
  targetNumbers: string[]; // Numbers to close in the game (20-12, D, T, B)
}

export interface GameHistory {
  id: string;
  gameId: string;
  playerId: string;
  playerName: string;
  score: number;
  isWinner: boolean;
  timestamp: number;
}

export type MarkType = 0 | 1 | 2 | 3; // 0: none, 1: /, 2: X, 3: O

export interface DartHit {
  number: string; // The number hit (20-12, D, T, B)
  multiplier: 1 | 2 | 3; // 1: single, 2: double, 3: triple
} 