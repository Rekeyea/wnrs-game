import { GameLevel } from '../enums/game-level.enum';

export interface Card {
  id: string;
  question: string;
  level: GameLevel;
  category?: string;
  isUsed: boolean;
}

export interface CardDeck {
  level1: Card[];
  level2: Card[];
  level3: Card[];
}

export interface UsedCard extends Card {
  playerId: string;
  playerName: string;
  answeredAt: Date;
}