# Tareas de correccion

## Prioridad alta

### 1. Implementar cierre de sesion real
- Problema: el boton "Cerrar sesion" solo navega a /login y no elimina las cookies de autenticacion.
- Archivos involucrados:
  - src/app/(dashboard)/layout.tsx
  - src/app/api/auth/
- Trabajo:
  - Crear un endpoint o server action de logout que elimine access_token y refresh_token.
  - Reemplazar el formulario GET actual por una accion real de cierre de sesion.
  - Verificar que despues del logout no se pueda volver a entrar a /search o /favorites sin autenticarse otra vez.
- Criterio de aceptacion:
  - Al cerrar sesion, cualquier ruta protegida debe redirigir a /login.
  - Las cookies de autenticacion deben desaparecer en el navegador.

### 2. Conectar el flujo de refresh token
- Problema: existe /api/auth/refresh pero no hay renovacion automatica cuando expira el access token.
- Archivos involucrados:
  - src/proxy.ts
  - src/app/api/auth/refresh/route.ts
  - src/lib/api-auth.ts
  - componentes cliente que consumen rutas protegidas
- Trabajo:
  - Definir una estrategia de renovacion: desde middleware/proxy no se puede resolver todo de forma segura si requiere logica compleja, asi que conviene centralizar un flujo de refresh desde servidor o desde un wrapper de fetch.
  - Reintentar una sola vez las solicitudes autenticadas cuando falle el access token por expiracion y exista refresh_token valido.
  - Si el refresh falla, limpiar sesion y redirigir a /login.
- Criterio de aceptacion:
  - Un usuario con refresh_token valido no debe ser expulsado inmediatamente cuando expira el access token.
  - Si ambos tokens son invalidos, la app debe cerrar sesion de forma consistente.

### 3. Corregir la redireccion post-login y post-register
- Problema: el proxy envia el parametro next, pero login y register siempre redirigen a /search.
- Archivos involucrados:
  - src/proxy.ts
  - src/app/(auth)/login/page.tsx
  - src/app/(auth)/register/page.tsx
- Trabajo:
  - Leer el parametro next en login y register.
  - Validar que next sea una ruta interna segura.
  - Redirigir a next cuando exista; si no, usar /search como fallback.
- Criterio de aceptacion:
  - Si el usuario entra a /login?next=/favorites y se autentica, debe terminar en /favorites.
  - No se deben permitir redirecciones abiertas a dominios externos.

## Prioridad media

### 4. Separar crear filtro guardado de actualizar ultimo filtro
- Problema: POST /api/search-filters no crea nuevos filtros; sobreescribe el ultimo mediante saveLatestForUser.
- Archivos involucrados:
  - src/app/api/search-filters/route.ts
  - src/services/search-filter.service.ts
  - README.md
- Trabajo:
  - Cambiar POST para que use createForUser cuando la intencion sea guardar un nuevo filtro.
  - Mantener updateByIdForUser para edicion explicita por id.
  - Revisar si saveLatestForUser sigue teniendo sentido; si no, eliminarlo para evitar ambiguedad.
  - Ajustar el frontend si hoy asume que solo existe un filtro vigente.
- Criterio de aceptacion:
  - Dos guardados consecutivos deben producir dos filtros distintos.
  - GET /api/search-filters debe listar multiples filtros del mismo usuario.
  - La documentacion debe coincidir con el comportamiento real.

### 5. Agregar pruebas de integracion para auth y filtros guardados
- Problema: la suite actual cubre piezas chicas, pero no los flujos donde aparecieron los bugs reales.
- Archivos involucrados:
  - src/lib/api-auth.test.ts
  - nuevas pruebas para auth, search-filters y navegacion protegida
- Trabajo:
  - Cubrir logout real.
  - Cubrir refresh exitoso y refresh invalido.
  - Cubrir redireccion con next.
  - Cubrir creacion multiple de filtros guardados sin sobreescritura accidental.
- Criterio de aceptacion:
  - Los bugs encontrados en la revision deben quedar representados por pruebas automatizadas.

## Prioridad baja

### 6. Limpiar warning de Tailwind en login
- Problema: hay una advertencia por usar bg-gradient-to-b.
- Archivo involucrado:
  - src/app/(auth)/login/page.tsx
- Trabajo:
  - Reemplazar la clase por la forma recomendada por la version actual de Tailwind.
- Criterio de aceptacion:
  - El warning debe desaparecer del editor y de la revision estatica.

## Orden sugerido de ejecucion
1. Logout real.
2. Refresh token automatico.
3. Redireccion con next.
4. Filtros guardados multiples.
5. Pruebas de integracion.
6. Limpieza de warning menor.