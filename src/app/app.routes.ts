import { Routes } from '@angular/router';
import { HorarioPageComponent } from './pages/horario-page.component';
import { ProfesoresPageComponent } from './pages/profesores-page.component';
import { CursosPageComponent } from './pages/cursos-page.component';
import { SalasPageComponent } from './pages/salas-page.component';
import { RamosPageComponent } from './pages/ramos-page.component';

export const routes: Routes = [
  { path: '', component: HorarioPageComponent },
  { path: 'profesores', component: ProfesoresPageComponent },
  { path: 'cursos', component: CursosPageComponent },
  { path: 'salas', component: SalasPageComponent },
  { path: 'ramos', component: RamosPageComponent },
  { path: '**', redirectTo: '' }
];
