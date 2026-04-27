# RentVago

Aplicacion web para gestionar propiedades residenciales, autenticacion, filtros de busqueda y favoritos.

## Requisitos

- Bun
- PostgreSQL
- Variables de entorno configuradas en `.env`

## Desarrollo

Instala dependencias:

```bash
bun install
```

Ejecuta la app:

```bash
bun run dev
```

## Scripts

- `bun run dev`: desarrollo
- `bun run build`: build de produccion
- `bun run start`: servidor de produccion
- `bun run lint`: validacion de lint

## Prisma

- Ejecutar migraciones:

```bash
bunx prisma migrate dev
```

- Cargar datos seed:

```bash
bunx prisma db seed
```

- Regenerar cliente:

```bash
bunx prisma generate
```
