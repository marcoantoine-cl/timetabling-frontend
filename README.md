# Frontend Angular - Visualizador de horarios

## Cómo correr

```bash
npm install
npm start
```

Abre `http://localhost:4200`. El backend Spring Boot debe estar corriendo en
`http://localhost:8080` (`mvn spring-boot:run` en el proyecto `timetabling`).
El controlador ya tiene `@CrossOrigin(origins = "http://localhost:4200")`
habilitado para que esto funcione en desarrollo sin configuración adicional.

## Qué hay ahora

La app tiene navegación (Angular Router) con 5 páginas:

- **Horario** (`/`): la vista original — textarea JSON + Resolver/Verificar/Mover,
  más un botón nuevo **"Cargar desde CRUD"** que trae el JSON armado desde lo
  cargado en las páginas de abajo (`GET /api/timetable/actual`). El horario
  resultante se puede ver **por curso o por profesor** (toggle arriba de la
  tabla) — la vista por profesor es útil para ver su carga horaria de un
  vistazo y detectar huecos o exceso de horas seguidas.
- **Profesores** (`/profesores`), **Cursos** (`/cursos`), **Salas** (`/salas`),
  **Ramos** (`/ramos`): páginas CRUD estándar (listar/crear/editar/eliminar)
  contra los endpoints REST del backend. Los datos persisten en memoria en el
  backend mientras la app esté corriendo (se precargan con un dataset de
  ejemplo al arrancar `DatosIniciales`).

## Qué hace la página de Horario

- Un `<textarea>` con un JSON de ejemplo precargado (2 cursos, 3 profesores,
  8 ramos), o el botón **"Cargar desde CRUD"** para traer lo que hayas cargado
  en las páginas de gestión.
- **Resolver (generar desde cero)**: `POST /solve`, ignora cualquier posición
  previa y arma el horario completo desde cero.
- **Verificar factibilidad**: `POST /verificar` — si tu JSON ya trae
  `sesionesActuales` en cada ramo (un horario que ya tenías, migrado de otro
  sistema por ejemplo), este botón NO mueve nada: solo calcula el score y te
  dice si es factible, y si no, qué restricciones se violan exactamente.
- **Mover una sesión**: dentro de cada celda ocupada de la tabla aparece un
  botón "Mover" → eliges nuevo día/bloque → se llama a `POST /mover-sesion`,
  que ancla ese cambio y re-resuelve tocando lo mínimo posible el resto del
  horario. Las celdas que terminaron en una posición distinta a la que tenían
  antes de tu cambio quedan resaltadas en amarillo, para que veas qué más se
  movió como consecuencia.
- **Por curso / Por profesor**: la misma tabla, agrupada distinto. Por
  profesor muestra además el total de horas/semana en el título de cada tabla.
- Después de cada acción, el JSON del textarea se actualiza solo con las
  posiciones resultantes (`sesionesActuales`), así la siguiente acción
  (Verificar o Mover) siempre parte del estado correcto.

## Formato del JSON de entrada

```jsonc
{
  "dias": 5,
  "bloquesPorDia": 8,
  "profesores": [
    { "id": "P1", "nombre": "Juan Perez", "noDisponible": [{ "dia": 1, "bloque": 1 }] }
  ],
  "salas": [
    { "id": "R1", "nombre": "Gimnasio" }
  ],
  "cursos": [
    { "id": "C1", "nombre": "II A" }
  ],
  "ramos": [
    {
      "id": "R-LEN-C1", "nombre": "Lenguaje", "cursoId": "C1", "profesorId": "P1",
      "horasSemanales": 6
    },
    {
      "id": "R-ORI-C1", "nombre": "Orientacion", "cursoId": "C1", "profesorId": "P1",
      "horasSemanales": 1, "horariosFijos": [{ "dia": 4, "bloque": 1 }]
    },
    {
      "id": "R-EDF-C1", "nombre": "Educacion Fisica", "cursoId": "C1", "profesorId": "P1",
      "horasSemanales": 2, "salaId": "R1"
    }
  ]
}
```

- `salaId` solo va en ramos que compiten por un recurso compartido (ej. gimnasio).
- `horariosFijos` es opcional; si tiene menos entradas que `horasSemanales`,
  las sesiones restantes de ese ramo quedan libres para que el solver las ubique.
- `sesionesActuales` es opcional y representa la posición ACTUAL de cada sesión
  (en orden). Para `/verificar` debe estar completo (una entrada por cada hora
  semanal del ramo); para `/solve` se ignora (siempre genera desde cero); el
  frontend lo mantiene sincronizado automáticamente tras cada acción.

## Qué falta para producción (no incluido a propósito)

- El backend valida referencias (`cursoId`/`profesorId`/`salaId` inexistentes)
  pero no impide borrar un curso/profesor/sala que todavía tiene ramos
  referenciándolo — se detecta recién al construir el horario, con un `400`
  claro. Si se quiere, se puede agregar esa validación a los DELETE.
- Manejo de "profesor renuncia" desde la UI (el backend ya tiene el método,
  falta exponerlo como endpoint + botón).
- Paginación/búsqueda en las tablas CRUD (hoy listan todo, razonable para el
  tamaño de un colegio típico).
