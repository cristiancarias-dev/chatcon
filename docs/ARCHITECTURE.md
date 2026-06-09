# Arquitectura del Proyecto

## Stack Tecnológico

| Capa         | Tecnología                      |
|-------------|---------------------------------|
| Backend     | Python 3.12 + FastAPI + SQLAlchemy 2.0 |
| Frontend    | React 18 + Vite + Tailwind CSS 3 |
| Base de datos | PostgreSQL 16                   |
| Autenticación | JWT (python-jose) + bcrypt      |
| Contenedores | Docker + Docker Compose         |
| Linter      | Ruff (backend)                  |

---

## Backend — Arquitectura en Capas

```
app/
├── main.py              # Setup FastAPI, middleware, lifespan
├── config.py            # Pydantic Settings (variables de entorno)
├── database.py          # Engine, SessionLocal, Base, get_db
├── dependencies.py      # Fábricas de repositorios para inyección
├── exceptions.py        # Excepciones custom (NotFoundException, etc.)
├── seed.py              # Seed de datos iniciales
│
├── api/                 # 🟢 CAPA HTTP — solo recibe request y devuelve response
│   ├── auth.py          #   POST /register, POST /login
│   ├── users.py         #   CRUD /users + /users/me + roles assignment
│   ├── roles.py         #   CRUD /roles + permissions assignment
│   └── permissions.py   #   GET /permissions
│
├── services/            # 🟡 CAPA DE NEGOCIO — toda la lógica de negocio
│   ├── auth_service.py  #   register(), login()
│   ├── user_service.py  #   CRUD + update_roles()
│   └── role_service.py  #   CRUD + update_permissions()
│
├── repositories/        # 🔵 CAPA DE DATOS — solo consultas SQLAlchemy
│   ├── user_repository.py
│   └── role_repository.py
│
├── models/              # 📦 Modelos SQLAlchemy
│   ├── user.py
│   └── role.py
│
└── schemas/             # 📦 DTOs Pydantic
    ├── auth.py
    ├── user.py
    └── role.py
```

### Reglas estrictas de capas

```
api/ → services/ → repositories/ → models/
```

1. **`api/`** solo recibe el request, valida params, llama al service y devuelve response. No hace lógica de negocio ni consultas.
2. **`services/`** contiene TODA la lógica de negocio. Nunca importa de `api/`. Lanza excepciones custom (`NotFoundException`, `ConflictException`, etc.).
3. **`repositories/`** solo ejecuta queries SQLAlchemy. Nunca lanza HTTPException. Devuelve `None` si no encuentra.
4. **`models/`** define tablas y relaciones. Sin lógica.
5. **`schemas/`** define Pydantic models. Sin lógica.
6. Las dependencias se inyectan via `dependencies.py` (fábricas de repositorios).

### Excepciones

Todas en `exceptions.py`:
- `AppException` → base
- `NotFoundException` → 404
- `ConflictException` → 409
- `UnauthorizedException` → 401
- `ForbiddenException` → 403

### Autenticación

- `auth/__init__.py`: `hash_password()`, `verify_password()`, `create_access_token()`, `verify_token()`
- `dependencies`: `get_current_user()` (valida JWT), `require_permission(codename)` (RBAC)
- Superuser bypass: si `user.is_superuser` es True, pasa cualquier permiso

### Seed

- `seed.py::seed_database(db, admin_email)` crea roles (admin, user), permisos (8) y usuario admin
- Se ejecuta en el lifespan de la app, solo si no existe el admin

---

## Frontend — Screaming Architecture

```
src/
├── main.jsx
├── App.jsx
├── index.css
│
├── auth/              # 🔐 Autenticación
│   ├── Login.jsx
│   ├── Register.jsx
│   └── useAuth.js
│
├── users/             # 👥 Gestión de usuarios
│   ├── UserList.jsx
│   ├── UserCreate.jsx
│   ├── UserEdit.jsx
│   └── useUsers.js
│
├── roles/             # 🛡️ Gestión de roles
│   ├── RoleList.jsx
│   ├── RoleCreate.jsx
│   ├── RoleEdit.jsx
│   └── useRoles.js
│
├── dashboard/         # 📊 Dashboard
│   └── Dashboard.jsx
│
├── shared/            # ♻️ Compartido entre dominios
│   ├── http.js
│   ├── Loading.jsx
│   ├── ErrorAlert.jsx
│   └── ProtectedRoute.jsx
│
└── not-found/         # 404
    └── NotFound.jsx
```

### Reglas estrictas

1. **Cada dominio** contiene sus componentes, hooks y cualquier archivo específico de ese dominio.
2. **Nunca importar** de otro dominio directamente. Si algo se necesita en dos dominios, va a `shared/`.
3. **`shared/http.js`** es el único módulo que sabe de `fetch()` y del token JWT.
4. **Los hooks** (`useUsers`, `useRoles`) contienen las funciones de API para ese dominio.
5. **No hay carpetas técnicas** sueltas como `api/`, `components/`, `hooks/`, `utils/`. Solo carpetas de dominio + `shared/`.
6. **`App.jsx`** solo define rutas, no lógica.

### Convenciones de código

- **Tailwind CSS** para estilos (no CSS modules, no styled-components)
- **Componentes funcionales** con hooks
- **PropTypes**: no se usan (JavaScript plano)
- **Estado global**: localStorage + props. Sin Redux/Zustand.
- **Errores**: se manejan con `ErrorAlert` (shared) en cada página

---

## Infraestructura

### Docker Compose

| Servicio  | Puerto | Depende de |
|-----------|--------|------------|
| `db`      | 5432   | —          |
| `backend` | 8000   | db (healthy) |
| `frontend`| 3000   | backend    |

- Backend tiene volumen `./backend:/app` para hot-reload
- Frontend build multi-stage (node → nginx), sin volumen

### Proxy

- **Vite (dev)**: `/api` → proxy → `http://localhost:8000` (rewrite: elimina `/api`)
- **Nginx (prod)**: `/api/` → proxy_pass → `http://backend:8000/` (elimina `/api/`)

Ambos se comportan igual: `/api/auth/login` → `http://backend:8000/auth/login`.

### Base de datos

- PostgreSQL 16 con volumen persistente `pgdata`
- Schema se crea con `Base.metadata.create_all()` en startup
- **No hay migraciones** — actualmente se maneja con `docker compose down -v` para reiniciar
- Pendiente: integrar Alembic para versionado de schema

---

## API

| Método | Ruta | Auth | Permiso |
|--------|------|------|---------|
| POST | /auth/register | No | — |
| POST | /auth/login | No | — |
| GET | /users/me | JWT | — |
| PUT | /users/me | JWT | — |
| GET | /users/ | JWT | read_user |
| GET | /users/{id} | JWT | read_user |
| PUT | /users/{id} | JWT | update_user |
| DELETE | /users/{id} | JWT | delete_user |
| PUT | /users/{id}/roles | JWT | update_user |
| GET | /roles/ | JWT | read_role |
| POST | /roles/ | JWT | create_role |
| GET | /roles/{id} | JWT | read_role |
| PUT | /roles/{id} | JWT | update_role |
| DELETE | /roles/{id} | JWT | delete_role |
| GET | /roles/{id}/permissions | JWT | read_role |
| PUT | /roles/{id}/permissions | JWT | update_role |
| GET | /permissions/ | JWT | read_role |
| GET | /health | No | — |

---

## Base de datos

### Tablas

**users**
| Columna | Tipo | Notas |
|---------|------|-------|
| id | Integer PK | auto |
| email | String(255) | unique, indexed |
| hashed_password | String(255) | bcrypt hash |
| name | String(255) | — |
| is_active | Boolean | default true |
| is_superuser | Boolean | default false |
| created_at | DateTime(tz) | server_default now() |

**roles**
| Columna | Tipo | Notas |
|---------|------|-------|
| id | Integer PK | auto |
| name | String(50) | unique |
| description | Text | default "" |

**permissions**
| Columna | Tipo | Notas |
|---------|------|-------|
| id | Integer PK | auto |
| codename | String(100) | unique |
| description | Text | default "" |

**user_roles** (M2M)
| Columna | FK |
|---------|-----|
| user_id | → users.id (CASCADE) |
| role_id | → roles.id (CASCADE) |

**role_permissions** (M2M)
| Columna | FK |
|---------|-----|
| role_id | → roles.id (CASCADE) |
| permission_id | → permissions.id (CASCADE) |

---

## Convenciones de código

### Backend

- Python 3.12+
- Ruff linting (config en `pyproject.toml`)
- Línea máxima: 88 caracteres
- Quotes dobles (`"`)
- Type hints obligatorios en functions públicas
- Nombres de archivos en snake_case

### Frontend

- JavaScript (no TypeScript)
- Nombres de archivos en PascalCase para componentes (`Login.jsx`)
- Nombres de carpetas en kebab-case o una palabra
- Tailwind utility classes para estilos
- Props desestructuradas en la firma del componente
