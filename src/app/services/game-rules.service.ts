import { Injectable } from '@angular/core';
import { Player } from '../interfaces/player.interface';
import { Card } from '../interfaces/card.interface';
import { GameState } from '../interfaces/game-state.interface';
import { GameLevel, GameStatus } from '../enums/game-level.enum';
import { GAME_CONFIG } from '../data/game-config';

@Injectable({
  providedIn: 'root'
})
export class GameRulesService {

  constructor() { }

  /**
   * Valida si se puede iniciar un juego con los jugadores dados
   */
  canStartGame(playerNames: string[]): { valid: boolean; message?: string } {
    if (playerNames.length < GAME_CONFIG.MIN_PLAYERS) {
      return {
        valid: false,
        message: `Se necesitan al menos ${GAME_CONFIG.MIN_PLAYERS} jugadores para comenzar`
      };
    }

    if (playerNames.length > GAME_CONFIG.MAX_PLAYERS) {
      return {
        valid: false,
        message: `No se pueden tener más de ${GAME_CONFIG.MAX_PLAYERS} jugadores`
      };
    }

    const uniqueNames = new Set(playerNames.map(name => name.toLowerCase().trim()));
    if (uniqueNames.size !== playerNames.length) {
      return {
        valid: false,
        message: 'Todos los jugadores deben tener nombres únicos'
      };
    }

    const emptyNames = playerNames.some(name => !name.trim());
    if (emptyNames) {
      return {
        valid: false,
        message: 'Todos los jugadores deben tener un nombre válido'
      };
    }

    return { valid: true };
  }

  /**
   * Determina si un jugador puede responder una carta
   */
  canPlayerAnswerCard(player: Player, card: Card, gameState: GameState): boolean {
    if (!player.isActive) return false;
    if (gameState.status !== GameStatus.IN_PROGRESS) return false;
    if (!card) return false;
    if (card.isUsed) return false;
    return true;
  }

  /**
   * Determina si un jugador puede saltarse una carta
   */
  canPlayerSkipCard(player: Player, card: Card, gameState: GameState): boolean {
    if (!player.isActive) return false;
    if (gameState.status !== GameStatus.IN_PROGRESS) return false;
    if (!card) return false;
    return true;
  }

  /**
   * Calcula los puntos que debe recibir un jugador por responder una carta
   */
  calculatePointsForAnswer(card: Card, player: Player): number {
    let basePoints = GAME_CONFIG.ANSWER_CARD_POINTS;

    // Bonus points para preguntas de nivel superior
    switch (card.level) {
      case GameLevel.CONNECTION:
        basePoints += 0; // Sin bonus por ahora
        break;
      case GameLevel.REFLECTION:
        basePoints += 0; // Sin bonus por ahora
        break;
    }

    return basePoints;
  }

  /**
   * Determina si todos los jugadores están listos para avanzar de nivel
   */
  areAllPlayersReadyToAdvance(players: Player[]): boolean {
    if (players.length === 0) return false;
    return players.every(player => player.points >= GAME_CONFIG.POINTS_TO_ADVANCE);
  }

  /**
   * Determina el siguiente nivel del juego
   */
  getNextLevel(currentLevel: GameLevel): GameLevel | null {
    switch (currentLevel) {
      case GameLevel.PERCEPTION:
        return GameLevel.CONNECTION;
      case GameLevel.CONNECTION:
        return GameLevel.REFLECTION;
      case GameLevel.REFLECTION:
        return null; // Juego completado
      default:
        return null;
    }
  }

  /**
   * Valida si el juego puede continuar
   */
  canGameContinue(gameState: GameState, availableCards: Card[]): { canContinue: boolean; reason?: string } {
    if (gameState.status === GameStatus.GAME_OVER) {
      return { canContinue: false, reason: 'El juego ha terminado' };
    }

    if (gameState.status === GameStatus.PAUSED) {
      return { canContinue: false, reason: 'El juego está pausado' };
    }

    const cardsForCurrentLevel = availableCards.filter(
      card => card.level === gameState.currentLevel && !card.isUsed
    );

    if (cardsForCurrentLevel.length === 0) {
      const nextLevel = this.getNextLevel(gameState.currentLevel);
      if (!nextLevel) {
        return { canContinue: false, reason: 'No hay más niveles disponibles' };
      }

      const cardsForNextLevel = availableCards.filter(
        card => card.level === nextLevel && !card.isUsed
      );

      if (cardsForNextLevel.length === 0) {
        return { canContinue: false, reason: 'No hay más cartas disponibles' };
      }
    }

    return { canContinue: true };
  }

  /**
   * Calcula el progreso del juego
   */
  calculateGameProgress(gameState: GameState, usedCards: Card[]): {
    totalProgress: number;
    levelProgress: number;
    cardsRemaining: number;
    estimatedTimeRemaining: number;
  } {
    const totalCards = GAME_CONFIG.CARDS_PER_LEVEL * GAME_CONFIG.TOTAL_LEVELS;
    const cardsUsed = usedCards.length;
    const totalProgress = (cardsUsed / totalCards) * 100;

    const cardsUsedInCurrentLevel = usedCards.filter(
      card => card.level === gameState.currentLevel
    ).length;
    const levelProgress = (cardsUsedInCurrentLevel / GAME_CONFIG.CARDS_PER_LEVEL) * 100;

    const cardsRemaining = totalCards - cardsUsed;

    // Estimación basada en tiempo promedio por carta (3 minutos)
    const avgTimePerCard = 3; // minutos
    const estimatedTimeRemaining = cardsRemaining * avgTimePerCard;

    return {
      totalProgress: Math.min(totalProgress, 100),
      levelProgress: Math.min(levelProgress, 100),
      cardsRemaining,
      estimatedTimeRemaining
    };
  }

  /**
   * Determina el ganador del juego
   */
  determineWinner(players: Player[]): Player[] {
    if (players.length === 0) return [];

    const maxPoints = Math.max(...players.map(p => p.points));
    const winners = players.filter(p => p.points === maxPoints);

    // En caso de empate, se considera el número de cartas respondidas
    if (winners.length > 1) {
      const maxCards = Math.max(...winners.map(p => p.cardsAnswered));
      return winners.filter(p => p.cardsAnswered === maxCards);
    }

    return winners;
  }

  /**
   * Valida una transición de estado del juego
   */
  validateGameStateTransition(
    fromStatus: GameStatus,
    toStatus: GameStatus
  ): { valid: boolean; message?: string } {
    const validTransitions: Record<GameStatus, GameStatus[]> = {
      [GameStatus.SETUP]: [GameStatus.IN_PROGRESS],
      [GameStatus.IN_PROGRESS]: [
        GameStatus.PAUSED,
        GameStatus.LEVEL_COMPLETE,
        GameStatus.GAME_OVER
      ],
      [GameStatus.PAUSED]: [GameStatus.IN_PROGRESS, GameStatus.GAME_OVER],
      [GameStatus.LEVEL_COMPLETE]: [GameStatus.IN_PROGRESS, GameStatus.GAME_OVER],
      [GameStatus.GAME_OVER]: [] // Estado final
    };

    const allowedTransitions = validTransitions[fromStatus] || [];
    const isValid = allowedTransitions.includes(toStatus);

    return {
      valid: isValid,
      message: isValid ? undefined : `No se puede cambiar de ${fromStatus} a ${toStatus}`
    };
  }

  /**
   * Genera estadísticas del juego
   */
  generateGameStats(gameState: GameState, players: Player[], usedCards: Card[]): any {
    const progress = this.calculateGameProgress(gameState, usedCards);
    const winners = this.determineWinner(players);
    
    const totalPoints = players.reduce((sum, p) => sum + p.points, 0);
    const avgPointsPerPlayer = players.length > 0 ? totalPoints / players.length : 0;
    
    const gameTime = gameState.endTime 
      ? gameState.endTime.getTime() - gameState.startTime.getTime()
      : Date.now() - gameState.startTime.getTime();

    return {
      gameId: gameState.id,
      duration: gameTime,
      totalPlayers: players.length,
      totalCards: usedCards.length,
      totalPoints,
      avgPointsPerPlayer: Math.round(avgPointsPerPlayer * 100) / 100,
      winners: winners.map(w => w.name),
      currentLevel: gameState.currentLevel,
      progress,
      playersStats: players.map(player => ({
        name: player.name,
        points: player.points,
        cardsAnswered: player.cardsAnswered,
        level: player.currentLevel
      }))
    };
  }
}