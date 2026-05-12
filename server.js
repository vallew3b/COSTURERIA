const express = require('express');
const path = require('path');
const db = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// CORS middleware para permitir acceso desde GitHub Pages
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
    next();
});

// API: Obtener productos con stock > 0
app.get('/api/products', async (req, res) => {
    try {
        const sql = `
            SELECT p.id_producto, p.nombre_producto, p.precio_venta, p.descripcion, p.categoria, p.imagen, i.stock_actual
            FROM Productos p
            JOIN Inventarios_Productos i ON p.id_producto = i.id_producto
            WHERE i.stock_actual > 0 AND p.imagen IS NOT NULL AND p.imagen != ''
        `;
        const products = await db.query(sql);
        res.json(products);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al obtener productos' });
    }
});

// API: Realizar compra
app.post('/api/purchase', async (req, res) => {
    const { id_producto, cantidad, nombre_cliente, email } = req.body;
    
    if (!id_producto || !cantidad || cantidad <= 0) {
        return res.status(400).json({ error: 'Datos de compra inválidos' });
    }

    try {
        // Verificar stock
        const stockResult = await db.query('SELECT stock_actual FROM Inventarios_Productos WHERE id_producto = ?', [id_producto]);
        if (stockResult.length === 0 || stockResult[0].stock_actual < cantidad) {
            return res.status(400).json({ error: 'Stock insuficiente' });
        }

        // Crear Pedido
        const precioResult = await db.query('SELECT precio_venta FROM Productos WHERE id_producto = ?', [id_producto]);
        const monto_total = precioResult[0].precio_venta * cantidad;

        const insertPedido = `
            INSERT INTO Pedidos (id_producto, cantidad, monto_total, es_web, procesado_web, nombre_cliente_web, email_cliente, estado)
            VALUES (?, ?, ?, 1, 0, ?, ?, 'Pendiente')
        `;
        const result = await db.query(insertPedido, [id_producto, cantidad, monto_total, nombre_cliente, email]);

        // Actualizar stock
        await db.query('UPDATE Inventarios_Productos SET stock_actual = stock_actual - ? WHERE id_producto = ?', [cantidad, id_producto]);

        // Registrar movimiento
        await db.query(`
            INSERT INTO Movimientos_Productos (id_producto, tipo, cantidad, motivo, id_pedido)
            VALUES (?, 'SALIDA', ?, 'Venta Web', ?)
        `, [id_producto, -cantidad, result.insertId]);

        res.json({ success: true, id_pedido: result.insertId });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al procesar la compra' });
    }
});

// API: Obtener ventas web
app.get('/api/web-sales', async (req, res) => {
    try {
        const sql = `
            SELECT ped.*, prod.nombre_producto
            FROM Pedidos ped
            JOIN Productos prod ON ped.id_producto = prod.id_producto
            WHERE ped.es_web = 1
            ORDER BY ped.fecha_pedido DESC
        `;
        const sales = await db.query(sql);
        res.json(sales);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al obtener ventas web' });
    }
});

// API: Procesar venta web
app.patch('/api/web-sales/:id', async (req, res) => {
    const { id } = req.params;
    const { procesado } = req.body;

    try {
        await db.query('UPDATE Pedidos SET procesado_web = ? WHERE id_pedido = ?', [procesado ? 1 : 0, id]);
        res.json({ success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al actualizar estado' });
    }
});

app.listen(PORT, () => {
    console.log(`Servidor web corriendo en http://localhost:${PORT}`);
});
