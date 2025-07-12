import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Card, UsedCard } from '../interfaces/card.interface';
import { GameLevel } from '../enums/game-level.enum';
import { LEVEL_1_CARDS, LEVEL_2_CARDS, LEVEL_3_CARDS } from '../data/cards.data';

@Injectable({
  providedIn: 'root'
})
export class CardService {
  private currentCardSubject = new BehaviorSubject<Card | null>(null);
  public currentCard$ = this.currentCardSubject.asObservable();

  private usedCardsSubject = new BehaviorSubject<UsedCard[]>([]);
  public usedCards$ = this.usedCardsSubject.asObservable();

  private availableCardsSubject = new BehaviorSubject<Card[]>([]);
  public availableCards$ = this.availableCardsSubject.asObservable();

  constructor() {
    this.initializeCards();
  }

  initializeCards(): void {
    const allCards = this.getAllCards();
    this.availableCardsSubject.next([...allCards]);
    this.usedCardsSubject.next([]);
    this.currentCardSubject.next(null);
  }

  getAllCards(): Card[] {
    return [
      ...this.shuffleArray([...LEVEL_1_CARDS]),
      ...this.shuffleArray([...LEVEL_2_CARDS]),
      ...this.shuffleArray([...LEVEL_3_CARDS])
    ].map(card => ({ ...card, isUsed: false }));
  }

  getCardsForLevel(level: GameLevel): Card[] {
    switch (level) {
      case GameLevel.PERCEPTION:
        return this.shuffleArray([...LEVEL_1_CARDS]);
      case GameLevel.CONNECTION:
        return this.shuffleArray([...LEVEL_2_CARDS]);
      case GameLevel.REFLECTION:
        return this.shuffleArray([...LEVEL_3_CARDS]);
      default:
        return [];
    }
  }

  drawCardForLevel(level: GameLevel): Card | null {
    const availableCards = this.availableCardsSubject.value;
    const levelCards = availableCards.filter(card => card.level === level && !card.isUsed);
    
    if (levelCards.length === 0) {
      return null;
    }

    const randomIndex = Math.floor(Math.random() * levelCards.length);
    const selectedCard = levelCards[randomIndex];
    
    this.currentCardSubject.next(selectedCard);
    return selectedCard;
  }

  markCardAsUsed(playerId: string, playerName: string): void {
    const currentCard = this.currentCardSubject.value;
    if (!currentCard) return;

    const usedCard: UsedCard = {
      ...currentCard,
      playerId,
      playerName,
      answeredAt: new Date(),
      isUsed: true
    };

    const currentUsedCards = this.usedCardsSubject.value;
    this.usedCardsSubject.next([...currentUsedCards, usedCard]);

    const availableCards = this.availableCardsSubject.value;
    const updatedCards = availableCards.map(card => 
      card.id === currentCard.id ? { ...card, isUsed: true } : card
    );
    this.availableCardsSubject.next(updatedCards);
  }

  skipCurrentCard(): void {
    const currentCard = this.currentCardSubject.value;
    if (!currentCard) return;

    const availableCards = this.availableCardsSubject.value;
    const updatedCards = availableCards.map(card => 
      card.id === currentCard.id ? { ...card, isUsed: true } : card
    );
    this.availableCardsSubject.next(updatedCards);
    this.currentCardSubject.next(null);
  }

  getCurrentCard(): Card | null {
    return this.currentCardSubject.value;
  }

  getUsedCards(): UsedCard[] {
    return this.usedCardsSubject.value;
  }

  getAvailableCardsForLevel(level: GameLevel): Card[] {
    const availableCards = this.availableCardsSubject.value;
    return availableCards.filter(card => card.level === level && !card.isUsed);
  }

  getRemainingCardsCount(level: GameLevel): number {
    return this.getAvailableCardsForLevel(level).length;
  }

  hasCardsForLevel(level: GameLevel): boolean {
    return this.getRemainingCardsCount(level) > 0;
  }

  resetCards(): void {
    this.initializeCards();
  }

  setCards(availableCards: Card[], usedCards: UsedCard[], currentCard: Card | null): void {
    this.availableCardsSubject.next(availableCards);
    this.usedCardsSubject.next(usedCards);
    this.currentCardSubject.next(currentCard);
  }

  getCardStats(): { total: number; used: number; remaining: number } {
    const availableCards = this.availableCardsSubject.value;
    const usedCards = this.usedCardsSubject.value;
    
    return {
      total: availableCards.length,
      used: usedCards.length,
      remaining: availableCards.filter(card => !card.isUsed).length
    };
  }

  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }
}