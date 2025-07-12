import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { trigger, state, style, transition, animate } from '@angular/animations';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { Card as CardInterface } from '../../interfaces/card.interface';
import { Player } from '../../interfaces/player.interface';
import { GameLevel } from '../../enums/game-level.enum';
import { LEVEL_NAMES, UI_CONFIG } from '../../data/game-config';

@Component({
  selector: 'app-card',
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule
  ],
  templateUrl: './card.html',
  styleUrl: './card.css',
  animations: [
    trigger('cardFlip', [
      state('front', style({
        transform: 'rotateY(0deg)'
      })),
      state('back', style({
        transform: 'rotateY(180deg)'
      })),
      transition('front => back', animate('300ms ease-in')),
      transition('back => front', animate('300ms ease-out'))
    ]),
    trigger('slideIn', [
      state('in', style({
        opacity: 1,
        transform: 'translateY(0)'
      })),
      transition('void => *', [
        style({
          opacity: 0,
          transform: 'translateY(-20px)'
        }),
        animate('400ms ease-out')
      ])
    ]),
    trigger('fadeInOut', [
      state('in', style({
        opacity: 1
      })),
      transition('void => *', [
        style({ opacity: 0 }),
        animate('300ms ease-in')
      ]),
      transition('* => void', [
        animate('300ms ease-out', style({ opacity: 0 }))
      ])
    ])
  ]
})
export class CardComponent implements OnInit, OnDestroy {
  @Input() card: CardInterface | null = null;
  @Input() currentPlayer: Player | null = null;
  @Input() canAnswer: boolean = true;
  @Input() canSkip: boolean = true;
  @Input() showActions: boolean = true;
  @Input() isFlipped: boolean = false;

  @Output() answered = new EventEmitter<void>();
  @Output() skipped = new EventEmitter<void>();
  @Output() cardFlipped = new EventEmitter<boolean>();

  levelNames = LEVEL_NAMES;
  cardState = 'front';
  isVisible = true;
  private flipTimeout?: number;

  ngOnInit(): void {
    if (this.card) {
      this.startCardAnimation();
    }
  }

  ngOnDestroy(): void {
    if (this.flipTimeout) {
      clearTimeout(this.flipTimeout);
    }
  }

  private startCardAnimation(): void {
    setTimeout(() => {
      this.isVisible = true;
    }, 100);
  }

  getLevelName(): string {
    if (!this.card) return '';
    return this.levelNames[this.card.level] || '';
  }

  getLevelColor(): string {
    if (!this.card) return 'primary';
    
    switch (this.card.level) {
      case GameLevel.PERCEPTION:
        return 'primary';
      case GameLevel.CONNECTION:
        return 'accent';
      case GameLevel.REFLECTION:
        return 'warn';
      default:
        return 'primary';
    }
  }

  getLevelIcon(): string {
    if (!this.card) return 'help_outline';
    
    switch (this.card.level) {
      case GameLevel.PERCEPTION:
        return 'visibility';
      case GameLevel.CONNECTION:
        return 'favorite';
      case GameLevel.REFLECTION:
        return 'psychology';
      default:
        return 'help_outline';
    }
  }

  onAnswerCard(): void {
    if (!this.canAnswer || !this.card) return;
    
    this.animateCardAction(() => {
      this.answered.emit();
    });
  }

  onSkipCard(): void {
    if (!this.canSkip || !this.card) return;
    
    this.animateCardAction(() => {
      this.skipped.emit();
    });
  }

  flipCard(): void {
    this.cardState = this.cardState === 'front' ? 'back' : 'front';
    this.cardFlipped.emit(this.cardState === 'back');
  }

  private animateCardAction(callback: () => void): void {
    this.isVisible = false;
    
    this.flipTimeout = setTimeout(() => {
      callback();
      setTimeout(() => {
        this.isVisible = true;
      }, 100);
    }, UI_CONFIG.CARD_TRANSITION_DURATION);
  }

  getCardDescription(): string {
    if (!this.card) return '';
    
    switch (this.card.level) {
      case GameLevel.PERCEPTION:
        return 'Una pregunta sobre primeras impresiones y percepciones';
      case GameLevel.CONNECTION:
        return 'Una pregunta más personal para crear conexiones profundas';
      case GameLevel.REFLECTION:
        return 'Una pregunta íntima para reflexión y vulnerabilidad';
      default:
        return '';
    }
  }

  getEstimatedTime(): string {
    if (!this.card) return '';
    
    switch (this.card.level) {
      case GameLevel.PERCEPTION:
        return '2-3 min';
      case GameLevel.CONNECTION:
        return '3-5 min';
      case GameLevel.REFLECTION:
        return '5-10 min';
      default:
        return '';
    }
  }

  isLevelCard(level: GameLevel): boolean {
    return this.card?.level === level;
  }

  hasCard(): boolean {
    return !!this.card;
  }

  getPlayerPrompt(): string {
    if (!this.currentPlayer) return '';
    return `${this.currentPlayer.name}, es tu turno de responder`;
  }
}
