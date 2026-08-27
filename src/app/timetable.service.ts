import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { TimetableRequest, TimetableResponse, MoverSesionRequest } from './models';

@Injectable({ providedIn: 'root' })
export class TimetableService {

  // Backend Spring Boot corriendo en local. Ajustar si se despliega en otro host/puerto.
  private readonly baseUrl = 'http://localhost:8080/api/timetable';

  constructor(private http: HttpClient) {}

  resolver(request: TimetableRequest): Observable<TimetableResponse> {
    return this.http.post<TimetableResponse>(`${this.baseUrl}/solve`, request);
  }

  resolverDemo(): Observable<TimetableResponse> {
    return this.http.get<TimetableResponse>(`${this.baseUrl}/demo/solve`);
  }

  // Arma el TimetableRequest a partir de lo cargado via CRUD (profesores/cursos/salas/ramos/config).
  obtenerActual(): Observable<TimetableRequest> {
    return this.http.get<TimetableRequest>(`${this.baseUrl}/actual`);
  }

  // Solo calcula el score de un horario ya armado (sesionesActuales completas), no optimiza nada.
  verificar(request: TimetableRequest): Observable<TimetableResponse> {
    return this.http.post<TimetableResponse>(`${this.baseUrl}/verificar`, request);
  }

  // Mueve una sesion puntual a un nuevo dia/bloque y re-resuelve tocando lo minimo posible.
  moverSesion(request: MoverSesionRequest): Observable<TimetableResponse> {
    return this.http.post<TimetableResponse>(`${this.baseUrl}/mover-sesion`, request);
  }
}
