import { TestBed } from '@angular/core/testing';
import { PlayerService } from './player.service';
import { GAME_CONFIG } from '../data/game-config';

describe('PlayerService (Simple)', () => {
  let service: PlayerService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PlayerService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should create players with valid names', () => {
    const playerNames = ['Alice', 'Bob'];
    const players = service.createPlayers(playerNames);
    
    expect(players).toBeDefined();
    expect(players.length).toBe(2);
    expect(players[0].name).toBe('Alice');
    expect(players[0].isActive).toBe(true);
    expect(players[1].isActive).toBe(false);
  });

  it('should initialize players with correct default values', () => {
    const playerNames = ['TestPlayer'];
    
    // Add another player to meet minimum requirement
    playerNames.push('TestPlayer2');
    
    const players = service.createPlayers(playerNames);
    const player = players[0];
    
    expect(player.points).toBe(0);
    expect(player.cardsAnswered).toBe(0);
    expect(player.currentLevel).toBe(1);
    expect(player.name).toBe('TestPlayer');
  });

  it('should throw error for too few players', () => {
    const playerNames = ['OnlyOne'];
    expect(() => service.createPlayers(playerNames)).toThrow();
  });

  it('should get current player correctly', () => {
    service.createPlayers(['Alice', 'Bob']);
    const currentPlayer = service.getCurrentPlayer();
    
    expect(currentPlayer).toBeDefined();
    expect(currentPlayer?.name).toBe('Alice');
    expect(currentPlayer?.isActive).toBe(true);
  });

  it('should move to next player', () => {
    service.createPlayers(['Alice', 'Bob', 'Charlie']);
    
    const firstPlayer = service.getCurrentPlayer();
    expect(firstPlayer?.name).toBe('Alice');

    const secondPlayer = service.nextPlayer();
    expect(secondPlayer?.name).toBe('Bob');
    expect(secondPlayer?.isActive).toBe(true);
  });
});