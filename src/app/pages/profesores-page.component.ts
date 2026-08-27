import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { ProfesorApiService } from '../crud/entity-api.services';
import { ProfesorDto, TimeSlotDto } from '../models';

const DIAS = [
  { valor: 1, nombre: 'Lunes' }, { valor: 2, nombre: 'Martes' }, { valor: 3, nombre: 'Miercoles' },
  { valor: 4, nombre: 'Jueves' }, { valor: 5, nombre: 'Viernes' }
];

function vacio(): ProfesorDto {
  return { id: '', nombre: '', horaIngreso: '', horaSalida: '', maxHorasSemanales: undefined, noDisponible: [] };
}

@Component({
  selector: 'app-profesores-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <h1>Profesores</h1>
    <div class="error-box" *ngIf="error">{{ error }}</div>

    <table class="tabla-crud">
      <thead>
        <tr>
          <th>Nombre</th><th>Ingreso</th><th>Salida</th><th>Max h/sem</th><th>No disponible</th><th></th>
        </tr>
      </thead>
      <tbody>
        <tr *ngFor="let p of profesores">
          <td>{{ p.nombre }}</td>
          <td>{{ p.horaIngreso || '—' }}</td>
          <td>{{ p.horaSalida || '—' }}</td>
          <td>{{ p.maxHorasSemanales ?? '—' }}</td>
          <td>{{ p.noDisponible?.length ? p.noDisponible!.length + ' bloque(s)' : '—' }}</td>
          <td>
            <button (click)="editar(p)">Editar</button>
            <button (click)="eliminar(p)">Eliminar</button>
          </td>
        </tr>
      </tbody>
    </table>

    <button (click)="nuevo()" *ngIf="!editando">+ Nuevo profesor</button>

    <div class="form-crud" *ngIf="editando">
      <h3>{{ formulario.id ? 'Editar' : 'Nuevo' }} profesor</h3>

      <label>Nombre <input [(ngModel)]="formulario.nombre" /></label>
      <label>Hora ingreso <input type="time" [(ngModel)]="formulario.horaIngreso" /></label>
      <label>Hora salida <input type="time" [(ngModel)]="formulario.horaSalida" /></label>
      <label>Max horas semanales <input type="number" [(ngModel)]="formulario.maxHorasSemanales" /></label>

      <div class="no-disponible-editor">
        <strong>No disponible:</strong>
        <div *ngFor="let ts of formulario.noDisponible; let i = index" class="chip">
          {{ nombreDia(ts.dia) }} bloque {{ ts.bloque }}
          <button class="chip-x" (click)="quitarNoDisponible(i)">x</button>
        </div>
        <div class="agregar-no-disponible">
          <select [(ngModel)]="diaNuevo">
            <option *ngFor="let d of dias" [value]="d.valor">{{ d.nombre }}</option>
          </select>
          <input type="number" min="1" [(ngModel)]="bloqueNuevo" style="width:60px" />
          <button (click)="agregarNoDisponible()">Agregar</button>
        </div>
      </div>

      <div style="margin-top:12px; display:flex; gap:8px;">
        <button (click)="guardar()">Guardar</button>
        <button (click)="cancelar()">Cancelar</button>
      </div>
    </div>
  `
})
export class ProfesoresPageComponent implements OnInit {

  profesores: ProfesorDto[] = [];
  editando = false;
  formulario: ProfesorDto = vacio();
  error: string | null = null;

  dias = DIAS;
  diaNuevo = 1;
  bloqueNuevo = 1;

  constructor(private api: ProfesorApiService) {}

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.api.listar().subscribe({
      next: (lista) => (this.profesores = lista),
      error: (err) => this.manejarError(err)
    });
  }

  nuevo(): void {
    this.formulario = vacio();
    this.editando = true;
  }

  editar(p: ProfesorDto): void {
    this.formulario = { ...p, noDisponible: p.noDisponible ? [...p.noDisponible] : [] };
    this.editando = true;
  }

  cancelar(): void {
    this.editando = false;
  }

  guardar(): void {
    this.error = null;
    const accion = this.formulario.id
      ? this.api.actualizar(this.formulario.id, this.formulario)
      : this.api.crear(this.formulario);

    accion.subscribe({
      next: () => {
        this.editando = false;
        this.cargar();
      },
      error: (err) => this.manejarError(err)
    });
  }

  eliminar(p: ProfesorDto): void {
    if (!confirm(`¿Eliminar al profesor "${p.nombre}"?`)) return;
    this.api.eliminar(p.id).subscribe({
      next: () => this.cargar(),
      error: (err) => this.manejarError(err)
    });
  }

  agregarNoDisponible(): void {
    if (!this.formulario.noDisponible) this.formulario.noDisponible = [];
    const nuevo: TimeSlotDto = { dia: Number(this.diaNuevo), bloque: Number(this.bloqueNuevo) };
    const yaExiste = this.formulario.noDisponible.some((ts) => ts.dia === nuevo.dia && ts.bloque === nuevo.bloque);
    if (!yaExiste) this.formulario.noDisponible.push(nuevo);
  }

  quitarNoDisponible(i: number): void {
    this.formulario.noDisponible?.splice(i, 1);
  }

  nombreDia(dia: number): string {
    return DIAS.find((d) => d.valor === dia)?.nombre ?? `Dia ${dia}`;
  }

  private manejarError(err: HttpErrorResponse): void {
    this.error = err.error?.message ?? err.message ?? 'Error al comunicarse con el backend';
  }
}
