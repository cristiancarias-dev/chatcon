# Prueba App

Proyecto base con stack FastAPI + React + PostgreSQL.

> 📖 **Documentación de diseño:** antes de hacer cambios, consultar
> [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) (stack, capas, estructura)
> y [`docs/DESIGN.md`](docs/DESIGN.md) (decisiones arquitectónicas, ADRs).

## Stack

| Categoría     | Tecnología                     |
| ------------- | ------------------------------ |
| Frontend      | React + Vite + JavaScript      |
| Backend       | Python + FastAPI + SQLAlchemy  |
| Base de datos | PostgreSQL                     |
| Autenticación | JWT                            |
| Contenedores  | Docker Compose                 |

## Credenciales iniciales

| Campo    | Valor              |
| -------- | ------------------ |
| Email    | admin@prueba.com   |
| Password | admin123           |

## Inicio rápido

```bash
# Construir y levantar todos los servicios
docker compose up --build -d

# Ver logs
docker compose logs -f
```

## Acceso

| Servicio | URL                          |
| -------- | ---------------------------- |
| Frontend | http://localhost:3000        |
| API      | http://localhost:8000        |
| Docs     | http://localhost:8000/docs   |

## Tests

```bash
docker compose run --rm backend pytest -v
```

## Comandos útiles

```bash
# Detener y eliminar volúmenes
docker compose down -v

# Solo backend
docker compose up --build -d db backend

# Solo frontend
docker compose up --build -d frontend
```
