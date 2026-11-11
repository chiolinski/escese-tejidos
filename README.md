# Escese Tejidos

Tienda de tejidos artesanales de Quirihue, Ñuble. El catálogo inicial usa las fotografías entregadas por la tienda. Los nombres son descriptivos y el precio y la disponibilidad quedan por confirmar hasta que la administradora los configure.

## Desarrollo local

Requiere Node.js 22, npm y PostgreSQL.

1. Ejecuta `npm ci`.
2. Copia `.env.example` a `.env` y completa `DATABASE_URL`, `APP_URL`, `ADMIN_EMAIL` y `ADMIN_PASSWORD`. Usa una contraseña de al menos 14 caracteres.
3. Ejecuta `npx prisma migrate deploy` y `npm run db:seed`.
4. Ejecuta `npm run dev`. Abre `http://localhost:3000` y entra al panel en `/admin`.

Sin `DATABASE_URL`, la tienda muestra el catálogo de referencia y las ventas quedan deshabilitadas. La carga inicial puede repetirse y conserva las ediciones existentes.

## Administración

Desde `/admin` puedes crear categorías, añadir fotografías JPEG, PNG o WebP, modificar fichas y publicar o despublicar productos. Agrega precio y unidades disponibles antes de vender. Para confección a pedido, activa la opción, registra un plazo y crea una variante. En el panel también se configuran las tarifas exactas por región y comuna, el retiro en Quirihue, el contacto y las políticas comerciales.

Los estados logísticos se editan desde los pedidos pagados. La confirmación del pago se registra desde el servidor cuando la respuesta de Transbank coincide con los datos del pedido. Si el pago queda pendiente tras un retorno ambiguo o abandonado, revisa su estado en Transbank antes de liberar el inventario. La conciliación programada de transacciones pendientes está pendiente de implementación.

## Webpay Plus

El valor inicial de `WEBPAY_ENV` es `integration`. Deja las credenciales vacías para utilizar las credenciales oficiales de integración del SDK, o configúralas en el entorno. Crea un producto en la base de integración, fija un precio y stock, configura retiro o despacho y recorre el checkout con las tarjetas oficiales. Comprueba en el panel el pedido, el total, el estado de pago y la reserva de stock. Prueba también el rechazo, la cancelación y la repetición del retorno. Usa un entorno de pruebas separado de la tienda real. [Documentación oficial de Webpay Plus](https://transbankdevelopers.com/documentacion/webpay-plus).

Para activar cobros reales, completa la validación con Transbank y configura  `WEBPAY_ENV=production`, `WEBPAY_LIVE_ENABLED=true`, `WEBPAY_COMMERCE_CODE` y `WEBPAY_API_KEY` en el entorno protegido. Conserva `.env` y los datos de clientes fuera de Git.

## Despliegue y dominio

Importa el repositorio en Vercel u otro alojamiento compatible con Next.js y Node.js. Provisiona PostgreSQL administrado, configura las variables de entorno privadas y ejecuta las migraciones antes de habilitar tráfico. Usa una base y credenciales independientes para cada entorno. Configura un dominio propio en el proveedor de alojamiento, aplica sus registros DNS y actualiza `APP_URL` con el origen HTTPS final. Inicializa la administradora y el catálogo con el script de carga desde una sesión con acceso controlado a la base.

Antes de abrir ventas, confirma nombres, precios, stock, materiales, plazos, contacto, políticas y tarifas. Añade el logotipo oficial cuando esté disponible.

## Verificación

`npm run lint`, `npm run typecheck`, `npm test` y `npm run build`.
