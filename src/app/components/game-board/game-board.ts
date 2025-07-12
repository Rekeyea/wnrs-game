import { Component, OnInit, OnDestroy, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable, Subject, takeUntil } from 'rxjs';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatChipsModule } from '@angular/material/chips';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatDialogModule } from '@angular/material/dialog';

import { GameService } from '../../services/game.service';
import { PlayerService } from '../../services/player.service';
import { CardService } from '../../services/card.service';
import { Router } from '@angular/router';
import { GameState } from '../../interfaces/game-state.interface';
import { Player } from '../../interfaces/player.interface';
import { Card } from '../../interfaces/card.interface';
import { GameLevel, GameStatus } from '../../enums/game-level.enum';
import { GAME_CONFIG, LEVEL_NAMES, LEVEL_DESCRIPTIONS } from '../../data/game-config';

@Component({
  selector: 'app-game-board',
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    MatChipsModule,
    MatSnackBarModule,
    MatDialogModule
  ],
  templateUrl: './game-board.html',
  styleUrl: './game-board.css'
})
export class GameBoard implements OnInit, OnDestroy {
  @Input() players: string[] = [];

  gameState$: Observable<GameState | null>;
  currentLevel$: Observable<GameLevel>;
  currentCard$: Observable<Card | null>;
  players$: Observable<Player[]>;

  currentPlayer: Player | null = null;
  currentCard: Card | null = null;
  gameState: GameState | null = null;
  
  levelNames = LEVEL_NAMES;
  levelDescriptions = LEVEL_DESCRIPTIONS;
  gameConfig = GAME_CONFIG;
  
  private destroy$ = new Subject<void>();

  constructor(
    private gameService: GameService,
    private playerService: PlayerService,
    private cardService: CardService,
    private snackBar: MatSnackBar,
    private router: Router
  ) {
    this.gameState$ = this.gameService.gameState$;
    this.currentLevel$ = this.gameService.currentLevel$;
    this.currentCard$ = this.cardService.currentCard$;
    this.players$ = this.playerService.players$;
  }

  ngOnInit(): void {
    this.initializeGame();
    this.subscribeToGameState();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeGame(): void {
    if (this.players && this.players.length > 0) {
      try {
        this.gameService.initializeGame(this.players);
        this.snackBar.open(
          '¡Juego iniciado! Comencemos con el primer turno.',
          'Cerrar',
          { duration: 3000 }
        );
      } catch (error) {
        this.snackBar.open(
          'Error al inicializar el juego',
          'Cerrar',
          { duration: 3000 }
        );
      }
    }
  }

  private subscribeToGameState(): void {
    this.gameState$
      .pipe(takeUntil(this.destroy$))
      .subscribe(state => {
        this.gameState = state;
        this.handleGameStateChange(state);
      });

    this.players$
      .pipe(takeUntil(this.destroy$))
      .subscribe(players => {
        this.currentPlayer = players.find(p => p.isActive) || null;
      });

    this.currentCard$
      .pipe(takeUntil(this.destroy$))
      .subscribe(card => {
        this.currentCard = card;
      });
  }

  private handleGameStateChange(state: GameState | null): void {
    if (!state) return;

    switch (state.status) {
      case GameStatus.LEVEL_COMPLETE:
        this.showLevelCompleteMessage(state.currentLevel);
        break;
      case GameStatus.GAME_OVER:
        this.showGameOverMessage();
        break;
    }
  }

  drawCard(): void {
    if (!this.gameState || this.gameState.status !== GameStatus.IN_PROGRESS) {
      return;
    }

    const card = this.gameService.startTurn();
    if (!card) {
      this.snackBar.open(
        'No hay más cartas disponibles para este nivel',
        'Cerrar',
        { duration: 3000 }
      );
    }
  }

  answerCard(): void {
    if (!this.currentCard || !this.currentPlayer) {
      return;
    }

    const success = this.gameService.answerCard();
    if (success) {
      this.snackBar.open(
        `¡${this.currentPlayer.name} respondió la pregunta! +1 punto`,
        'Cerrar',
        { duration: 2000 }
      );
    }
  }

  skipCard(): void {
    if (!this.currentCard) {
      return;
    }

    this.gameService.skipCard();
    this.snackBar.open(
      'Pregunta omitida. Siguiente turno.',
      'Cerrar',
      { duration: 2000 }
    );
  }

  nextTurn(): void {
    this.gameService.nextTurn();
  }

  pauseGame(): void {
    this.gameService.pauseGame();
    this.snackBar.open(
      'Juego pausado',
      'Reanudar',
      { duration: 5000 }
    ).onAction().subscribe(() => {
      this.gameService.resumeGame();
    });
  }

  getPlayerProgress(player: Player): number {
    return (player.points / this.gameConfig.POINTS_TO_ADVANCE) * 100;
  }

  canPlayerAdvance(player: Player): boolean {
    return this.gameService.canPlayerAdvanceLevel(player);
  }

  getCurrentLevelName(): string {
    if (!this.gameState) return '';
    return this.levelNames[this.gameState.currentLevel] || '';
  }

  getCurrentLevelDescription(): string {
    if (!this.gameState) return '';
    return this.levelDescriptions[this.gameState.currentLevel] || '';
  }

  getRemainingCards(): number {
    if (!this.gameState) return 0;
    return this.cardService.getRemainingCardsCount(this.gameState.currentLevel);
  }

  getGameStats() {
    return this.gameService.getGameStats();
  }

  isGameInProgress(): boolean {
    return this.gameState?.status === GameStatus.IN_PROGRESS;
  }

  isLevelComplete(): boolean {
    return this.gameState?.status === GameStatus.LEVEL_COMPLETE;
  }

  isGameOver(): boolean {
    return this.gameState?.status === GameStatus.GAME_OVER;
  }

  hasCurrentCard(): boolean {
    return !!this.currentCard;
  }

  private showLevelCompleteMessage(level: GameLevel): void {
    const levelName = this.levelNames[level];
    this.snackBar.open(
      `¡Nivel ${levelName} completado! Avanzando al siguiente nivel...`,
      'Cerrar',
      { duration: 3000 }
    );
  }

  private showGameOverMessage(): void {
    this.snackBar.open(
      '¡Juego completado! Todos los niveles han sido superados.',
      'Cerrar',
      { duration: 3000 }
    );
    
    // Navegar a la pantalla de game-over después de un breve delay
    setTimeout(() => {
      this.router.navigate(['/game-over']);
    }, 3000);
  }
}
