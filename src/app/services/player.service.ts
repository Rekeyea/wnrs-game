import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Player, PlayerStats } from '../interfaces/player.interface';
import { GAME_CONFIG } from '../data/game-config';

@Injectable({
  providedIn: 'root'
})
export class PlayerService {
  private playersSubject = new BehaviorSubject<Player[]>([]);
  public players$ = this.playersSubject.asObservable();

  private currentPlayerIndexSubject = new BehaviorSubject<number>(0);
  public currentPlayerIndex$ = this.currentPlayerIndexSubject.asObservable();

  constructor() { }

  createPlayers(playerNames: string[]): Player[] {
    if (playerNames.length < GAME_CONFIG.MIN_PLAYERS || playerNames.length > GAME_CONFIG.MAX_PLAYERS) {
      throw new Error(`Number of players must be between ${GAME_CONFIG.MIN_PLAYERS} and ${GAME_CONFIG.MAX_PLAYERS}`);
    }

    const players: Player[] = playerNames.map((name, index) => ({
      id: this.generatePlayerId(),
      name: name.trim(),
      points: 0,
      isActive: index === 0,
      cardsAnswered: 0,
      currentLevel: 1
    }));

    this.playersSubject.next(players);
    this.currentPlayerIndexSubject.next(0);
    return players;
  }

  getCurrentPlayer(): Player | null {
    const players = this.playersSubject.value;
    const currentIndex = this.currentPlayerIndexSubject.value;
    return players[currentIndex] || null;
  }

  nextPlayer(): Player | null {
    const players = this.playersSubject.value;
    if (players.length === 0) return null;

    const currentIndex = this.currentPlayerIndexSubject.value;
    const nextIndex = (currentIndex + 1) % players.length;
    
    const updatedPlayers = players.map((player, index) => ({
      ...player,
      isActive: index === nextIndex
    }));

    this.playersSubject.next(updatedPlayers);
    this.currentPlayerIndexSubject.next(nextIndex);
    
    return updatedPlayers[nextIndex];
  }

  addPointsToCurrentPlayer(points: number = GAME_CONFIG.ANSWER_CARD_POINTS): Player | null {
    const players = this.playersSubject.value;
    const currentIndex = this.currentPlayerIndexSubject.value;
    
    if (currentIndex >= players.length) return null;

    const updatedPlayers = [...players];
    updatedPlayers[currentIndex] = {
      ...updatedPlayers[currentIndex],
      points: updatedPlayers[currentIndex].points + points,
      cardsAnswered: updatedPlayers[currentIndex].cardsAnswered + 1
    };

    this.playersSubject.next(updatedPlayers);
    return updatedPlayers[currentIndex];
  }

  updatePlayerLevel(playerId: string, level: number): void {
    const players = this.playersSubject.value;
    const updatedPlayers = players.map(player => 
      player.id === playerId 
        ? { ...player, currentLevel: level }
        : player
    );
    this.playersSubject.next(updatedPlayers);
  }

  resetPlayerPointsForLevel(): void {
    const players = this.playersSubject.value;
    const updatedPlayers = players.map(player => ({
      ...player,
      points: 0
    }));
    this.playersSubject.next(updatedPlayers);
  }

  canPlayerAdvanceLevel(player: Player): boolean {
    return player.points >= GAME_CONFIG.POINTS_TO_ADVANCE;
  }

  getPlayerStats(player: Player): PlayerStats {
    return {
      totalCardsAnswered: player.cardsAnswered,
      totalPointsEarned: player.points,
      highestLevelReached: player.currentLevel
    };
  }

  getLeaderboard(): Player[] {
    return [...this.playersSubject.value].sort((a, b) => {
      if (b.points !== a.points) {
        return b.points - a.points;
      }
      return b.cardsAnswered - a.cardsAnswered;
    });
  }

  resetPlayers(): void {
    this.playersSubject.next([]);
    this.currentPlayerIndexSubject.next(0);
  }

  setPlayers(players: Player[]): void {
    this.playersSubject.next(players);
    const activePlayerIndex = players.findIndex(p => p.isActive);
    this.currentPlayerIndexSubject.next(activePlayerIndex >= 0 ? activePlayerIndex : 0);
  }

  getPlayers(): Player[] {
    return this.playersSubject.value;
  }

  private generatePlayerId(): string {
    return 'player_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }
}