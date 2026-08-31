import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { forkJoin } from 'rxjs';
import { RamoApiService, CursoApiService, ProfesorApiService } from '../crud/entity-api.services';
import { RamoDto, CursoDto, ProfesorDto, TimeSlotDto } from '../models';

const DIAS = [
  { valor: 1, nombre: 'Lunes' }, { valor: 2, nombre: 'Martes' }, { valor: 3, nombre: 'Miercoles' },
  { valor: 4, nombre: 'Jueves' }, { valor: 5, nombre: 'Viernes' }
];

function vacio(): RamoDto {
  return { id: '', nombre: '', cursoId: '', profesorId: '', horasSemanales: 1,
    preferirManana: false, horariosFijos: [] };
}

@Component({
  selector: 'app-ramos-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <h1>Ramos</h1>
    <p style="color:#555; font-size:0.9rem;">
      La sala NO se define aca: es una variable de planificación que el solver decide por
      cada sesión (un mismo ramo puede terminar en salas distintas según el día). La sala
      asignada se ve en la vista de Horario, dentro de cada celda.
    </p>
    <div class="error-box" *ngIf="error">{{ error }}</div>

    <table class="tabla-crud">
      <thead>
        <tr><th>Nombre</th><th>Curso</th><th>Profesor</th><th>H/sem</th><th>Manana</th><th>Fijo</th><th></th></tr>
      </thead>
      <tbody>
        <tr *ngFor="let r of ramos">
          <td>{{ r.nombre }}</td>
          <td>{{ nombreCurso(r.cursoId) }}</td>
          <td>{{ nombreProfesor(r.profesorId) }}</td>
          <td>{{ r.horasSemanales }}</td>
          <td>{{ r.preferirManana ? 'Si' : '—' }}</td>
          <td>{{ r.horariosFijos?.length ? r.horariosFijos!.length + ' sesion(es)' : '—' }}</td>
          <td>
            <button (click)="editar(r)">Editar</button>
            <button (click)="eliminar(r)">Eliminar</button>
          </td>
        </tr>
      </tbody>
    </table>

    <button (click)="nuevo()" *ngIf="!editando">+ Nuevo ramo</button>

    <div class="form-crud" *ngIf="editando">
      <h3>{{ formulario.id ? 'Editar' : 'Nuevo' }} ramo</h3>

      <label>Nombre <input [(ngModel)]="formulario.nombre" placeholder="ej. Lenguaje" /></label>

      <label>Curso
        <select [(ngModel)]="formulario.cursoId">
          <option value="" disabled>Selecciona un curso</option>
          <option *ngFor="let c of cursos" [value]="c.id">{{ c.nombre }}</option>
        </select>
      </label>

      <label>Profesor
        <select [(ngModel)]="formulario.profesorId">
          <option value="" disabled>Selecciona un profesor</option>
          <option *ngFor="let p of profesores" [value]="p.id">{{ p.nombre }}</option>
        </select>
      </label>

      <label>Horas semanales <input type="number" min="1" [(ngModel)]="formulario.horasSemanales" /></label>

      <label class="checkbox">
        <input type="checkbox" [(ngModel)]="formulario.preferirManana" />
        Preferir horario de manana (regla 5)
      </label>

      <div class="no-disponible-editor">
        <strong>Horarios fijos obligatorios (ej. Orientacion):</strong>
        <div *ngFor="let ts of formulario.horariosFijos; let i = index" class="chip">
          {{ nombreDia(ts.dia) }} bloque {{ ts.bloque }}
          <button class="chip-x" (click)="quitarHorarioFijo(i)">x</button>
        </div>
        <div class="agregar-no-disponible">
          <select [(ngModel)]="diaNuevo">
            <option *ngFor="let d of dias" [value]="d.valor">{{ d.nombre }}</option>
          </select>
          <input type="number" min="1" [(ngModel)]="bloqueNuevo" style="width:60px" />
          <button (click)="agregarHorarioFijo()">Agregar</button>
        </div>
        <p style="font-size:0.8rem; color:#777;">
          Debe haber como maximo tantos horarios fijos como horas semanales (fija el HORARIO,
          no la sala). Las sesiones restantes quedan libres para que el solver las ubique.
        </p>
      </div>

      <div style="margin-top:12px; display:flex; gap:8px;">
        <button (click)="guardar()">Guardar</button>
        <button (click)="cancelar()">Cancelar</button>
      </div>
    </div>
  `
})
export class RamosPageComponent implements OnInit {

  ramos: RamoDto[] = [];
  cursos: CursoDto[] = [];
  profesores: ProfesorDto[] = [];

  editando = false;
  formulario: RamoDto = vacio();
  error: string | null = null;

  dias = DIAS;
  diaNuevo = 1;
  bloqueNuevo = 1;

  constructor(
    private ramoApi: RamoApiService,
    private cursoApi: CursoApiService,
    private profesorApi: ProfesorApiService
  ) {}

  ngOnInit(): void {
    this.cargarTodo();
  }

  cargarTodo(): void {
    forkJoin({
      ramos: this.ramoApi.listar(),
      cursos: this.cursoApi.listar(),
      profesores: this.profesorApi.listar()
    }).subscribe({
      next: ({ ramos, cursos, profesores }) => {
        this.ramos = ramos;
        this.cursos = cursos;
        this.profesores = profesores;
      },
      error: (err) => this.manejarError(err)
    });
  }

  nombreCurso(id: string): string {
    return this.cursos.find((c) => c.id === id)?.nombre ?? id;
  }

  nombreProfesor(id: string): string {
    return this.profesores.find((p) => p.id === id)?.nombre ?? id;
  }

  nombreDia(dia: number): string {
    return DIAS.find((d) => d.valor === dia)?.nombre ?? `Dia ${dia}`;
  }

  nuevo(): void {
    this.formulario = vacio();
    this.editando = true;
  }

  editar(r: RamoDto): void {
    this.formulario = { ...r, horariosFijos: r.horariosFijos ? [...r.horariosFijos] : [] };
    this.editando = true;
  }

  cancelar(): void {
    this.editando = false;
  }

  guardar(): void {
    this.error = null;
    const accion = this.formulario.id
      ? this.ramoApi.actualizar(this.formulario.id, this.formulario)
      : this.ramoApi.crear(this.formulario);

    accion.subscribe({
      next: () => {
        this.editando = false;
        this.cargarTodo();
      },
      error: (err) => this.manejarError(err)
    });
  }

  eliminar(r: RamoDto): void {
    if (!confirm(`¿Eliminar el ramo "${r.nombre}"?`)) return;
    this.ramoApi.eliminar(r.id).subscribe({
      next: () => this.cargarTodo(),
      error: (err) => this.manejarError(err)
    });
  }

  agregarHorarioFijo(): void {
    if (!this.formulario.horariosFijos) this.formulario.horariosFijos = [];
    const nuevo: TimeSlotDto = { dia: Number(this.diaNuevo), bloque: Number(this.bloqueNuevo) };
    const yaExiste = this.formulario.horariosFijos.some((ts) => ts.dia === nuevo.dia && ts.bloque === nuevo.bloque);
    if (!yaExiste) this.formulario.horariosFijos.push(nuevo);
  }

  quitarHorarioFijo(i: number): void {
    this.formulario.horariosFijos?.splice(i, 1);
  }

  private manejarError(err: HttpErrorResponse): void {
    this.error = err.error?.message ?? err.message ?? 'Error al comunicarse con el backend';
  }
}
