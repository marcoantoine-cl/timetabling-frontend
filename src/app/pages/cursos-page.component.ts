import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { CursoApiService } from '../crud/entity-api.services';
import { CursoDto } from '../models';

function vacio(): CursoDto {
  return { id: '', nombre: '', horaSalidaMaxima: '' };
}

@Component({
  selector: 'app-cursos-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <h1>Cursos</h1>
    <div class="error-box" *ngIf="error">{{ error }}</div>

    <table class="tabla-crud">
      <thead><tr><th>Nombre</th><th>Hora salida maxima</th><th></th></tr></thead>
      <tbody>
        <tr *ngFor="let c of cursos">
          <td>{{ c.nombre }}</td>
          <td>{{ c.horaSalidaMaxima || '—' }}</td>
          <td>
            <button (click)="editar(c)">Editar</button>
            <button (click)="eliminar(c)">Eliminar</button>
          </td>
        </tr>
      </tbody>
    </table>

    <button (click)="nuevo()" *ngIf="!editando">+ Nuevo curso</button>

    <div class="form-crud" *ngIf="editando">
      <h3>{{ formulario.id ? 'Editar' : 'Nuevo' }} curso</h3>
      <label>Nombre <input [(ngModel)]="formulario.nombre" placeholder="ej. IV A" /></label>
      <label>
        Hora salida maxima (regla 4, opcional)
        <input type="time" [(ngModel)]="formulario.horaSalidaMaxima" />
      </label>

      <div style="margin-top:12px; display:flex; gap:8px;">
        <button (click)="guardar()">Guardar</button>
        <button (click)="cancelar()">Cancelar</button>
      </div>
    </div>
  `
})
export class CursosPageComponent implements OnInit {

  cursos: CursoDto[] = [];
  editando = false;
  formulario: CursoDto = vacio();
  error: string | null = null;

  constructor(private api: CursoApiService) {}

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.api.listar().subscribe({
      next: (lista) => (this.cursos = lista),
      error: (err) => this.manejarError(err)
    });
  }

  nuevo(): void {
    this.formulario = vacio();
    this.editando = true;
  }

  editar(c: CursoDto): void {
    this.formulario = { ...c };
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

  eliminar(c: CursoDto): void {
    if (!confirm(`¿Eliminar el curso "${c.nombre}"?`)) return;
    this.api.eliminar(c.id).subscribe({
      next: () => this.cargar(),
      error: (err) => this.manejarError(err)
    });
  }

  private manejarError(err: HttpErrorResponse): void {
    this.error = err.error?.message ?? err.message ?? 'Error al comunicarse con el backend';
  }
}
