import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CrudApiService } from './crud-api.service';
import { ProfesorDto, CursoDto, SalaDto, RamoDto, ConfiguracionColegioDto } from '../models';

const BASE = 'http://localhost:8080/api';

@Injectable({ providedIn: 'root' })
export class ProfesorApiService extends CrudApiService<ProfesorDto> {
  constructor(http: HttpClient) {
    super(http, `${BASE}/profesores`);
  }
}

@Injectable({ providedIn: 'root' })
export class CursoApiService extends CrudApiService<CursoDto> {
  constructor(http: HttpClient) {
    super(http, `${BASE}/cursos`);
  }
}

@Injectable({ providedIn: 'root' })
export class SalaApiService extends CrudApiService<SalaDto> {
  constructor(http: HttpClient) {
    super(http, `${BASE}/salas`);
  }
}

@Injectable({ providedIn: 'root' })
export class RamoApiService extends CrudApiService<RamoDto> {
  constructor(http: HttpClient) {
    super(http, `${BASE}/ramos`);
  }
}

@Injectable({ providedIn: 'root' })
export class ConfiguracionApiService {
  constructor(private http: HttpClient) {}

  obtener(): Observable<ConfiguracionColegioDto> {
    return this.http.get<ConfiguracionColegioDto>(`${BASE}/config`);
  }

  actualizar(config: ConfiguracionColegioDto): Observable<ConfiguracionColegioDto> {
    return this.http.put<ConfiguracionColegioDto>(`${BASE}/config`, config);
  }
}
