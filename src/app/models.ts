// Espejo (en TypeScript) de los DTOs del backend.

export interface TimeSlotDto {
  dia: number;
  bloque: number;
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
  color?: string;
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
  salaId?: string;
  horariosFijos?: TimeSlotDto[];
  sesionesActuales?: TimeSlotDto[];
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
  nuevoSlot: TimeSlotDto;
}
