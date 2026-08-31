// Espejo (en TypeScript) de los DTOs del backend.

export interface TimeSlotDto {
  dia: number;
  bloque: number;
}

// Representa el estado COMPLETO de una sesion: cuando (dia/bloque) y donde (sala).
// salaId es obligatorio en sesionesActuales (para /verificar) y opcional en
// MoverSesionRequest.nuevoSlot (si se omite, la sesion mantiene la sala que ya tenia).
export interface AsignacionSesionDto {
  dia: number;
  bloque: number;
  salaId?: string;
}

export interface BloqueHorarioDto {
  numero: number;
  horaInicio: string; // "HH:mm"
  horaFin: string;
}

export interface ProfesorDto {
  id: string;
  nombre: string;
  noDisponible?: TimeSlotDto[];
  horaIngreso?: string;       // "HH:mm", ventana de contrato (regla 3)
  horaSalida?: string;
  maxHorasSemanales?: number; // regla 2, validado al cargar, no es constraint del solver
}

export interface SalaDto {
  id: string;
  nombre: string;
  color?: string; // hexadecimal "#RRGGBB", identifica la sala por el color de su puerta
}

export interface CursoDto {
  id: string;
  nombre: string;
  horaSalidaMaxima?: string; // "HH:mm", regla 4 (ej. IV medios en ciertos periodos)
}

export interface RamoDto {
  id: string;
  nombre: string;
  cursoId: string;
  profesorId: string;
  horasSemanales: number;
  // La sala NO es un dato fijo del ramo: es una variable de planificacion por sesion
  // que decide el solver (puede variar de un dia a otro para el mismo ramo).
  horariosFijos?: TimeSlotDto[];
  sesionesActuales?: AsignacionSesionDto[];
  preferirManana?: boolean; // regla 5
}

export interface TimetableRequest {
  dias: number;
  bloquesPorDia: number;
  bloques?: BloqueHorarioDto[];
  horaCorteManana?: string;
  profesores: ProfesorDto[];
  salas: SalaDto[];
  cursos: CursoDto[];
  ramos: RamoDto[];
}

export interface ConfiguracionColegioDto {
  dias: number;
  bloquesPorDia: number;
  bloques?: BloqueHorarioDto[];
  horaCorteManana?: string;
}

export interface SesionResponse {
  ramoId: string;
  indiceSesion: number;
  cursoId: string;
  curso: string;
  profesorId: string;
  ramo: string;
  profesor: string;
  salaId: string;
  sala: string;
  salaColor?: string;
  dia: number;
  bloque: number;
  movida: boolean;
}

export interface DetalleRestriccion {
  restriccion: string;
  score: string;
  ocurrencias: number;
}

export interface TimetableResponse {
  score: string;
  factible: boolean;
  sesiones: SesionResponse[];
  detalle?: DetalleRestriccion[];
}

export interface MoverSesionRequest {
  horario: TimetableRequest;
  ramoId: string;
  indiceSesion: number;
  nuevoSlot: AsignacionSesionDto;
}
