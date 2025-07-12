import { TestBed } from '@angular/core/testing';
import { GameService } from './game.service';
import { PlayerService } from './player.service';
import { CardService } from './card.service';
import { StorageService } from './storage.service';
import { GameStatus, GameLevel } from '../enums/game-level.enum';

describe('GameService (Simple)', () => {
  let service: GameService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        GameService,
        PlayerService,
        CardService,
        StorageService
      ]
    });
    service = TestBed.inject(GameService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should initialize game with valid player names', () => {
    const playerNames = ['Alice', 'Bob'];
    const gameState = service.initializeGame(playerNames);

    expect(gameState).toBeDefined();
    expect(gameState.status).toBe(GameStatus.IN_PROGRESS);
    expect(gameState.currentLevel).toBe(GameLevel.PERCEPTION);
    expect(gameState.players).toBeDefined();
  });

  it('should have game state observable', (done) => {
    service.gameState$.subscribe(state => {
      if (state) {
        expect(state.status).toBe(GameStatus.IN_PROGRESS);
        expect(state.currentLevel).toBe(GameLevel.PERCEPTION);
        done();
      }
    });
    
    service.initializeGame(['Alice', 'Bob']);
  });

  it('should have current level observable', (done) => {
    service.currentLevel$.subscribe(level => {
      expect(level).toBe(GameLevel.PERCEPTION);
      done();
    });
    
    service.initializeGame(['Alice', 'Bob']);
  });

  it('should get game statistics', () => {
    service.initializeGame(['Alice', 'Bob']);
    const stats = service.getGameStats();

    expect(stats).toBeDefined();
    if (stats) {
      expect(stats.totalPlayers).toBe(2);
      expect(typeof stats.currentRound).toBe('number');
      expect(typeof stats.cardsPlayed).toBe('number');
    }
  });
});