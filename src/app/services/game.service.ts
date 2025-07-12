import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { GameState, GameHistory } from '../interfaces/game-state.interface';
import { Player } from '../interfaces/player.interface';
import { Card } from '../interfaces/card.interface';
import { GameLevel, GameStatus } from '../enums/game-level.enum';
import { PlayerService } from './player.service';
import { CardService } from './card.service';
import { StorageService } from './storage.service';
import { GAME_CONFIG } from '../data/game-config';

@Injectable({
  providedIn: 'root'
})
export class GameService {
  private gameStateSubject = new BehaviorSubject<GameState | null>(null);
  public gameState$ = this.gameStateSubject.asObservable();

  private currentLevelSubject = new BehaviorSubject<GameLevel>(GameLevel.PERCEPTION);
  public currentLevel$ = this.currentLevelSubject.asObservable();

  constructor(
    private playerService: PlayerService,
    private cardService: CardService,
    private storageService: StorageService
  ) {
    this.loadGameFromStorage();
  }

  initializeGame(playerNames: string[]): GameState {
    try {
      const players = this.playerService.createPlayers(playerNames);
      this.cardService.initializeCards();
      
      const gameState: GameState = {
        id: this.generateGameId(),
        players,
        currentPlayerIndex: 0,
        currentLevel: GameLevel.PERCEPTION,
        currentCard: null,
        usedCards: [],
        availableCards: this.cardService.getAllCards(),
        status: GameStatus.IN_PROGRESS,
        startTime: new Date(),
        roundNumber: 1
      };

      this.gameStateSubject.next(gameState);
      this.currentLevelSubject.next(GameLevel.PERCEPTION);
      this.saveGameState();
      
      return gameState;
    } catch (error) {
      console.error('Error initializing game:', error);
      throw error;
    }
  }

  startTurn(): Card | null {
    const gameState = this.gameStateSubject.value;
    if (!gameState || gameState.status !== GameStatus.IN_PROGRESS) {
      return null;
    }

    const currentCard = this.cardService.drawCardForLevel(gameState.currentLevel);
    if (!currentCard) {
      this.handleNoMoreCards();
      return null;
    }

    const updatedGameState: GameState = {
      ...gameState,
      currentCard
    };

    this.gameStateSubject.next(updatedGameState);
    this.saveGameState();
    
    return currentCard;
  }

  answerCard(): boolean {
    const gameState = this.gameStateSubject.value;
    const currentPlayer = this.playerService.getCurrentPlayer();
    
    if (!gameState || !currentPlayer || !gameState.currentCard) {
      return false;
    }

    this.cardService.markCardAsUsed(currentPlayer.id, currentPlayer.name);
    this.playerService.addPointsToCurrentPlayer();

    const updatedPlayer = this.playerService.getCurrentPlayer();
    if (updatedPlayer && this.canPlayerAdvanceLevel(updatedPlayer)) {
      this.checkLevelAdvancement();
    }

    this.nextTurn();
    this.startTurn();
    return true;
  }

  skipCard(): void {
    this.cardService.skipCurrentCard();
    this.nextTurn();
    this.startTurn();
  }

  nextTurn(): void {
    this.playerService.nextPlayer();
    
    const gameState = this.gameStateSubject.value;
    if (!gameState) return;

    const updatedGameState: GameState = {
      ...gameState,
      currentPlayerIndex: this.playerService.getPlayers().findIndex(p => p.isActive),
      currentCard: null,
      roundNumber: gameState.roundNumber + 1
    };

    this.gameStateSubject.next(updatedGameState);
    this.saveGameState();
  }

  canPlayerAdvanceLevel(player: Player): boolean {
    return this.playerService.canPlayerAdvanceLevel(player);
  }

  checkLevelAdvancement(): void {
    const gameState = this.gameStateSubject.value;
    if (!gameState) return;

    const players = this.playerService.getPlayers();
    const playersReadyToAdvance = players.filter(p => this.canPlayerAdvanceLevel(p));

    if (playersReadyToAdvance.length === players.length) {
      this.advanceToNextLevel();
    }
  }

  advanceToNextLevel(): void {
    const gameState = this.gameStateSubject.value;
    if (!gameState) return;

    const nextLevel = this.getNextLevel(gameState.currentLevel);
    if (!nextLevel) {
      this.endGame();
      return;
    }

    const players = this.playerService.getPlayers();
    players.forEach(player => {
      this.playerService.updatePlayerLevel(player.id, nextLevel);
    });
    this.playerService.resetPlayerPointsForLevel();
    
    // Reset to first player for new level - get updated players after points reset
    const playersAfterReset = this.playerService.getPlayers();
    const updatedPlayers = playersAfterReset.map((player, index) => ({
      ...player,
      isActive: index === 0
    }));
    this.playerService.setPlayers(updatedPlayers);

    const updatedGameState: GameState = {
      ...gameState,
      currentLevel: nextLevel,
      currentPlayerIndex: 0,
      currentCard: null,
      status: GameStatus.LEVEL_COMPLETE
    };

    this.gameStateSubject.next(updatedGameState);
    this.currentLevelSubject.next(nextLevel);
    
    setTimeout(() => {
      this.continueToNextLevel();
    }, 2000);
  }

  continueToNextLevel(): void {
    const gameState = this.gameStateSubject.value;
    if (!gameState) return;

    const updatedGameState: GameState = {
      ...gameState,
      status: GameStatus.IN_PROGRESS
    };

    this.gameStateSubject.next(updatedGameState);
    this.saveGameState();
    
    // Automatically draw a new card for the new level
    this.startTurn();
  }

  endGame(): void {
    const gameState = this.gameStateSubject.value;
    if (!gameState) return;

    const finalGameState: GameState = {
      ...gameState,
      status: GameStatus.GAME_OVER,
      endTime: new Date()
    };

    this.gameStateSubject.next(finalGameState);
    
    const gameHistory: GameHistory = {
      gameId: gameState.id,
      players: gameState.players.map(p => p.name),
      completedAt: new Date(),
      finalScores: gameState.players.reduce((acc, player) => {
        acc[player.id] = player.points;
        return acc;
      }, {} as { [playerId: string]: number }),
      totalDuration: finalGameState.endTime!.getTime() - gameState.startTime.getTime()
    };

    this.storageService.saveGameHistory(gameHistory);
    this.storageService.clearGameState();
  }

  pauseGame(): void {
    const gameState = this.gameStateSubject.value;
    if (!gameState) return;

    const updatedGameState: GameState = {
      ...gameState,
      status: GameStatus.PAUSED
    };

    this.gameStateSubject.next(updatedGameState);
    this.saveGameState();
  }

  resumeGame(): void {
    const gameState = this.gameStateSubject.value;
    if (!gameState) return;

    const updatedGameState: GameState = {
      ...gameState,
      status: GameStatus.IN_PROGRESS
    };

    this.gameStateSubject.next(updatedGameState);
    this.saveGameState();
  }

  resetGame(): void {
    this.playerService.resetPlayers();
    this.cardService.resetCards();
    this.gameStateSubject.next(null);
    this.currentLevelSubject.next(GameLevel.PERCEPTION);
    this.storageService.clearGameState();
  }

  getGameStats() {
    const gameState = this.gameStateSubject.value;
    if (!gameState) return null;

    return {
      totalPlayers: gameState.players.length,
      currentRound: gameState.roundNumber,
      cardsPlayed: this.cardService.getUsedCards().length,
      gameTime: gameState.endTime 
        ? gameState.endTime.getTime() - gameState.startTime.getTime()
        : Date.now() - gameState.startTime.getTime()
    };
  }

  hasActiveGame(): boolean {
    return this.storageService.hasActiveGame();
  }

  private loadGameFromStorage(): void {
    const savedGameState = this.storageService.loadGameState();
    if (savedGameState) {
      this.gameStateSubject.next(savedGameState);
      this.currentLevelSubject.next(savedGameState.currentLevel);
      this.playerService.setPlayers(savedGameState.players);
      this.cardService.setCards(
        savedGameState.availableCards,
        savedGameState.usedCards,
        savedGameState.currentCard
      );
    }
  }

  private saveGameState(): void {
    const gameState = this.gameStateSubject.value;
    if (gameState) {
      this.storageService.saveGameState(gameState);
    }
  }

  private getNextLevel(currentLevel: GameLevel): GameLevel | null {
    switch (currentLevel) {
      case GameLevel.PERCEPTION:
        return GameLevel.CONNECTION;
      case GameLevel.CONNECTION:
        return GameLevel.REFLECTION;
      case GameLevel.REFLECTION:
        return null;
      default:
        return null;
    }
  }

  private handleNoMoreCards(): void {
    this.endGame();
  }

  private generateGameId(): string {
    return 'game_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }
}