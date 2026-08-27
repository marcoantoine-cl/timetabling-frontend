import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { SalaApiService } from '../crud/entity-api.services';
import { SalaDto } from '../models';

function vacio(): SalaDto {
  return { id: '', nombre: '', color: '#4CAF50' };
}

@Component({
  selector: 'app-salas-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <h1>Salas</h1>
    <p style="color:#555; font-size:0.9rem;">
      Cada sala se identifica por el color de su puerta. Toda sesión de un ramo tiene
      una sala asignada (aula propia del curso, gimnasio, laboratorio, etc.) — dos ramos
      nunca pueden coincidir en la misma sala al mismo tiempo.
    </p>
    <div class="error-box" *ngIf="error">{{ error }}</div>

    <table class="tabla-crud">
      <thead><tr><th>Color</th><th>Nombre</th><th></th></tr></thead>
      <tbody>
        <tr *ngFor="let s of salas">
          <td><span class="swatch" [style.background]="s.color || '#ccc'"></span></td>
          <td>{{ s.nombre }}</td>
          <td>
            <button (click)="editar(s)">Editar</button>
            <button (click)="eliminar(s)">Eliminar</button>
          </td>
        </tr>
      </tbody>
    </table>

    <button (click)="nuevo()" *ngIf="!editando">+ Nueva sala</button>

    <div class="form-crud" *ngIf="editando">
      <h3>{{ formulario.id ? 'Editar' : 'Nueva' }} sala</h3>
      <label>Nombre <input [(ngModel)]="formulario.nombre" placeholder="ej. Sala 101" /></label>
      <label>
        Color de la puerta (identifica la sala)
        <div style="display:flex; align-items:center; gap:8px;">
          <input type="color" [(ngModel)]="formulario.color" />
          <span>{{ formulario.color || '(sin color asignado)' }}</span>
        </div>
      </label>

      <div style="margin-top:12px; display:flex; gap:8px;">
        <button (click)="guardar()">Guardar</button>
        <button (click)="cancelar()">Cancelar</button>
      </div>
    </div>
  `,
  styles: [`
    .swatch {
      display: inline-block;
      width: 20px;
      height: 20px;
      border-radius: 4px;
      border: 1px solid #ccc;
    }
  `]
})
export class SalasPageComponent implements OnInit {

  salas: SalaDto[] = [];
  editando = false;
  formulario: SalaDto = vacio();
  error: string | null = null;

  constructor(private api: SalaApiService) {}

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.api.listar().subscribe({
      next: (lista) => (this.salas = lista),
      error: (err) => this.manejarError(err)
    });
  }

  nuevo(): void {
    this.formulario = vacio();
    this.editando = true;
  }

  editar(s: SalaDto): void {
    this.formulario = { ...s };
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

  eliminar(s: SalaDto): void {
    if (!confirm(`¿Eliminar la sala "${s.nombre}"?`)) return;
    this.api.eliminar(s.id).subscribe({
      next: () => this.cargar(),
      error: (err) => this.manejarError(err)
    });
  }

  private manejarError(err: HttpErrorResponse): void {
    this.error = err.error?.message ?? err.message ?? 'Error al comunicarse con el backend';
  }
}
