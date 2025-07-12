import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { Location } from '@angular/common';
import { Component } from '@angular/core';
import { routes } from './app.routes';

@Component({
  template: '<router-outlet></router-outlet>',
  standalone: true,
  imports: []
})
class TestHostComponent {}

describe('App Routes (Simple)', () => {
  let router: Router;
  let location: Location;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHostComponent],
      providers: []
    }).compileComponents();

    router = TestBed.inject(Router);
    location = TestBed.inject(Location);
  });

  it('should have correct route configuration', () => {
    expect(routes).toBeDefined();
    expect(routes.length).toBeGreaterThan(0);
  });

  it('should have setup route', () => {
    const setupRoute = routes.find(route => route.path === 'setup');
    expect(setupRoute).toBeDefined();
    expect(setupRoute?.title).toBe('Configurar Jugadores - WNRS');
  });

  it('should have game route with guard', () => {
    const gameRoute = routes.find(route => route.path === 'game');
    expect(gameRoute).toBeDefined();
    expect(gameRoute?.title).toBe('Juego - WNRS');
    expect(gameRoute?.canActivate).toBeDefined();
  });

  it('should have game-over route with guard', () => {
    const gameOverRoute = routes.find(route => route.path === 'game-over');
    expect(gameOverRoute).toBeDefined();
    expect(gameOverRoute?.title).toBe('Resultados - WNRS');
    expect(gameOverRoute?.canActivate).toBeDefined();
  });

  it('should have wildcard route that redirects to setup', () => {
    const wildcardRoute = routes.find(route => route.path === '**');
    expect(wildcardRoute).toBeDefined();
    expect(wildcardRoute?.redirectTo).toBe('/setup');
  });

  it('should redirect root to setup', () => {
    const rootRoute = routes.find(route => route.path === '' && route.pathMatch === 'full');
    expect(rootRoute).toBeDefined();
    expect(rootRoute?.redirectTo).toBe('/setup');
  });
});