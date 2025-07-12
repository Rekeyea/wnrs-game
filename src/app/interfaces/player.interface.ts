export interface Player {
  id: string;
  name: string;
  points: number;
  isActive: boolean;
  cardsAnswered: number;
  currentLevel: number;
}

export interface PlayerStats {
  totalCardsAnswered: number;
  totalPointsEarned: number;
  highestLevelReached: number;
  gameCompletionTime?: number;
}