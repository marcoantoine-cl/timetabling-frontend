import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

/**
 * Wrapper generico sobre HttpClient para los 4 endpoints CRUD que comparten
 * la misma forma (GET lista, GET por id, POST crear, PUT actualizar, DELETE).
 * No es @Injectable: cada servicio especifico (ProfesorApiService, etc.) lo
 * instancia con su propia URL base, asi cada uno queda con tipos concretos.
 */
export class CrudApiService<T extends { id?: string }> {

  constructor(private http: HttpClient, private baseUrl: string) {}

  listar(): Observable<T[]> {
    return this.http.get<T[]>(this.baseUrl);
  }

  obtener(id: string): Observable<T> {
    return this.http.get<T>(`${this.baseUrl}/${id}`);
  }

  crear(entidad: T): Observable<T> {
    return this.http.post<T>(this.baseUrl, entidad);
  }

  actualizar(id: string, entidad: T): Observable<T> {
    return this.http.put<T>(`${this.baseUrl}/${id}`, entidad);
  }

  eliminar(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
