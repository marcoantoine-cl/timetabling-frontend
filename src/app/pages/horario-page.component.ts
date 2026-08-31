import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { TimetableService } from '../timetable.service';
import { TimetableViewComponent, MoverSesionEvent, AgruparPor } from '../timetable-view.component';
import { TimetableRequest, TimetableResponse, SalaDto, AsignacionSesionDto } from '../models';

const EJEMPLO_JSON: TimetableRequest = {
  dias: 5,
  bloquesPorDia: 8,
  horaCorteManana: '13:00',
  profesores: [
    { id: 'P1', nombre: 'Juan Perez', horaIngreso: '08:00', horaSalida: '16:00', maxHorasSemanales: 30 },
    { id: 'P2', nombre: 'Ana Soto', horaIngreso: '08:00', horaSalida: '14:00', maxHorasSemanales: 24,
      noDisponible: [
        { dia: 5, bloque: 1 }, { dia: 5, bloque: 2 }, { dia: 5, bloque: 3 }, { dia: 5, bloque: 4 },
        { dia: 5, bloque: 5 }, { dia: 5, bloque: 6 }, { dia: 5, bloque: 7 }, { dia: 5, bloque: 8 }
      ] },
    { id: 'P3', nombre: 'Luis Rojas', horaIngreso: '08:00', horaSalida: '16:00', maxHorasSemanales: 20,
      noDisponible: [{ dia: 1, bloque: 1 }] }
  ],
  // El universo de salas entre las que el solver elige libremente para cada sesion.
  salas: [
    { id: 'R1', nombre: 'Gimnasio', color: '#FF7043' },
    { id: 'R2', nombre: 'Sala 101', color: '#4CAF50' },
    { id: 'R3', nombre: 'Sala 102', color: '#2196F3' }
  ],
  cursos: [
    { id: 'C1', nombre: 'II A' },
    { id: 'C2', nombre: 'II B', horaSalidaMaxima: '14:00' }
  ],
  ramos: [
    // Un mismo profesor puede dictar varios ramos a un mismo curso: P1 dicta tanto
    // Lenguaje como Orientacion a II A. La sala NO se fija aqui: el solver la asigna
    // por sesion (un mismo ramo puede terminar en salas distintas segun el dia).
    { id: 'R-LEN-C1', nombre: 'Lenguaje', cursoId: 'C1', profesorId: 'P1', horasSemanales: 6, preferirManana: true },
    { id: 'R-MAT-C1', nombre: 'Matematica', cursoId: 'C1', profesorId: 'P2', horasSemanales: 6, preferirManana: true },
    { id: 'R-ORI-C1', nombre: 'Orientacion', cursoId: 'C1', profesorId: 'P1', horasSemanales: 1,
      horariosFijos: [{ dia: 4, bloque: 1 }] },
    { id: 'R-EDF-C1', nombre: 'Educacion Fisica', cursoId: 'C1', profesorId: 'P3', horasSemanales: 2 },

    { id: 'R-LEN-C2', nombre: 'Lenguaje', cursoId: 'C2', profesorId: 'P2', horasSemanales: 6, preferirManana: true },
    { id: 'R-MAT-C2', nombre: 'Matematica', cursoId: 'C2', profesorId: 'P1', horasSemanales: 6, preferirManana: true },
    { id: 'R-ORI-C2', nombre: 'Orientacion', cursoId: 'C2', profesorId: 'P2', horasSemanales: 1,
      horariosFijos: [{ dia: 4, bloque: 1 }] },
    { id: 'R-EDF-C2', nombre: 'Educacion Fisica', cursoId: 'C2', profesorId: 'P3', horasSemanales: 2 }
  ]
};

@Component({
  selector: 'app-horario-page',
  standalone: true,
  imports: [CommonModule, FormsModule, TimetableViewComponent],
  template: `
    <h1>Asignacion horaria de profesores</h1>

    <p>
      Pega o edita el JSON del colegio (cursos, profesores, ramos, salas), o usa "Cargar desde CRUD"
      para traer lo que hayas cargado en las paginas de Profesores/Cursos/Salas/Ramos. La sala NO se
      fija por ramo: el solver la asigna a cada sesión (puede variar de un día a otro). Si ya tienes
      un horario armado, incluye <code>sesionesActuales</code> en cada ramo con su día/bloque/sala
      actual y usa "Verificar" directamente, sin necesidad de "Resolver".
    </p>

    <textarea rows="16" [(ngModel)]="jsonTexto"></textarea>

    <div style="margin-top: 12px; display:flex; gap: 8px; flex-wrap: wrap;">
      <button (click)="cargarDesdeCrud()" [disabled]="cargando">
        {{ cargando ? 'Cargando...' : 'Cargar desde CRUD' }}
      </button>
      <button (click)="resolverDesdeElJson()" [disabled]="cargando">
        {{ cargando ? 'Resolviendo...' : 'Resolver (generar desde cero)' }}
      </button>
      <button (click)="verificar()" [disabled]="cargando">
        {{ cargando ? 'Verificando...' : 'Verificar factibilidad' }}
      </button>
    </div>

    <div class="error-box" *ngIf="error">{{ error }}</div>

    <div class="score-box" *ngIf="resultado" [class.factible]="resultado.factible" [class.no-factible]="!resultado.factible">
      Score: {{ resultado.score }}
      <span *ngIf="!resultado.factible"> — hay restricciones duras sin cumplir</span>
    </div>

    <ul *ngIf="resultado?.detalle?.length">
      <li *ngFor="let d of resultado!.detalle">
        <strong>{{ d.restriccion }}</strong>: {{ d.score }} ({{ d.ocurrencias }} ocurrencia(s))
      </li>
    </ul>

    <div *ngIf="resultado" style="display:flex; align-items:center; gap:12px; margin: 16px 0 8px;">
      <strong>Ver horario por:</strong>
      <button (click)="agruparPor = 'curso'" [disabled]="agruparPor === 'curso'">Curso</button>
      <button (click)="agruparPor = 'profesor'" [disabled]="agruparPor === 'profesor'">Profesor</button>
    </div>

    <p *ngIf="resultado" style="font-size:0.85rem; color:#555;">
      El recuadro de color dentro de cada celda indica la sala asignada (identificada
      por el color de su puerta) — pasa el mouse por encima para ver su nombre.
      Las celdas en amarillo son sesiones que quedaron en un horario o sala distinto al
      original (por ejemplo, porque el solver tuvo que reubicarlas al mover otra sesion).
      Usa el botón "Mover" dentro de una celda para reasignarla a otro día/bloque/sala.
    </p>

    <app-timetable-view
      *ngIf="resultado"
      [sesiones]="resultado.sesiones"
      [dias]="diasSolicitados"
      [bloquesPorDia]="bloquesSolicitados"
      [editable]="true"
      [agruparPor]="agruparPor"
      [salas]="salasDisponibles"
      (moverSesion)="onMoverSesion($event)">
    </app-timetable-view>
  `
})
export class HorarioPageComponent {

  jsonTexto = JSON.stringify(EJEMPLO_JSON, null, 2);
  cargando = false;
  error: string | null = null;
  resultado: TimetableResponse | null = null;
  agruparPor: AgruparPor = 'curso';

  diasSolicitados = 5;
  bloquesSolicitados = 8;
  salasDisponibles: SalaDto[] = [];

  constructor(private timetableService: TimetableService) {}

  private parsearJson(): TimetableRequest | null {
    try {
      const request = JSON.parse(this.jsonTexto) as TimetableRequest;
      this.diasSolicitados = request.dias ?? 5;
      this.bloquesSolicitados = request.bloquesPorDia ?? 8;
      this.salasDisponibles = request.salas ?? [];
      return request;
    } catch (e) {
      this.error = 'El JSON no es valido: ' + (e as Error).message;
      return null;
    }
  }

  // Trae el JSON armado desde lo cargado en las paginas CRUD (profesores/cursos/salas/ramos/config)
  // y lo pone en el textarea, listo para Resolver o Verificar.
  cargarDesdeCrud(): void {
    this.error = null;
    this.cargando = true;
    this.timetableService.obtenerActual().subscribe({
      next: (request) => {
        this.jsonTexto = JSON.stringify(request, null, 2);
        this.cargando = false;
      },
      error: (err) => this.manejarError(err)
    });
  }

  resolverDesdeElJson(): void {
    this.error = null;
    const request = this.parsearJson();
    if (!request) return;

    this.cargando = true;
    this.timetableService.resolver(request).subscribe({
      next: (respuesta) => this.aplicarResultado(respuesta),
      error: (err) => this.manejarError(err)
    });
  }

  verificar(): void {
    this.error = null;
    const request = this.parsearJson();
    if (!request) return;

    this.cargando = true;
    this.timetableService.verificar(request).subscribe({
      next: (respuesta) => this.aplicarResultado(respuesta),
      error: (err) => this.manejarError(err)
    });
  }

  onMoverSesion(evento: MoverSesionEvent): void {
    this.error = null;
    const request = this.parsearJson();
    if (!request) return;

    this.cargando = true;
    this.timetableService.moverSesion({
      horario: request,
      ramoId: evento.ramoId,
      indiceSesion: evento.indiceSesion,
      nuevoSlot: { dia: evento.nuevoDia, bloque: evento.nuevoBloque, salaId: evento.nuevaSalaId }
    }).subscribe({
      next: (respuesta) => this.aplicarResultado(respuesta),
      error: (err) => this.manejarError(err)
    });
  }

  private aplicarResultado(respuesta: TimetableResponse): void {
    this.resultado = respuesta;
    this.cargando = false;
    this.actualizarJsonConResultado(respuesta);
  }

  private manejarError(err: HttpErrorResponse): void {
    this.error = err.error?.message ?? err.message ?? 'Error desconocido al procesar el horario';
    this.cargando = false;
  }

  // Despues de cada accion (resolver/verificar/mover), deja el JSON del textarea sincronizado
  // con el resultado (cada ramo con su sesionesActuales — dia, bloque Y sala — al dia), para
  // que la proxima Verificar/Mover parta del estado correcto sin que el usuario tenga que
  // editarlo a mano.
  private actualizarJsonConResultado(respuesta: TimetableResponse): void {
    let request: TimetableRequest;
    try {
      request = JSON.parse(this.jsonTexto);
    } catch {
      return;
    }

    const porRamo = new Map<string, AsignacionSesionDto[]>();
    for (const s of respuesta.sesiones) {
      if (!porRamo.has(s.ramoId)) porRamo.set(s.ramoId, []);
      porRamo.get(s.ramoId)![s.indiceSesion] = { dia: s.dia, bloque: s.bloque, salaId: s.salaId };
    }

    for (const ramo of request.ramos) {
      const sesiones = porRamo.get(ramo.id);
      if (sesiones) ramo.sesionesActuales = sesiones;
    }

    this.jsonTexto = JSON.stringify(request, null, 2);
  }
}
