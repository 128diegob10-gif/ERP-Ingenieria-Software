# ERP Ventas Backend

API en Node.js + Express, preparada para desplegar en Railway.

## Requisitos

- Node.js 20 o superior
- Base de datos MySQL (recomendado: servicio MySQL de Railway)

## Variables de entorno

Puedes configurar conexion con URL completa (recomendado) o por variables separadas.

### Opcion recomendada (URL)

- `DATABASE_URL` (o `MYSQL_URL`)

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
