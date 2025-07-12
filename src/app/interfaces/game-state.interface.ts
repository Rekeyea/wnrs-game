import { Player } from './player.interface';
import { Card, UsedCard } from './card.interface';
import { GameLevel, GameStatus } from '../enums/game-level.enum';

export interface GameState {
  id: string;
  players: Player[];
  currentPlayerIndex: number;
  currentLevel: GameLevel;
  currentCard: Card | null;
  usedCards: UsedCard[];
  availableCards: Card[];
  status: GameStatus;
  startTime: Date;
  endTime?: Date;
  roundNumber: number;
}

export interface GameHistory {
  gameId: string;
  players: string[];
  completedAt: Date;
  finalScores: { [playerId: string]: number };
  totalDuration: number;
}

export interface GameSettings {
  pointsToAdvance: number;
  cardsPerLevel: number;
  allowSkipCard: boolean;
  shuffleCards: boolean;
}