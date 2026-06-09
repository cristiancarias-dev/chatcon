# Documento de Diseño — Prueba App

> **Propósito:** Este documento define las decisiones arquitectónicas y de diseño del proyecto.
> Debe consultarse antes de realizar cualquier cambio para mantener coherencia.

---

## Decisiones de Arquitectura (ADRs)

### ADR-001: Backend en capas

**Contexto:** Necesitamos separar responsabilidades para escalar el backend.
**Decisión:** Usar 3 capas: `api/` (HTTP) → `services/` (negocio) → `repositories/` (datos).
**Consecuencia:** Las rutas son delgadas, la lógica está en services, los queries en repositories.

### ADR-002: Frontend Screaming Architecture

**Contexto:** La estructura debe reflejar el dominio del negocio, no la tecnología.
**Decisión:** Organizar por dominios (`auth/`, `users/`, `roles/`, `dashboard/`) + `shared/`.
**Consecuencia:** Cada dominio contiene todo lo que necesita (componentes, hooks, API calls).

### ADR-003: Autenticación JWT en localStorage

**Contexto:** Necesitamos auth stateless para API REST.
**Decisión:** JWT con token almacenado en `localStorage`, enviado como `Authorization: Bearer`.
**Consecuencia:** Vulnerable a XSS (aceptado para este alcance). No hay refresh token.

### ADR-004: Seed sin migraciones

**Contexto:** Base de datos inicial necesita datos por defecto (admin, roles, permisos).
**Decisión:** `seed.py` ejecuta en startup si no existe admin. Sin Alembic por ahora.
**Consecuencia:** Cambios de schema requieren `docker compose down -v`.

### ADR-005: Tailwind CSS sin framework de componentes

**Contexto:** Necesitamos UI rápida y consistente sin agregar peso.
**Decisión:** Tailwind CSS utility-first. Sin Material UI, Chakra, etc.
**Consecuencia:** Más control visual, menos dependencias.

### ADR-006: JavaScript (no TypeScript)

**Contexto:** Proyecto pequeño, equipo reducido.
**Decisión:** JavaScript con Vite + JSX. Sin TypeScript.
**Consecuencia:** Menor complejidad inicial, sin type-checking en build.

### ADR-007: Sin estado global externo

**Contexto:** El estado de auth se necesita en varias páginas.
**Decisión:** `localStorage` para token + hooks (useAuth) para lógica. Sin Redux/Zustand.
**Consecuencia:** Estado manejado localmente, suficiente para este alcance.

---

## Estructura de archivos (vigente desde commit 3f87b2c)

```
prueba/
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── config.py
│   │   ├── database.py
│   │   ├── dependencies.py
│   │   ├── exceptions.py
│   │   ├── seed.py
│   │   ├── api/
│   │   ├── services/
│   │   ├── repositories/
│   │   ├── models/
│   │   ├── schemas/
│   │   └── auth/
│   └── tests/
│
├── frontend/
│   └── src/
│       ├── auth/
│       ├── users/
│       ├── roles/
│       ├── dashboard/
│       ├── shared/
│       └── not-found/
│
├── docs/
│   ├── ARCHITECTURE.md
│   └── DESIGN.md
│
└── .opencode/
    └── skill.md
```

---

## Reglas para cambios futuros

1. **Nuevo endpoint:** crear en `api/`, service en `services/`, repo en `repositories/`.
2. **Nuevo modelo:** crear en `models/`, schema en `schemas/`, migración manual.
3. **Nueva página frontend:** crear carpeta dominio en `src/`, componente + hook si aplica.
4. **Compartir código entre dominios:** poner en `shared/`, nunca importar entre dominios.
5. **Cambio de tecnología:** documentar en este archivo como ADR antes de implementar.
6. **Docker:** mantener `docker-compose.yml` sincronizado con cambios de infra.
