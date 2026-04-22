# ERP Ventas Backend

API en Node.js + Express, preparada para desplegar en Railway.

## Requisitos

- Node.js 20 o superior
- Base de datos MySQL (recomendado: servicio MySQL de Railway)

## Variables de entorno

Puedes configurar conexion con URL completa (recomendado) o por variables separadas.

### Opcion recomendada (URL)

- `DATABASE_URL` (o `MYSQL_URL`)
- `JWT_SECRET` (obligatoria en produccion)
- `JWT_EXPIRES_IN` (opcional, default `8h`)

### Variables para usuarios iniciales (opcional)

- `AUTH_SEED_DEFAULT_USERS` (default `true`)
- `SEED_MANAGER_NAME` (default `Gerente General`)
- `SEED_MANAGER_EMAIL` (default `gerente@erp.local`)
- `SEED_MANAGER_PASSWORD` (default `Gerente123!`)

Ejemplo:

```env
DATABASE_URL=mysql://user:password@host:3306/database
```

### Opcion alternativa (separadas)

- `DB_HOST`
- `DB_PORT`
- `DB_USER`
- `DB_PASSWORD`
- `DB_NAME`
- `DB_POOL_LIMIT` (opcional, default 10)

## Ejecutar en local

```bash
npm install
npm run dev
```

## Endpoints utiles

- `GET /` info general
- `GET /health` healthcheck

## Autenticacion y Roles

- `POST /api/auth/login` inicia sesion con `correo` y `password`
- `GET /api/auth/me` valida sesion activa (Bearer token)

Roles soportados:

- `gerente`: acceso completo
- `vendedor`: acceso a funciones comerciales permitidas
- `it`: acceso a configuracion y administracion de usuarios

Administracion de usuarios (solo rol `it`):

- `GET /api/users` listar usuarios
- `POST /api/users` crear usuario
- `PUT /api/users/:id` actualizar usuario
- `DELETE /api/users/:id` eliminar usuario

Las contrasenas se almacenan con hash `bcrypt` en tabla `usuarios`.

## Deploy en Railway

1. Sube este repo a GitHub.
2. En Railway, crea un nuevo proyecto desde GitHub y selecciona este repo.
3. Agrega un servicio **MySQL** en el mismo proyecto.
4. En el servicio backend, configura variables:
   - `DATABASE_URL` = `${{MySQL.MYSQL_URL}}`
   - (Opcional) `DB_POOL_LIMIT` = `10`
5. Railway detectara Node y ejecutara `npm start` automaticamente.
6. Cuando termine el deploy, prueba:
   - `https://TU-DOMINIO/health`

## Notas

- Este proyecto usa `mysql2`. Si luego quieres PostgreSQL, hay que migrar capa de acceso a datos y queries.
- `PORT` lo inyecta Railway automaticamente.
