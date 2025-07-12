import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

import { PlayerSetup } from './player-setup';
import { GameService } from '../../services/game.service';
import { PlayerService } from '../../services/player.service';

describe('PlayerSetup', () => {
  let component: PlayerSetup;
  let fixture: ComponentFixture<PlayerSetup>;
  let router: jasmine.SpyObj<Router>;
  let gameService: jasmine.SpyObj<GameService>;
  let playerService: jasmine.SpyObj<PlayerService>;
  let snackBar: jasmine.SpyObj<MatSnackBar>;

  beforeEach(async () => {
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    const gameServiceSpy = jasmine.createSpyObj('GameService', ['initializeGame']);
    const playerServiceSpy = jasmine.createSpyObj('PlayerService', ['createPlayers']);
    const snackBarSpy = jasmine.createSpyObj('MatSnackBar', ['open']);

    await TestBed.configureTestingModule({
      imports: [
        PlayerSetup,
        ReactiveFormsModule,
        NoopAnimationsModule,
        MatCardModule,
        MatFormFieldModule,
        MatInputModule,
        MatButtonModule,
        MatIconModule
      ],
      providers: [
        { provide: Router, useValue: routerSpy },
        { provide: GameService, useValue: gameServiceSpy },
        { provide: PlayerService, useValue: playerServiceSpy },
        { provide: MatSnackBar, useValue: snackBarSpy }
      ]
    }).compileComponents();

    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;
    gameService = TestBed.inject(GameService) as jasmine.SpyObj<GameService>;
    playerService = TestBed.inject(PlayerService) as jasmine.SpyObj<PlayerService>;
    snackBar = TestBed.inject(MatSnackBar) as jasmine.SpyObj<MatSnackBar>;

    fixture = TestBed.createComponent(PlayerSetup);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with 2 player form controls', () => {
    expect(component.playersArray.length).toBe(2);
    expect(component.playerCount).toBe(2);
  });

  it('should validate form correctly with valid names', () => {
    component.playersArray.at(0)?.setValue('Alice');
    component.playersArray.at(1)?.setValue('Bob');
    
    expect(component.isFormValid).toBe(true);
  });

  it('should invalidate form with duplicate names', () => {
    component.playersArray.at(0)?.setValue('Alice');
    component.playersArray.at(1)?.setValue('Alice');
    
    expect(component.isFormValid).toBe(false);
    expect(component.hasUniqueNames(['Alice', 'Alice'])).toBe(false);
  });

  it('should navigate to game on successful form submission', () => {
    // Setup valid form
    component.playersArray.at(0)?.setValue('Alice');
    component.playersArray.at(1)?.setValue('Bob');
    
    playerService.createPlayers.and.returnValue([
      { id: '1', name: 'Alice', points: 0, isActive: true, cardsAnswered: 0, currentLevel: 1 },
      { id: '2', name: 'Bob', points: 0, isActive: false, cardsAnswered: 0, currentLevel: 1 }
    ]);

    component.onSubmit();

    expect(playerService.createPlayers).toHaveBeenCalledWith(['Alice', 'Bob']);
    expect(gameService.initializeGame).toHaveBeenCalledWith(['Alice', 'Bob']);
    expect(router.navigate).toHaveBeenCalledWith(['/game']);
  });
});
