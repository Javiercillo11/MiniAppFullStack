# Mini App Fullstack – Angular 18 + NestJS 9

Este proyecto es una **mini aplicación fullstack** desarrollada como ejercicio técnico, que incluye  **autenticación JWT con roles** ,  **CRUD de usuarios** , validaciones de negocio y comunicación **HTTP REST** entre frontend y backend.

El objetivo principal es demostrar buenas prácticas, estructura clara y cumplimiento estricto del enunciado, sin sobreingeniería.

---

## 🧩 Stack Tecnológico

### 🎨 Frontend

* **Angular 18** (Standalone Components)
* **Angular Material** (UI moderna y accesible)
* Angular Router
* HttpClient + Interceptor funcional
* Guards de protección de rutas
* Servido en producción con **Nginx**
* Dockerizado

### 🧠 Backend

* **NestJS 9**
* Arquitectura modular
* DTOs con validación (`class-validator`)
* Guards personalizados
* Conexión real a MongoDB con Mongoose
* Dockerizado

### 🗄 BBDD

* **MongoDB 6**
* Persistencia real
* Validación de unicidad del campo `phone`

### 🐳 Infraestructura

* **Docker**
* **Docker Compose**
* Nginx para servir Angular en producción

---

## 🔐 Funcionalidades

### Autenticación (JWT en cookies httpOnly)

* Login con **email y contraseña** contra los usuarios de MongoDB
* Contraseñas almacenadas con hash **bcrypt** (nunca se devuelven en la API)
* La sesión usa dos JWT en **cookies `httpOnly` + `SameSite=Strict`** (el JavaScript del navegador no puede leerlos):
  * `access_token`: 15 minutos
  * `refresh_token`: 7 días; el frontend renueva la sesión automáticamente al caducar el de acceso
* **Logout real**: invalida en el servidor todos los tokens del usuario (versión de token en BBDD)
* **Límite de intentos**: 5 logins por minuto e IP (`429 Too Many Requests`); límite general de 120 peticiones/minuto
* Cabeceras de seguridad con **helmet** (API) y Nginx (frontend)
* Respuestas de error:
  * `401` – Credenciales inválidas
  * `403` – Usuario desactivado
  * `429` – Demasiados intentos
* Al arrancar, si no existe ningún administrador se crea uno inicial (`admin@miniapp.local` / `admin123`).
  **En el primer acceso se obliga a cambiar la contraseña.**
* También se obliga a cambiarla cuando la contraseña la fija otra persona (alta de usuario o restablecimiento por un administrador); en ese caso además se cierran sus sesiones abiertas.

Variables de entorno (ver `.env.example`; copiar a `.env` y cambiarlas en producción):

| Variable | Descripción | Por defecto |
| --- | --- | --- |
| `MONGO_USER` / `MONGO_PASSWORD` | Credenciales de MongoDB | `miniapp` / `miniapp-dev-password` ⚠️ |
| `JWT_SECRET` | Secreto del token de acceso | `dev-secret-change-me` ⚠️ |
| `JWT_REFRESH_SECRET` | Secreto del token de refresco | `dev-refresh-secret-change-me` ⚠️ |
| `COOKIE_SECURE` | `true` si se sirve por HTTPS | `false` |
| `CORS_ORIGIN` | Orígenes permitidos (separados por comas) | `http://localhost:4200` |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | Administrador inicial | `admin@miniapp.local` / `admin123` |
| `LOGIN_RATE_LIMIT` | Intentos de login por minuto e IP | `5` |

---

### Roles y permisos

| Acción | Administrador | Editor | Lector |
| --- | :-: | :-: | :-: |
| Ver usuarios | ✅ | ✅ | ✅ |
| Crear / editar usuarios | ✅ | ✅ (no administradores) | ❌ |
| Asignar rol de administrador | ✅ | ❌ | ❌ |
| Activar / desactivar | ✅ | ❌ | ❌ |
| Eliminar | ✅ | ❌ | ❌ |

Reglas adicionales:

* Nadie puede cambiar su propio rol o estado ni eliminarse a sí mismo
* Siempre debe quedar al menos un administrador activo
* Los permisos se validan en el backend (guards `JwtAuthGuard` + `RolesGuard`); el frontend solo oculta lo que no se puede hacer

### Estado activo / inactivo

* Un usuario **inactivo** no puede iniciar sesión
* La desactivación tiene efecto inmediato: el guard consulta la BBDD en cada petición, así que una sesión abierta se invalida en la siguiente llamada y el frontend redirige al login

---

### Protección de rutas

* Todas las rutas `/users` están protegidas
* Guards de frontend:
  * Sin sesión → redirige a `/login`
  * Cambio de contraseña pendiente → redirige a `/change-password`
  * `/users/create` y `/users/edit/:id` solo para Administrador y Editor
* Guard de backend (`JwtAuthGuard`):
  * Lee el JWT de la cookie `access_token` (o de `Authorization: Bearer <jwt>` para clientes de API)
  * Comprueba en BBDD que el usuario sigue activo y que el token no se ha invalidado

---

## 👤 Módulo de Usuarios (CRUD)

### Entidad User

* `_id` (autogenerado)
* `name` (obligatorio)
* `email` (obligatorio, formato email y **único**)
* `phone` (obligatorio y **único**)
* `password` (mínimo 8 caracteres, hash bcrypt)
* `role` (`admin` | `editor` | `viewer`, por defecto `viewer`)
* `status` (`active` | `inactive`, por defecto `active`)
* `lastLoginAt`, `createdAt`, `updatedAt`

### Funcionalidades

* Listado de usuarios con búsqueda y filtro por estado
* Crear y editar usuario (con rol, estado y contraseña)
* Activar / desactivar usuario (con opción de deshacer)
* Eliminar usuario (con confirmación)

### Manejo de errores

* `400` → Campos obligatorios faltantes o se quedaría sin administradores activos
* `401` → No autenticado o token inválido
* `403` → Sin permisos para la acción o usuario desactivado
* `404` → Usuario no encontrado
* `409` → Email o teléfono duplicado

---

## 🌐 Endpoints Backend

### Auth

* `POST /auth/login`
* `POST /auth/refresh`
* `POST /auth/logout`
* `POST /auth/change-password`
* `GET /auth/me`

### Users (protegidos)

* `GET /users`
* `GET /users/:id`
* `POST /users` (admin, editor)
* `PUT /users/:id` (admin, editor)
* `PATCH /users/:id/status` (admin)
* `DELETE /users/:id` (admin)

---

## ⚡ Interceptor HTTP (Frontend)

Se utiliza un **HttpInterceptor funcional** (Angular 18) que:

* Envía las cookies de sesión en cada petición
* Ante un `401` renueva la sesión con `/auth/refresh` y repite la petición; si no puede, redirige al login
* Ante un `403` por cambio de contraseña pendiente redirige a `/change-password`
* Muestra un aviso si no hay conexión con el servidor

---

## 🚪 Logout

* Botón en la barra lateral
* Invalida los tokens en el servidor y borra las cookies
* Redirige a `/login`

---

## 🎨 Interfaz

* Tema claro, oscuro o del sistema (selector en la barra lateral; se recuerda la elección)
* Diseño adaptado a móvil
* Página 404 para rutas inexistentes

---

## 🐳 Docker

El proyecto incluye **Docker Compose** para levantar todo fácilmente.

### Estructura

project-root/
│
├── .github/workflows/ci.yml
├── backend/
│   └── Dockerfile          (Node 22, multi-stage, usuario sin privilegios)
├── frontend/
│   ├── Dockerfile
│   └── nginx.conf
├── docker-compose.yml       (producción / uso normal)
├── docker-compose.dev.yml   (expone MongoDB y backend en 127.0.0.1)
└── .env.example

### Levantar el proyecto

```bash
cp .env.example .env   # opcional en local; obligatorio en producción
docker compose up -d --build
```

### URLs en Docker

* Frontend → [http://localhost](http://localhost)
* API → [http://localhost/api](http://localhost/api) (a través de Nginx)

MongoDB y el backend **no publican puertos**: solo son accesibles desde la red interna de Docker.
Para desarrollo local (backend con `npm run start:dev` o tests e2e):

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d
# MongoDB → mongodb://miniapp:miniapp-dev-password@localhost:27017/?authSource=admin
# Backend → http://localhost:3000 (cambiar con BACKEND_PORT)
```

---

## 🧠 Decisiones técnicas

* MongoDB para persistencia real
* Angular 18 con standalone components
* Angular Material para UI profesional
* Interceptor funcional moderno
* Nginx para servir frontend en producción
* Docker para entorno reproducible
* JWT en cookies httpOnly con refresh token y revocación por versión
* Rate limiting con `@nestjs/throttler`

---

## 🧩 Testing

### Integración continua

GitHub Actions (`.github/workflows/ci.yml`) ejecuta en cada push a `main` y en cada PR:

* Backend: lint, tests unitarios, build y tests e2e contra MongoDB
* Frontend: build y tests unitarios (Karma + Chrome headless)
* Cypress contra el servidor de desarrollo
* Build de las imágenes Docker

### Frontend

```bash
cd frontend
npm run test:ci   # tests unitarios (Karma, Chrome headless)
npm start         # en otra terminal, para Cypress
npm run cy:run    # Cypress (API mockeada)
```

### Backend

```bash
cd backend
npm test          # tests unitarios
# e2e: requiere MongoDB (docker-compose.dev.yml) y una BBDD de pruebas, que se vacía
MONGO_URI="mongodb://miniapp:miniapp-dev-password@localhost:27017/miniapp-test?authSource=admin" \
  npm run test:e2e -- --runInBand
```

---

## 👤 Autor

Javier Sánchez Vargas
