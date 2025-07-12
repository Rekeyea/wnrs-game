import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { trigger, state, style, transition, animate } from '@angular/animations';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialogModule } from '@angular/material/dialog';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';

import { GameState, GameHistory } from '../../interfaces/game-state.interface';
import { Player } from '../../interfaces/player.interface';
import { UsedCard } from '../../interfaces/card.interface';
import { GameRulesService } from '../../services/game-rules.service';
import { StorageService } from '../../services/storage.service';
import { Router } from '@angular/router';
import { LEVEL_NAMES } from '../../data/game-config';

@Component({
  selector: 'app-game-over',
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    MatChipsModule,
    MatDialogModule,
    MatSnackBarModule,
    MatTableModule
  ],
  templateUrl: './game-over.html',
  styleUrl: './game-over.css',
  animations: [
    trigger('celebrationAnimation', [
      state('in', style({
        opacity: 1,
        transform: 'scale(1)'
      })),
      transition('void => *', [
        style({
          opacity: 0,
          transform: 'scale(0.8)'
        }),
        animate('600ms ease-out')
      ])
    ]),
    trigger('slideInFromBottom', [
      state('in', style({
        opacity: 1,
        transform: 'translateY(0)'
      })),
      transition('void => *', [
        style({
          opacity: 0,
          transform: 'translateY(30px)'
        }),
        animate('400ms {{ delay }}ms ease-out')
      ])
    ]),
    trigger('fadeInScale', [
      state('in', style({
        opacity: 1,
        transform: 'scale(1)'
      })),
      transition('void => *', [
        style({
          opacity: 0,
          transform: 'scale(0.9)'
        }),
        animate('500ms ease-out')
      ])
    ])
  ]
})
export class GameOverComponent implements OnInit {
  @Input() gameState: GameState | null = null;
  @Input() players: Player[] = [];
  @Input() usedCards: UsedCard[] = [];
  @Input() showDetailedStats: boolean = true;

  @Output() newGameRequested = new EventEmitter<void>();
  @Output() backToMenuRequested = new EventEmitter<void>();

  winners: Player[] = [];
  gameStats: any = {};
  levelNames = LEVEL_NAMES;
  displayedColumns: string[] = ['position', 'name', 'points', 'cards', 'level'];

  constructor(
    private gameRulesService: GameRulesService,
    private storageService: StorageService,
    private snackBar: MatSnackBar,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.initializeGameOverData();
  }

  private initializeGameOverData(): void {
    if (!this.gameState || this.players.length === 0) return;

    // Determinar ganadores
    this.winners = this.gameRulesService.determineWinner(this.players);
    
    // Generar estadísticas del juego
    this.gameStats = this.gameRulesService.generateGameStats(
      this.gameState, 
      this.players, 
      this.usedCards
    );

    // Guardar en historial
    this.saveToHistory();
  }

  private saveToHistory(): void {
    if (!this.gameState) return;

    const gameHistory: GameHistory = {
      gameId: this.gameState.id,
      players: this.players.map(p => p.name),
      completedAt: new Date(),
      finalScores: this.players.reduce((acc, player) => {
        acc[player.id] = player.points;
        return acc;
      }, {} as { [playerId: string]: number }),
      totalDuration: this.gameStats.duration
    };

    this.storageService.saveGameHistory(gameHistory);
  }

  getWinnerNames(): string {
    if (this.winners.length === 0) return 'Nadie';
    if (this.winners.length === 1) return this.winners[0].name;
    if (this.winners.length === 2) return `${this.winners[0].name} y ${this.winners[1].name}`;
    
    const lastWinner = this.winners[this.winners.length - 1];
    const otherWinners = this.winners.slice(0, -1);
    return `${otherWinners.map(w => w.name).join(', ')} y ${lastWinner.name}`;
  }

  getGameDurationFormatted(): string {
    const duration = this.gameStats.duration || 0;
    const minutes = Math.floor(duration / (1000 * 60));
    const seconds = Math.floor((duration % (1000 * 60)) / 1000);
    
    if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    }
    return `${seconds}s`;
  }

  getSortedPlayers(): Player[] {
    return [...this.players].sort((a, b) => {
      if (b.points !== a.points) {
        return b.points - a.points;
      }
      return b.cardsAnswered - a.cardsAnswered;
    });
  }

  getPlayerPosition(player: Player): number {
    const sorted = this.getSortedPlayers();
    return sorted.findIndex(p => p.id === player.id) + 1;
  }

  getPlayerMedal(position: number): string {
    switch (position) {
      case 1: return '🥇';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return '';
    }
  }

  getCardsByLevel(): { [level: number]: UsedCard[] } {
    return this.usedCards.reduce((acc, card) => {
      if (!acc[card.level]) acc[card.level] = [];
      acc[card.level].push(card);
      return acc;
    }, {} as { [level: number]: UsedCard[] });
  }

  getMostActivePlayer(): Player | null {
    if (this.players.length === 0) return null;
    return this.players.reduce((prev, current) => 
      current.cardsAnswered > prev.cardsAnswered ? current : prev
    );
  }

  getAveragePointsPerPlayer(): number {
    if (this.players.length === 0) return 0;
    const totalPoints = this.players.reduce((sum, p) => sum + p.points, 0);
    return Math.round((totalPoints / this.players.length) * 100) / 100;
  }

  onNewGame(): void {
    // Limpiar datos del juego anterior
    this.storageService.clearGameState();
    
    // Navegar al setup para configurar un nuevo juego
    this.router.navigate(['/setup']);
  }

  onBackToMenu(): void {
    // Limpiar datos del juego
    this.storageService.clearGameState();
    
    // Navegar al setup (menú principal)
    this.router.navigate(['/setup']);
  }

  onShareResults(): void {
    if (!navigator.share) {
      this.copyResultsToClipboard();
      return;
    }

    const shareData = {
      title: 'Resultados - We\'re Not Really Strangers',
      text: this.generateShareText(),
      url: window.location.origin
    };

    navigator.share(shareData).catch(err => {
      console.log('Error sharing:', err);
      this.copyResultsToClipboard();
    });
  }

  private copyResultsToClipboard(): void {
    const shareText = this.generateShareText();
    
    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareText).then(() => {
        this.snackBar.open('Resultados copiados al portapapeles', 'Cerrar', {
          duration: 3000
        });
      });
    } else {
      // Fallback para navegadores sin soporte de clipboard
      const textArea = document.createElement('textarea');
      textArea.value = shareText;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      
      this.snackBar.open('Resultados copiados al portapapeles', 'Cerrar', {
        duration: 3000
      });
    }
  }

  private generateShareText(): string {
    const winnerText = this.winners.length === 1 
      ? `🏆 Ganador: ${this.winners[0].name}` 
      : `🏆 Ganadores: ${this.getWinnerNames()}`;
    
    return `🎮 We're Not Really Strangers - Resultados

${winnerText}

📊 Estadísticas:
• Duración: ${this.getGameDurationFormatted()}
• Jugadores: ${this.players.length}
• Cartas jugadas: ${this.usedCards.length}
• Puntos totales: ${this.gameStats.totalPoints}

🏅 Clasificación:
${this.getSortedPlayers().map((player, index) => 
  `${this.getPlayerMedal(index + 1)} ${index + 1}. ${player.name} - ${player.points} pts`
).join('\n')}

¡Juega tú también! 🎯`;
  }

  onViewHistory(): void {
    // Implementar vista del historial de juegos
    this.snackBar.open('Función de historial próximamente', 'Cerrar', {
      duration: 2000
    });
  }

  hasMultipleWinners(): boolean {
    return this.winners.length > 1;
  }

  getCompletionMessage(): string {
    if (this.winners.length === 0) {
      return '¡Juego completado!';
    } else if (this.winners.length === 1) {
      return `¡Felicitaciones ${this.winners[0].name}!`;
    } else {
      return '¡Tenemos un empate!';
    }
  }

  getLevelName(level: number): string {
    return this.levelNames[level as keyof typeof this.levelNames] || `Nivel ${level}`;
  }

  getPlayerEfficiency(player: Player): number {
    if (player.cardsAnswered === 0) return 0;
    return Math.round((player.points / player.cardsAnswered) * 100);
  }

  isPlayerWinner(player: Player): boolean {
    return this.winners.some(w => w.id === player.id);
  }
}
