# Mini App Fullstack – Angular 18 + NestJS 9

Este proyecto es una **mini aplicación fullstack** desarrollada como ejercicio técnico, que incluye  **login fake** ,  **CRUD de usuarios** , validaciones de negocio y comunicación **HTTP REST** entre frontend y backend.

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

### Autenticación (Fake)

* Login con usuario y contraseña hardcodeados
* Credenciales válidas:
  * **username:**`<span>admin</span>`
  * **password:**`<span>admin123</span>`
* Si es correcto:
  * Se devuelve un token fijo `<span>fake-token</span>`
  * Se guarda en `<span>localStorage</span>`
* Si falla:
  * Error 401 – Credenciales inválidas

> ⚠️ No se usa JWT ni autenticación real

---

### Protección de rutas

* Todas las rutas `<span>/users</span>` están protegidas
* Guard de frontend:
  * Si no hay token → redirige a `<span>/login</span>`
* Guard de backend:
  * Requiere header:

    Authorization: Bearer fake-token

---

## 👤 Módulo de Usuarios (CRUD)

### Entidad User

* `<span>id</span>` (autogenerado)
* `<span>name</span>` (obligatorio)
* `<span>email</span>` (obligatorio, formato email)
* `<span>phone</span>` (obligatorio y  **único** )

### Funcionalidades

* Listado de usuarios (tabla)
* Crear usuario
* Editar usuario
* Eliminar usuario (con confirmación)

### Reglas de negocio

* `<span>phone</span>` obligatorio
* `<span>phone</span>` único
  * Al crear → `<span>409 Conflict</span>` si existe
  * Al editar → `<span>409 Conflict</span>` si pertenece a otro usuario

### Manejo de errores

* `<span>400</span>` → Campos obligatorios faltantes
* `<span>401</span>` → No autorizado
* `<span>404</span>` → Usuario no encontrado
* `<span>409</span>` → Teléfono duplicado

En frontend, el error 409 se muestra como:

> **“Teléfono ya existe”**

---

## 🌐 Endpoints Backend

### Auth

* `<span>POST /auth/login</span>`

### Users (protegidos)

* `<span>GET /users</span>`
* `<span>GET /users/:id</span>`
* `<span>POST /users</span>`
* `<span>PUT /users/:id</span>`
* `<span>DELETE /users/:id</span>`

---

## ⚡ Interceptor HTTP (Frontend)

Se utiliza un **HttpInterceptor funcional** (Angular 18) que:

* Lee el token desde `<span>localStorage</span>`
* Inyecta automáticamente:

  Authorization: Bearer fake-token
* Evita repetir lógica en cada request

---

## 🚪 Logout

* Botón visible en el listado de usuarios
* Elimina el token del `<span>localStorage</span>`
* Redirige a `<span>/login</span>`
* El guard impide volver a rutas protegidas

---

## 🐳 Docker

El proyecto incluye **Docker Compose** para levantar todo fácilmente.

### Estructura

project-root/
│
├── backend/
│   └── Dockerfile
│
├── frontend/
│   ├── Dockerfile
│   └── nginx.conf
│
└── docker-compose.yml

### Levantar el proyecto

docker-compose up **--build** (esto creará los contenedores de front servido con Nginx, back y bbdd usando MongoBD)

### URLs en Docker

* Frontend → [http://localhost](http://localhost)
* Backend → [http://localhost:3000](http://localhost:3000)
* MongoDB → mongodb://localhost:27017

En entorno Docker, el frontend se comunica con el backend usando: http://backend:3000 (dentro de la red de Docker)

---

## 🧠 Decisiones técnicas

* MongoDB para persistencia real
* Angular 18 con standalone components
* Angular Material para UI profesional
* Interceptor funcional moderno
* Nginx para servir frontend en producción
* Docker para entorno reproducible
* Sin JWT por requerimiento del ejercicio

---

## 🧩Testing

#### Frontend

Cypress E2E con:

* Mock de login
* CRUD
* Validaciones
* Guards

Si el frontend corre en Docker (puerto 80), configurar: baseUrl: 'http://localhost'

##### Probar test

* npx cypress open

#### Backend

Se usan test unitarios con Jest´

##### Probar test

* npm run test

---

## 👤 Autor

Javier Sánchez Vargas
