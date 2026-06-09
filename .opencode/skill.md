# Proyecto Prueba App — Skill para opencode

Este skill se activa automáticamente al trabajar en `/mnt/c/Users/cacde/projects/Cristian-09/AI-DEV/prueba`.

## Documentos de referencia

Antes de cualquier cambio, consultar:

| Documento | Propósito |
|-----------|-----------|
| `docs/ARCHITECTURE.md` | Stack, estructura, reglas de capas, convenciones |
| `docs/DESIGN.md` | Decisiones de arquitectura (ADRs), reglas para cambios futuros |

## Reglas rápidas

### Backend

- **api/** → solo HTTP (request/response), NO lógica
- **services/** → lógica de negocio, NO HTTP exceptions
- **repositories/** → queries SQLAlchemy, NO lógica de negocio
- Excepciones: usar `exceptions.py` (NotFoundException, ConflictException, etc.)
- Dependencias: inyectar repositorios via `dependencies.py`
- Nunca importar `api/` desde `services/`

### Frontend

- Cada dominio en su carpeta (`auth/`, `users/`, `roles/`, etc.)
- NO importar entre dominios — solo desde `shared/`
- `shared/http.js` es el único que llama a `fetch()`
- Tailwind CSS para estilos, sin librerías de componentes
- JavaScript plano (no TypeScript)
- Sin Redux/Zustand — localStorage + hooks

### Cambios

- Nuevo endpoint → api + service + repository
- Nueva página → carpeta dominio + componente + hook
- Cambio de tecnología → documentar como ADR en `docs/DESIGN.md` antes de implementar
- No romper tests existentes (24 tests, todos deben pasar)
