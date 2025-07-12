import { TestBed } from '@angular/core/testing';
import { GameService } from '../services/game.service';
import { PlayerService } from '../services/player.service';
import { CardService } from '../services/card.service';
import { StorageService } from '../services/storage.service';
import { GameRulesService } from '../services/game-rules.service';
import { GameStatus, GameLevel } from '../enums/game-level.enum';
import { GAME_CONFIG } from '../data/game-config';

describe('Simple Game Flow Integration Test', () => {
  let gameService: GameService;
  let playerService: PlayerService;
  let cardService: CardService;
  let storageService: StorageService;
  let gameRulesService: GameRulesService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        GameService,
        PlayerService,
        CardService,
        StorageService,
        GameRulesService
      ]
    });

    gameService = TestBed.inject(GameService);
    playerService = TestBed.inject(PlayerService);
    cardService = TestBed.inject(CardService);
    storageService = TestBed.inject(StorageService);
    gameRulesService = TestBed.inject(GameRulesService);
  });

  it('should complete a basic game flow simulation', () => {
    console.log('\n🎮 Starting simple game flow test...\n');

    // Phase 1: Game Setup
    console.log('📝 Phase 1: Setting up the game');
    const playerNames = ['Alice', 'Bob', 'Charlie'];
    const gameState = gameService.initializeGame(playerNames);

    expect(gameState).toBeDefined();
    expect(gameState.status).toBe(GameStatus.IN_PROGRESS);
    expect(gameState.currentLevel).toBe(GameLevel.PERCEPTION);
    expect(gameState.players.length).toBe(3);

    console.log(`✅ Game initialized successfully`);
    console.log(`   - Players: ${gameState.players.map(p => p.name).join(', ')}`);
    console.log(`   - Starting level: ${gameState.currentLevel} (Perception)`);
    console.log(`   - Initial status: ${gameState.status}`);

    // Phase 2: Initial Card Play
    console.log('\n🎴 Phase 2: Playing initial cards');
    
    let cardsPlayed = 0;
    const maxCards = 20; // Reasonable limit for testing

    for (let i = 0; i < maxCards; i++) {
      const currentPlayer = playerService.getCurrentPlayer();
      expect(currentPlayer).toBeDefined();

      const card = gameService.startTurn();
      if (!card) {
        console.log('   ⚠️ No more cards available');
        break;
      }

      console.log(`   🎴 Card ${i + 1}: ${currentPlayer?.name} draws a card`);
      console.log(`       Question: "${card.question.substring(0, 60)}..."`);

      // Answer the card (always answer in this test for predictability)
      gameService.answerCard();
      cardsPlayed++;

      const updatedPlayer = playerService.getCurrentPlayer();
      console.log(`       ✅ ${currentPlayer?.name} answered (+1 point, now ${updatedPlayer?.points} total)`);

      // Check if we can advance level (check all players)
      const allPlayers = playerService.getPlayers();
      const playersReady = allPlayers.filter(p => gameService.canPlayerAdvanceLevel(p));
      if (playersReady.length === allPlayers.length) {
        console.log(`   🎉 All players ready to advance level!`);
        break;
      }
    }

    expect(cardsPlayed).toBeGreaterThan(0);
    console.log(`   📊 Total cards played: ${cardsPlayed}`);

    // Phase 3: Check Player Progress
    console.log('\n📈 Phase 3: Checking player progress');
    const playersForProgress = playerService.getPlayers();
    
    playersForProgress.forEach((player, index) => {
      console.log(`   ${index + 1}. ${player.name}:`);
      console.log(`      - Points: ${player.points}`);
      console.log(`      - Cards answered: ${player.cardsAnswered}`);
      console.log(`      - Current level: ${player.currentLevel}`);
      console.log(`      - Active: ${player.isActive}`);
      
      expect(player.points).toBeGreaterThanOrEqual(0);
      expect(player.cardsAnswered).toBeGreaterThanOrEqual(0);
      expect(player.currentLevel).toBe(1);
    });

    // Phase 4: Test Level Advancement (if possible)
    console.log('\n⬆️ Phase 4: Testing level advancement');
    
    const playersForAdvancement = playerService.getPlayers();
    const playersReady = playersForAdvancement.filter(p => gameService.canPlayerAdvanceLevel(p));
    
    if (playersReady.length === playersForAdvancement.length) {
      const initialLevel = gameState.currentLevel;
      gameService.advanceToNextLevel();
      
      // Verify level advancement
      let newGameState: any = null;
      gameService.gameState$.subscribe(state => {
        newGameState = state;
      }).unsubscribe();

      expect(newGameState.currentLevel).toBeGreaterThan(initialLevel);
      console.log(`   ✅ Advanced from level ${initialLevel} to level ${newGameState.currentLevel}`);
    } else {
      console.log(`   ℹ️ Players not ready to advance yet (need ${GAME_CONFIG.POINTS_TO_ADVANCE} points each)`);
      console.log(`   📊 Players ready: ${playersReady.length}/${playersForAdvancement.length}`);
    }

    // Phase 5: Test Game Statistics
    console.log('\n📊 Phase 5: Verifying game statistics');
    
    const gameStats = gameService.getGameStats();
    expect(gameStats).toBeDefined();
    
    if (gameStats) {
      console.log(`   📈 Game Statistics:`);
      console.log(`      - Total players: ${gameStats.totalPlayers}`);
      console.log(`      - Current round: ${gameStats.currentRound}`);
      console.log(`      - Cards played: ${gameStats.cardsPlayed}`);
      console.log(`      - Game time: ${gameStats.gameTime}ms`);

      expect(gameStats.totalPlayers).toBe(3);
      expect(gameStats.cardsPlayed).toBeGreaterThan(0);
      expect(gameStats.gameTime).toBeGreaterThan(0);
    }

    // Phase 6: Test Winner Determination
    console.log('\n🏆 Phase 6: Testing winner determination');
    
    const finalPlayers = playerService.getPlayers();
    const winners = gameRulesService.determineWinner(finalPlayers);
    expect(winners).toBeDefined();
    expect(winners.length).toBeGreaterThan(0);
    
    console.log(`   🏆 Current leaders: ${winners.map(w => `${w.name} (${w.points} pts)`).join(', ')}`);

    // Phase 7: Test Data Persistence
    console.log('\n💾 Phase 7: Testing data persistence');
    
    const savedState = storageService.loadGameState();
    expect(savedState).toBeDefined();
    
    if (savedState) {
      console.log(`   ✅ Game state saved to localStorage`);
      console.log(`      - Status: ${savedState.status}`);
      console.log(`      - Level: ${savedState.currentLevel}`);
      console.log(`      - Players: ${savedState.players.length}`);
      
      expect(savedState.status).toBeDefined();
      expect(savedState.currentLevel).toBeDefined();
      expect(savedState.players.length).toBe(3);
    }

    console.log('\n🎉 Simple game flow test completed successfully!');
    console.log('✅ All game mechanics verified and working correctly\n');
  });

  it('should handle rapid gameplay scenarios', () => {
    console.log('\n⚡ Testing rapid gameplay scenarios...\n');

    // Setup game
    gameService.initializeGame(['FastPlayer1', 'FastPlayer2']);

    // Play cards rapidly
    let successfulMoves = 0;
    for (let i = 0; i < 10; i++) {
      const card = gameService.startTurn();
      if (card) {
        gameService.answerCard();
        successfulMoves++;
      }
    }

    expect(successfulMoves).toBeGreaterThan(0);
    console.log(`✅ Successfully executed ${successfulMoves} rapid moves`);

    // Verify game state consistency
    const players = playerService.getPlayers();
    const totalPoints = players.reduce((sum, player) => sum + player.points, 0);
    expect(totalPoints).toBe(successfulMoves);
    console.log(`✅ Point calculation consistent: ${totalPoints} total points`);

    console.log('✅ Rapid gameplay test passed\n');
  });

  it('should maintain turn order correctly', () => {
    console.log('\n🔄 Testing turn rotation...\n');

    // Setup game with 3 players
    gameService.initializeGame(['TurnPlayer1', 'TurnPlayer2', 'TurnPlayer3']);

    const playerOrder: string[] = [];
    
    // Play several turns and track order
    for (let i = 0; i < 6; i++) {
      const currentPlayer = playerService.getCurrentPlayer();
      if (currentPlayer) {
        playerOrder.push(currentPlayer.name);
        
        const card = gameService.startTurn();
        if (card) {
          gameService.answerCard();
        }
      }
    }

    // Verify turn rotation pattern
    expect(playerOrder.length).toBe(6);
    expect(playerOrder[0]).toBe(playerOrder[3]); // Should repeat after 3 players
    expect(playerOrder[1]).toBe(playerOrder[4]);
    expect(playerOrder[2]).toBe(playerOrder[5]);

    console.log(`✅ Turn order verified: ${playerOrder.join(' → ')}`);
    console.log('✅ Turn rotation test passed\n');
  });
});