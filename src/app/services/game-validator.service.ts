import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject } from 'rxjs';
import { GameState } from '../interfaces/game-state.interface';
import { Player } from '../interfaces/player.interface';
import { Card } from '../interfaces/card.interface';
import { GameLevel, GameStatus } from '../enums/game-level.enum';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

@Injectable({
  providedIn: 'root'
})
export class GameValidatorService {
  private validationSubject = new BehaviorSubject<ValidationResult>({
    isValid: true,
    errors: [],
    warnings: []
  });
  
  public validation$ = this.validationSubject.asObservable();

  constructor() { }

  /**
   * Valida el estado completo del juego
   */
  validateGameState(gameState: GameState): ValidationResult {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: []
    };

    // Validar jugadores
    const playerValidation = this.validatePlayers(gameState.players);
    result.errors.push(...playerValidation.errors);
    result.warnings.push(...playerValidation.warnings);

    // Validar índice del jugador actual
    if (gameState.currentPlayerIndex < 0 || gameState.currentPlayerIndex >= gameState.players.length) {
      result.errors.push('Índice de jugador actual inválido');
    }

    // Validar nivel actual
    if (!Object.values(GameLevel).includes(gameState.currentLevel)) {
      result.errors.push('Nivel de juego inválido');
    }

    // Validar estado del juego
    if (!Object.values(GameStatus).includes(gameState.status)) {
      result.errors.push('Estado de juego inválido');
    }

    // Validar cartas
    const cardValidation = this.validateCards(gameState.availableCards, gameState.usedCards);
    result.errors.push(...cardValidation.errors);
    result.warnings.push(...cardValidation.warnings);

    // Validar fechas
    if (gameState.startTime > new Date()) {
      result.errors.push('La fecha de inicio no puede ser futura');
    }

    if (gameState.endTime && gameState.endTime < gameState.startTime) {
      result.errors.push('La fecha de fin no puede ser anterior al inicio');
    }

    // Validar número de ronda
    if (gameState.roundNumber < 1) {
      result.errors.push('El número de ronda debe ser mayor a 0');
    }

    result.isValid = result.errors.length === 0;
    this.validationSubject.next(result);
    
    return result;
  }

  /**
   * Valida la lista de jugadores
   */
  validatePlayers(players: Player[]): ValidationResult {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: []
    };

    if (players.length === 0) {
      result.errors.push('Debe haber al menos un jugador');
      result.isValid = false;
      return result;
    }

    // Verificar nombres únicos
    const names = players.map(p => p.name.toLowerCase().trim());
    const uniqueNames = new Set(names);
    if (uniqueNames.size !== names.length) {
      result.errors.push('Los nombres de los jugadores deben ser únicos');
    }

    // Verificar que solo un jugador esté activo
    const activePlayers = players.filter(p => p.isActive);
    if (activePlayers.length !== 1) {
      result.errors.push('Debe haber exactamente un jugador activo');
    }

    // Validar cada jugador individualmente
    players.forEach((player, index) => {
      const playerValidation = this.validatePlayer(player, index);
      result.errors.push(...playerValidation.errors);
      result.warnings.push(...playerValidation.warnings);
    });

    result.isValid = result.errors.length === 0;
    return result;
  }

  /**
   * Valida un jugador individual
   */
  validatePlayer(player: Player, index?: number): ValidationResult {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: []
    };

    const prefix = index !== undefined ? `Jugador ${index + 1}: ` : '';

    // Validar nombre
    if (!player.name || player.name.trim().length === 0) {
      result.errors.push(`${prefix}El nombre no puede estar vacío`);
    }

    if (player.name && player.name.length > 50) {
      result.warnings.push(`${prefix}El nombre es muy largo`);
    }

    // Validar puntos
    if (player.points < 0) {
      result.errors.push(`${prefix}Los puntos no pueden ser negativos`);
    }

    if (player.points > 1000) {
      result.warnings.push(`${prefix}Puntos inusualmente altos`);
    }

    // Validar cartas respondidas
    if (player.cardsAnswered < 0) {
      result.errors.push(`${prefix}Las cartas respondidas no pueden ser negativas`);
    }

    if (player.cardsAnswered > player.points) {
      result.warnings.push(`${prefix}Más cartas respondidas que puntos obtenidos`);
    }

    // Validar nivel actual
    if (!Object.values(GameLevel).includes(player.currentLevel)) {
      result.errors.push(`${prefix}Nivel actual inválido`);
    }

    // Validar ID
    if (!player.id || player.id.trim().length === 0) {
      result.errors.push(`${prefix}ID de jugador inválido`);
    }

    result.isValid = result.errors.length === 0;
    return result;
  }

  /**
   * Valida las cartas del juego
   */
  validateCards(availableCards: Card[], usedCards: Card[]): ValidationResult {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: []
    };

    // Validar que no haya cartas duplicadas entre disponibles y usadas
    const allCardIds = [
      ...availableCards.map(c => c.id),
      ...usedCards.map(c => c.id)
    ];
    
    const uniqueCardIds = new Set(allCardIds);
    if (uniqueCardIds.size !== allCardIds.length) {
      result.errors.push('Hay cartas duplicadas en el juego');
    }

    // Validar cartas individuales
    [...availableCards, ...usedCards].forEach((card, index) => {
      const cardValidation = this.validateCard(card, index);
      result.errors.push(...cardValidation.errors);
      result.warnings.push(...cardValidation.warnings);
    });

    // Verificar distribución de cartas por nivel
    const cardsByLevel = [...availableCards, ...usedCards].reduce((acc, card) => {
      acc[card.level] = (acc[card.level] || 0) + 1;
      return acc;
    }, {} as Record<GameLevel, number>);

    Object.values(GameLevel).forEach(level => {
      const count = cardsByLevel[level as keyof typeof cardsByLevel] || 0;
      if (count === 0) {
        result.warnings.push(`No hay cartas para el nivel ${level}`);
      }
    });

    result.isValid = result.errors.length === 0;
    return result;
  }

  /**
   * Valida una carta individual
   */
  validateCard(card: Card, index?: number): ValidationResult {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: []
    };

    const prefix = index !== undefined ? `Carta ${index + 1}: ` : '';

    // Validar ID
    if (!card.id || card.id.trim().length === 0) {
      result.errors.push(`${prefix}ID de carta inválido`);
    }

    // Validar pregunta
    if (!card.question || card.question.trim().length === 0) {
      result.errors.push(`${prefix}La pregunta no puede estar vacía`);
    }

    if (card.question && card.question.length < 10) {
      result.warnings.push(`${prefix}La pregunta es muy corta`);
    }

    if (card.question && card.question.length > 500) {
      result.warnings.push(`${prefix}La pregunta es muy larga`);
    }

    // Validar nivel
    if (!Object.values(GameLevel).includes(card.level)) {
      result.errors.push(`${prefix}Nivel de carta inválido`);
    }

    // Validar estado de uso
    if (typeof card.isUsed !== 'boolean') {
      result.errors.push(`${prefix}Estado de uso inválido`);
    }

    result.isValid = result.errors.length === 0;
    return result;
  }

  /**
   * Valida una acción del jugador
   */
  validatePlayerAction(
    action: 'answer' | 'skip' | 'draw',
    player: Player,
    gameState: GameState,
    card?: Card
  ): ValidationResult {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: []
    };

    // Validar que el jugador esté activo
    if (!player.isActive) {
      result.errors.push('Solo el jugador activo puede realizar acciones');
    }

    // Validar estado del juego
    if (gameState.status !== GameStatus.IN_PROGRESS) {
      result.errors.push('No se pueden realizar acciones cuando el juego no está en progreso');
    }

    // Validaciones específicas por acción
    switch (action) {
      case 'answer':
      case 'skip':
        if (!card) {
          result.errors.push('Se requiere una carta para esta acción');
        } else if (card.isUsed) {
          result.errors.push('No se puede usar una carta que ya fue utilizada');
        }
        break;
      
      case 'draw':
        if (gameState.currentCard) {
          result.warnings.push('Ya hay una carta activa en el juego');
        }
        break;
    }

    result.isValid = result.errors.length === 0;
    return result;
  }

  /**
   * Obtiene el estado actual de validación
   */
  getCurrentValidation(): Observable<ValidationResult> {
    return this.validation$;
  }

  /**
   * Limpia los errores y advertencias
   */
  clearValidation(): void {
    this.validationSubject.next({
      isValid: true,
      errors: [],
      warnings: []
    });
  }
}