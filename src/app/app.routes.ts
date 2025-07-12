import { Routes } from '@angular/router';
import { PlayerSetup } from './components/player-setup/player-setup';
import { GameBoard } from './components/game-board/game-board';
import { GameOverComponent } from './components/game-over/game-over';
import { GameGuard } from './guards/game.guard';
import { GameOverGuard } from './guards/game-over.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/setup',
    pathMatch: 'full'
  },
  {
    path: 'setup',
    component: PlayerSetup,
    title: 'Configurar Jugadores - WNRS'
  },
  {
    path: 'game',
    component: GameBoard,
    title: 'Juego - WNRS',
    canActivate: [GameGuard]
  },
  {
    path: 'game-over',
    component: GameOverComponent,
    title: 'Resultados - WNRS',
    canActivate: [GameOverGuard]
  },
  {
    path: '**',
    redirectTo: '/setup'
  }
];
