import { Injectable } from '@angular/core';
import { GameState, GameHistory } from '../interfaces/game-state.interface';
import { STORAGE_KEYS } from '../data/game-config';

@Injectable({
  providedIn: 'root'
})
export class StorageService {

  constructor() { }

  saveGameState(gameState: GameState): void {
    try {
      const serializedState = JSON.stringify(gameState);
      localStorage.setItem(STORAGE_KEYS.GAME_STATE, serializedState);
    } catch (error) {
      console.error('Error saving game state:', error);
    }
  }

  loadGameState(): GameState | null {
    try {
      const serializedState = localStorage.getItem(STORAGE_KEYS.GAME_STATE);
      if (!serializedState) return null;
      
      const gameState = JSON.parse(serializedState);
      gameState.startTime = new Date(gameState.startTime);
      if (gameState.endTime) {
        gameState.endTime = new Date(gameState.endTime);
      }
      
      return gameState;
    } catch (error) {
      console.error('Error loading game state:', error);
      return null;
    }
  }

  clearGameState(): void {
    localStorage.removeItem(STORAGE_KEYS.GAME_STATE);
  }

  saveGameHistory(gameHistory: GameHistory): void {
    try {
      const existingHistory = this.loadGameHistory();
      const updatedHistory = [...existingHistory, gameHistory];
      
      const serializedHistory = JSON.stringify(updatedHistory);
      localStorage.setItem(STORAGE_KEYS.GAME_HISTORY, serializedHistory);
    } catch (error) {
      console.error('Error saving game history:', error);
    }
  }

  loadGameHistory(): GameHistory[] {
    try {
      const serializedHistory = localStorage.getItem(STORAGE_KEYS.GAME_HISTORY);
      if (!serializedHistory) return [];
      
      const history = JSON.parse(serializedHistory);
      return history.map((game: any) => ({
        ...game,
        completedAt: new Date(game.completedAt)
      }));
    } catch (error) {
      console.error('Error loading game history:', error);
      return [];
    }
  }

  clearGameHistory(): void {
    localStorage.removeItem(STORAGE_KEYS.GAME_HISTORY);
  }

  savePlayerPreferences(preferences: any): void {
    try {
      const serializedPrefs = JSON.stringify(preferences);
      localStorage.setItem(STORAGE_KEYS.PLAYER_PREFERENCES, serializedPrefs);
    } catch (error) {
      console.error('Error saving player preferences:', error);
    }
  }

  loadPlayerPreferences(): any {
    try {
      const serializedPrefs = localStorage.getItem(STORAGE_KEYS.PLAYER_PREFERENCES);
      return serializedPrefs ? JSON.parse(serializedPrefs) : {};
    } catch (error) {
      console.error('Error loading player preferences:', error);
      return {};
    }
  }

  clearAllData(): void {
    this.clearGameState();
    this.clearGameHistory();
    localStorage.removeItem(STORAGE_KEYS.PLAYER_PREFERENCES);
  }

  hasActiveGame(): boolean {
    return !!this.loadGameState();
  }
}