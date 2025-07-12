import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { Observable } from 'rxjs';
import { map, take } from 'rxjs/operators';
import { GameService } from '../services/game.service';
import { PlayerService } from '../services/player.service';
import { StorageService } from '../services/storage.service';
import { GameStatus } from '../enums/game-level.enum';

@Injectable({
  providedIn: 'root'
})
export class GameGuard implements CanActivate {

  constructor(
    private gameService: GameService,
    private playerService: PlayerService,
    private storageService: StorageService,
    private router: Router
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> | Promise<boolean> | boolean {
    
    return this.gameService.gameState$.pipe(
      take(1),
      map(gameState => {
        // Verificar si hay un juego activo
        if (!gameState) {
          // Intentar cargar juego desde localStorage
          const savedGame = this.storageService.loadGameState();
          if (savedGame) {
            return true; // Hay un juego guardado, permitir acceso
          }
          
          // No hay juego activo, redirigir a setup
          this.router.navigate(['/setup'], {
            queryParams: { 
              message: 'Debes configurar los jugadores primero' 
            }
          });
          return false;
        }

        // Verificar estado del juego
        switch (gameState.status) {
          case GameStatus.SETUP:
            this.router.navigate(['/setup']);
            return false;
            
          case GameStatus.GAME_OVER:
            this.router.navigate(['/game-over']);
            return false;
            
          case GameStatus.IN_PROGRESS:
          case GameStatus.PAUSED:
          case GameStatus.LEVEL_COMPLETE:
            return true; // Permitir acceso al juego
            
          default:
            this.router.navigate(['/setup']);
            return false;
        }
      })
    );
  }
}