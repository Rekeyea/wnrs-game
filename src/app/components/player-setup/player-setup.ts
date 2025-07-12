import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { GAME_CONFIG } from '../../data/game-config';
import { GameService } from '../../services/game.service';
import { PlayerService } from '../../services/player.service';

@Component({
  selector: 'app-player-setup',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule
  ],
  templateUrl: './player-setup.html',
  styleUrl: './player-setup.css'
})
export class PlayerSetup {
  @Output() playersReady = new EventEmitter<string[]>();

  setupForm: FormGroup;
  minPlayers = GAME_CONFIG.MIN_PLAYERS;
  maxPlayers = GAME_CONFIG.MAX_PLAYERS;

  constructor(
    private fb: FormBuilder,
    private snackBar: MatSnackBar,
    private router: Router,
    private gameService: GameService,
    private playerService: PlayerService
  ) {
    this.setupForm = this.fb.group({
      players: this.fb.array([
        this.createPlayerFormControl(),
        this.createPlayerFormControl()
      ])
    });
  }

  get playersArray(): FormArray {
    return this.setupForm.get('players') as FormArray;
  }

  get playerCount(): number {
    return this.playersArray.length;
  }

  get canAddPlayer(): boolean {
    return this.playerCount < this.maxPlayers;
  }

  get canRemovePlayer(): boolean {
    return this.playerCount > this.minPlayers;
  }

  get isFormValid(): boolean {
    if (!this.setupForm.valid) return false;
    
    const names = this.getPlayerNames();
    return names.length >= this.minPlayers && 
           names.every(name => name.trim().length > 0) &&
           this.hasUniqueNames(names);
  }

  createPlayerFormControl() {
    return this.fb.control('', [
      Validators.required,
      Validators.minLength(2),
      Validators.maxLength(20)
    ]);
  }

  addPlayer(): void {
    if (this.canAddPlayer) {
      this.playersArray.push(this.createPlayerFormControl());
    }
  }

  removePlayer(index: number): void {
    if (this.canRemovePlayer && index >= 0 && index < this.playerCount) {
      this.playersArray.removeAt(index);
    }
  }

  getPlayerNames(): string[] {
    return this.playersArray.value.map((name: string) => name.trim()).filter((name: string) => name.length > 0);
  }

  hasUniqueNames(names: string[]): boolean {
    const lowercaseNames = names.map(name => name.toLowerCase());
    return new Set(lowercaseNames).size === lowercaseNames.length;
  }

  getDuplicateNames(): string[] {
    const names = this.getPlayerNames().map(name => name.toLowerCase());
    const duplicates: string[] = [];
    const seen = new Set<string>();
    
    names.forEach(name => {
      if (seen.has(name) && !duplicates.includes(name)) {
        duplicates.push(name);
      }
      seen.add(name);
    });
    
    return duplicates;
  }

  onSubmit(): void {
    if (!this.isFormValid) {
      this.showValidationErrors();
      return;
    }

    const playerNames = this.getPlayerNames();
    
    // Inicializar jugadores y juego
    this.playerService.createPlayers(playerNames);
    this.gameService.initializeGame(playerNames);
    
    // Navegar al juego
    this.router.navigate(['/game']);
  }

  private showValidationErrors(): void {
    if (this.playerCount < this.minPlayers) {
      this.snackBar.open(
        `Se necesitan al menos ${this.minPlayers} jugadores`,
        'Cerrar',
        { duration: 3000 }
      );
      return;
    }

    const duplicates = this.getDuplicateNames();
    if (duplicates.length > 0) {
      this.snackBar.open(
        'Los nombres de los jugadores deben ser únicos',
        'Cerrar',
        { duration: 3000 }
      );
      return;
    }

    const emptyNames = this.playersArray.value.some((name: string) => !name.trim());
    if (emptyNames) {
      this.snackBar.open(
        'Todos los jugadores deben tener un nombre',
        'Cerrar',
        { duration: 3000 }
      );
      return;
    }

    this.snackBar.open(
      'Por favor, corrige los errores en el formulario',
      'Cerrar',
      { duration: 3000 }
    );
  }
}
