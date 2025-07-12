import { Component, Input, OnInit, OnDestroy, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable, Subject, takeUntil } from 'rxjs';
import { trigger, state, style, transition, animate } from '@angular/animations';
import { MatCardModule } from '@angular/material/card';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatChipsModule } from '@angular/material/chips';
import { MatButtonModule } from '@angular/material/button';
import { MatBadgeModule } from '@angular/material/badge';
import { MatTooltipModule } from '@angular/material/tooltip';

import { Player, PlayerStats } from '../../interfaces/player.interface';
import { PlayerService } from '../../services/player.service';
import { GameLevel } from '../../enums/game-level.enum';
import { GAME_CONFIG, LEVEL_NAMES } from '../../data/game-config';

@Component({
  selector: 'app-player-list',
  imports: [
    CommonModule,
    MatCardModule,
    MatListModule,
    MatIconModule,
    MatProgressBarModule,
    MatChipsModule,
    MatButtonModule,
    MatBadgeModule,
    MatTooltipModule
  ],
  templateUrl: './player-list.html',
  styleUrl: './player-list.css',
  animations: [
    trigger('playerHighlight', [
      state('active', style({
        transform: 'scale(1.02)',
        backgroundColor: '#e8eaf6'
      })),
      state('inactive', style({
        transform: 'scale(1)',
        backgroundColor: 'white'
      })),
      transition('inactive => active', animate('300ms ease-in')),
      transition('active => inactive', animate('300ms ease-out'))
    ]),
    trigger('progressBar', [
      state('filled', style({
        width: '{{ progress }}%'
      }), { params: { progress: 0 } }),
      transition('* => filled', animate('500ms ease-out'))
    ]),
    trigger('slideIn', [
      state('in', style({
        opacity: 1,
        transform: 'translateX(0)'
      })),
      transition('void => *', [
        style({
          opacity: 0,
          transform: 'translateX(-20px)'
        }),
        animate('400ms ease-out')
      ])
    ])
  ]
})
export class PlayerListComponent implements OnInit, OnDestroy {
  @Input() players: Player[] = [];
  @Input() currentLevel: GameLevel = GameLevel.PERCEPTION;
  @Input() showStats: boolean = true;
  @Input() showProgress: boolean = true;
  @Input() showLevelInfo: boolean = true;
  @Input() compact: boolean = false;

  @Output() playerSelected = new EventEmitter<Player>();
  @Output() playerStatsRequested = new EventEmitter<Player>();

  players$: Observable<Player[]>;
  levelNames = LEVEL_NAMES;
  gameConfig = GAME_CONFIG;
  
  private destroy$ = new Subject<void>();

  constructor(private playerService: PlayerService) {
    this.players$ = this.playerService.players$;
  }

  ngOnInit(): void {
    this.subscribeToPlayers();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private subscribeToPlayers(): void {
    this.players$
      .pipe(takeUntil(this.destroy$))
      .subscribe(players => {
        this.players = players;
      });
  }

  getPlayerProgress(player: Player): number {
    return Math.min((player.points / this.gameConfig.POINTS_TO_ADVANCE) * 100, 100);
  }

  getPlayerProgressColor(player: Player): string {
    const progress = this.getPlayerProgress(player);
    if (progress >= 100) return 'primary';
    if (progress >= 60) return 'accent';
    return 'warn';
  }

  canPlayerAdvance(player: Player): boolean {
    return player.points >= this.gameConfig.POINTS_TO_ADVANCE;
  }

  getPlayerRank(player: Player): number {
    const sortedPlayers = [...this.players].sort((a, b) => {
      if (b.points !== a.points) {
        return b.points - a.points;
      }
      return b.cardsAnswered - a.cardsAnswered;
    });
    return sortedPlayers.findIndex(p => p.id === player.id) + 1;
  }

  getPlayerStats(player: Player): PlayerStats {
    return this.playerService.getPlayerStats(player);
  }

  getCurrentLevelName(): string {
    return this.levelNames[this.currentLevel] || '';
  }

  getLeaderboard(): Player[] {
    return this.playerService.getLeaderboard();
  }

  isWinning(player: Player): boolean {
    const leaderboard = this.getLeaderboard();
    return leaderboard.length > 0 && leaderboard[0].id === player.id;
  }

  getPlayerStatusIcon(player: Player): string {
    if (this.canPlayerAdvance(player)) return 'check_circle';
    if (player.isActive) return 'play_circle_filled';
    return 'person';
  }

  getPlayerStatusColor(player: Player): string {
    if (this.canPlayerAdvance(player)) return 'primary';
    if (player.isActive) return 'accent';
    return '';
  }

  getPlayerTooltip(player: Player): string {
    const stats = this.getPlayerStats(player);
    return `${player.name}\nPuntos: ${player.points}\nCartas respondidas: ${stats.totalCardsAnswered}\nNivel actual: ${stats.highestLevelReached}`;
  }

  onPlayerClick(player: Player): void {
    this.playerSelected.emit(player);
  }

  onViewStats(player: Player, event: Event): void {
    event.stopPropagation();
    this.playerStatsRequested.emit(player);
  }

  getPointsToAdvance(player: Player): number {
    return Math.max(0, this.gameConfig.POINTS_TO_ADVANCE - player.points);
  }

  formatPlayerLevel(level: number): string {
    return this.levelNames[level as keyof typeof this.levelNames] || `Nivel ${level}`;
  }

  getPlayerAnimation(player: Player): string {
    return player.isActive ? 'active' : 'inactive';
  }

  getPlayersReadyToAdvanceCount(): number {
    return this.players.filter(p => this.canPlayerAdvance(p)).length;
  }

  getTotalPoints(): number {
    return this.players.reduce((total, p) => total + p.points, 0);
  }

  getTotalCardsAnswered(): number {
    return this.players.reduce((total, p) => total + p.cardsAnswered, 0);
  }

  trackByPlayerId(index: number, player: Player): string {
    return player.id;
  }

  getProgressMessage(player: Player): string {
    const pointsNeeded = this.getPointsToAdvance(player);
    if (pointsNeeded === 0) {
      return '¡Listo para avanzar!';
    }
    return `${pointsNeeded} punto${pointsNeeded > 1 ? 's' : ''} para avanzar`;
  }

  getPlayerCardClass(player: Player): string {
    let classes = 'player-card';
    if (player.isActive) classes += ' active-player';
    if (this.canPlayerAdvance(player)) classes += ' ready-player';
    if (this.isWinning(player)) classes += ' winning-player';
    if (this.compact) classes += ' compact';
    return classes;
  }
}
