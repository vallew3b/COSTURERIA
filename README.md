# Tuleto Web Store Integration

Este es el módulo de tienda web para el ERP Tuleto. Permite la sincronización de inventario en tiempo real y la gestión de pedidos web.

## Características
- Sincronización automática de stock con la base de datos central.
- Interfaz de ventas para clientes.
- Panel de administración para procesar pedidos web.
- Conexión segura mediante túnel SSH.

## Instalación

1. Clona el repositorio.
2. Instala las dependencias:
   ```bash
   npm install
   ```
3. Configura el archivo `.env` con tus credenciales (SSH y MySQL).
4. Inicia el servidor:
   ```bash
   npm start
   ```

## Seguridad
El archivo `.env` está excluido de Git para proteger tus credenciales. Asegúrate de configurar uno en cada entorno donde despliegues.
