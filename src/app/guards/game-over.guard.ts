import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { Observable } from 'rxjs';
import { map, take } from 'rxjs/operators';
import { GameService } from '../services/game.service';
import { StorageService } from '../services/storage.service';
import { GameStatus } from '../enums/game-level.enum';

@Injectable({
  providedIn: 'root'
})
export class GameOverGuard implements CanActivate {

  constructor(
    private gameService: GameService,
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
          if (savedGame && savedGame.status === GameStatus.GAME_OVER) {
            return true; // Hay un juego finalizado, permitir acceso
          }
          
          // No hay juego finalizado, redirigir a setup
          this.router.navigate(['/setup'], {
            queryParams: { 
              message: 'No hay un juego finalizado para mostrar' 
            }
          });
          return false;
        }

        // Verificar estado del juego
        switch (gameState.status) {
          case GameStatus.GAME_OVER:
            return true; // Permitir acceso a resultados
            
          case GameStatus.SETUP:
            this.router.navigate(['/setup']);
            return false;
            
          case GameStatus.IN_PROGRESS:
          case GameStatus.PAUSED:
          case GameStatus.LEVEL_COMPLETE:
            this.router.navigate(['/game']);
            return false;
            
          default:
            this.router.navigate(['/setup']);
            return false;
        }
      })
    );
  }
}