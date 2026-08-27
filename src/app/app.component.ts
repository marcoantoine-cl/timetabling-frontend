import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <nav class="nav-principal">
      <a routerLink="/" routerLinkActive="activo" [routerLinkActiveOptions]="{exact: true}">Horario</a>
      <a routerLink="/profesores" routerLinkActive="activo">Profesores</a>
      <a routerLink="/cursos" routerLinkActive="activo">Cursos</a>
      <a routerLink="/salas" routerLinkActive="activo">Salas</a>
      <a routerLink="/ramos" routerLinkActive="activo">Ramos</a>
    </nav>

    <main>
      <router-outlet></router-outlet>
    </main>
  `,
  styles: [`
    .nav-principal {
      display: flex;
      gap: 4px;
      margin-bottom: 20px;
      border-bottom: 2px solid #d7dbe0;
      padding-bottom: 0;
    }
    .nav-principal a {
      padding: 10px 16px;
      text-decoration: none;
      color: #444;
      font-weight: 600;
      font-size: 0.9rem;
      border-bottom: 2px solid transparent;
      margin-bottom: -2px;
    }
    .nav-principal a.activo {
      color: #2c5cc5;
      border-bottom-color: #2c5cc5;
    }
  `]
})
export class AppComponent {}
