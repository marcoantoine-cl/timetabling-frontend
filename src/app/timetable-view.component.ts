import { Component, EventEmitter, Input, OnChanges, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SesionResponse } from './models';

interface Celda {
  ramoId: string;
  indiceSesion: number;
  lineaPrincipal: string; // por curso: nombre del ramo; por profesor: curso + ramo
  lineaSecundaria: string; // por curso: profesor; por profesor: (vacio, ya esta en lineaPrincipal)
  salaNombre: string;
  salaColor?: string;
  movida: boolean;
}

interface TablaAgrupada {
  titulo: string;
  // matriz[bloque-1][dia-1] = Celda | null
  matriz: (Celda | null)[][];
}

export type AgruparPor = 'curso' | 'profesor';

export interface MoverSesionEvent {
  ramoId: string;
  indiceSesion: number;
  nuevoDia: number;
  nuevoBloque: number;
}

const NOMBRES_DIA: Record<number, string> = {
  1: 'Lunes', 2: 'Martes', 3: 'Miercoles', 4: 'Jueves', 5: 'Viernes', 6: 'Sabado'
};

@Component({
  selector: 'app-timetable-view',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div *ngFor="let tabla of tablas">
      <table class="horario">
        <caption>
          {{ tabla.titulo }}
          <span class="caption-extra" *ngIf="agruparPor === 'profesor'">
            ({{ contarSesiones(tabla) }} horas/semana)
          </span>
        </caption>
        <thead>
          <tr>
            <th>Bloque</th>
            <th *ngFor="let dia of diasVisibles">{{ nombreDia(dia) }}</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let fila of tabla.matriz; let bloqueIdx = index">
            <th>{{ bloqueIdx + 1 }}</th>
            <td *ngFor="let celda of fila; let diaIdx = index"
                [class.celda-movida]="celda?.movida"
                [class.celda-editando]="esCeldaEnEdicion(celda, bloqueIdx + 1, diaIdx + 1)">
              <ng-container *ngIf="celda; else vacio">
                <div class="celda-encabezado">
                  <span class="sala-swatch" [style.background]="celda.salaColor || '#ccc'"
                        [title]="'Sala: ' + celda.salaNombre"></span>
                  <div class="celda-ramo">{{ celda.lineaPrincipal }}</div>
                </div>
                <div class="celda-profesor" *ngIf="celda.lineaSecundaria">{{ celda.lineaSecundaria }}</div>
                <div class="celda-sala">{{ celda.salaNombre }}</div>

                <button class="btn-editar" *ngIf="editable && !enEdicion" (click)="empezarEdicion(celda, bloqueIdx + 1, diaIdx + 1)">
                  Mover
                </button>

                <div class="editor-celda" *ngIf="esCeldaEnEdicion(celda, bloqueIdx + 1, diaIdx + 1)">
                  <select [(ngModel)]="diaDestino">
                    <option *ngFor="let d of diasVisibles" [value]="d">{{ nombreDia(d) }}</option>
                  </select>
                  <select [(ngModel)]="bloqueDestino">
                    <option *ngFor="let b of bloquesVisibles" [value]="b">{{ b }}</option>
                  </select>
                  <button (click)="confirmarMovimiento(celda)">OK</button>
                  <button (click)="cancelarEdicion()">X</button>
                </div>
              </ng-container>
              <ng-template #vacio>&mdash;</ng-template>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  `,
  styles: [`
    .celda-movida { background: #fff6d8; }
    .celda-editando { background: #e8f0fe; }
    .celda-encabezado { display: flex; align-items: center; gap: 5px; justify-content: center; }
    .sala-swatch {
      display: inline-block;
      width: 10px;
      height: 10px;
      border-radius: 2px;
      border: 1px solid rgba(0,0,0,0.2);
      flex-shrink: 0;
    }
    .celda-sala { font-size: 0.7rem; color: #888; }
    .btn-editar { font-size: 0.7rem; padding: 2px 6px; margin-top: 4px; }
    .editor-celda { display: flex; gap: 4px; margin-top: 6px; flex-wrap: wrap; }
    .editor-celda select { font-size: 0.75rem; }
    .editor-celda button { font-size: 0.7rem; padding: 2px 6px; }
    .caption-extra { font-weight: 400; font-size: 0.85rem; color: #555; }
  `]
})
export class TimetableViewComponent implements OnChanges {

  @Input() sesiones: SesionResponse[] = [];
  @Input() dias = 5;
  @Input() bloquesPorDia = 8;
  @Input() editable = false;
  @Input() agruparPor: AgruparPor = 'curso';

  @Output() moverSesion = new EventEmitter<MoverSesionEvent>();

  tablas: TablaAgrupada[] = [];
  diasVisibles: number[] = [];
  bloquesVisibles: number[] = [];

  enEdicion: { ramoId: string; indiceSesion: number; dia: number; bloque: number } | null = null;
  diaDestino = 1;
  bloqueDestino = 1;

  ngOnChanges(): void {
    this.diasVisibles = Array.from({ length: this.dias }, (_, i) => i + 1);
    this.bloquesVisibles = Array.from({ length: this.bloquesPorDia }, (_, i) => i + 1);
    this.enEdicion = null;

    const ordenTitulos: string[] = [];
    const porTitulo = new Map<string, (Celda | null)[][]>();

    for (const sesion of this.sesiones) {
      const titulo = this.agruparPor === 'curso' ? sesion.curso : sesion.profesor;

      if (!porTitulo.has(titulo)) {
        ordenTitulos.push(titulo);
        const matriz: (Celda | null)[][] = Array.from(
          { length: this.bloquesPorDia },
          () => Array.from({ length: this.dias }, () => null)
        );
        porTitulo.set(titulo, matriz);
      }
      const matriz = porTitulo.get(titulo)!;
      const filaIdx = sesion.bloque - 1;
      const colIdx = sesion.dia - 1;
      if (filaIdx >= 0 && filaIdx < this.bloquesPorDia && colIdx >= 0 && colIdx < this.dias) {
        matriz[filaIdx][colIdx] = this.agruparPor === 'curso'
          ? {
              ramoId: sesion.ramoId,
              indiceSesion: sesion.indiceSesion,
              lineaPrincipal: sesion.ramo,
              lineaSecundaria: sesion.profesor,
              salaNombre: sesion.sala,
              salaColor: sesion.salaColor,
              movida: sesion.movida
            }
          : {
              ramoId: sesion.ramoId,
              indiceSesion: sesion.indiceSesion,
              lineaPrincipal: sesion.ramo,
              lineaSecundaria: sesion.curso,
              salaNombre: sesion.sala,
              salaColor: sesion.salaColor,
              movida: sesion.movida
            };
      }
    }

    this.tablas = ordenTitulos.map((titulo) => ({ titulo, matriz: porTitulo.get(titulo)! }));
  }

  contarSesiones(tabla: TablaAgrupada): number {
    return tabla.matriz.reduce((total, fila) => total + fila.filter((c) => c !== null).length, 0);
  }

  nombreDia(dia: number): string {
    return NOMBRES_DIA[dia] ?? `Dia ${dia}`;
  }

  empezarEdicion(celda: Celda, bloqueActual: number, diaActual: number): void {
    this.enEdicion = { ramoId: celda.ramoId, indiceSesion: celda.indiceSesion, dia: diaActual, bloque: bloqueActual };
    this.diaDestino = diaActual;
    this.bloqueDestino = bloqueActual;
  }

  cancelarEdicion(): void {
    this.enEdicion = null;
  }

  esCeldaEnEdicion(celda: Celda | null, bloque: number, dia: number): boolean {
    return !!celda && !!this.enEdicion
      && this.enEdicion.ramoId === celda.ramoId
      && this.enEdicion.indiceSesion === celda.indiceSesion
      && this.enEdicion.bloque === bloque
      && this.enEdicion.dia === dia;
  }

  confirmarMovimiento(celda: Celda): void {
    this.moverSesion.emit({
      ramoId: celda.ramoId,
      indiceSesion: celda.indiceSesion,
      nuevoDia: Number(this.diaDestino),
      nuevoBloque: Number(this.bloqueDestino)
    });
    this.enEdicion = null;
  }
}
