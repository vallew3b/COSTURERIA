// Imágenes premium de respaldo (Galería Tuleto)
const fallbackImages = [
    'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&q=80&w=800',
    'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&q=80&w=800',
    'https://images.unsplash.com/photo-1539109132314-347f85417bd4?auto=format&fit=crop&q=80&w=800',
    'https://images.unsplash.com/photo-1485230895905-ec40ba36b9bc?auto=format&fit=crop&q=80&w=800',
    'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&q=80&w=800',
    'https://images.unsplash.com/photo-1554412933-514a83d2f3c8?auto=format&fit=crop&q=80&w=800',
    'https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&q=80&w=800',
    'https://images.unsplash.com/photo-1475180098004-caaa744179a5?auto=format&fit=crop&q=80&w=800',
    'https://images.unsplash.com/photo-1537832816519-689ad163238b?auto=format&fit=crop&q=80&w=800'
];

// Datos de simulación en caso de que el servidor no esté disponible (ej. GitHub Pages)
const mockProducts = [
    { id_producto: 1, nombre_producto: "Vestido Gala 'Nocturno'", precio_venta: 1250, descripcion: "Elegancia pura para tus eventos más exclusivos.", categoria: "Gala", stock_actual: 5 },
    { id_producto: 2, nombre_producto: "Blazer Ejecutivo 'Siena'", precio_venta: 890, descripcion: "Corte perfecto y materiales de primera calidad.", categoria: "Oficina", stock_actual: 8 },
    { id_producto: 3, nombre_producto: "Pantalón Casual 'Lino'", precio_venta: 450, descripcion: "Comodidad y frescura sin perder el estilo.", categoria: "Casual", stock_actual: 12 }
];

function getProductImage(product) {
    const index = product.id_producto % fallbackImages.length;
    return fallbackImages[index];
}

// Funciones para la Tienda
async function loadProducts() {
    const list = document.getElementById('product-list');
    if (!list) return;

    try {
        const res = await fetch('/api/products');
        if (!res.ok) throw new Error('Servidor no disponible');
        
        const products = await res.json();
        renderProducts(products);
        document.getElementById('connection-status').innerHTML = '<span class="status-dot" style="background: var(--success)"></span> Conectado a Tuleto DB';
    } catch (error) {
        console.warn('Usando datos de simulación (Modo Demo)');
        renderProducts(mockProducts);
        document.getElementById('connection-status').innerHTML = '<span class="status-dot" style="background: var(--warning)"></span> Modo Simulación (Sin Servidor)';
    }
}

function renderProducts(products) {
    const list = document.getElementById('product-list');
    if (products.length === 0) {
        list.innerHTML = `<div style="grid-column: 1/-1; text-align: center; padding: 4rem;"><p>No hay existencias disponibles.</p></div>`;
        return;
    }

    list.innerHTML = products.map(p => {
        const imageUrl = getProductImage(p);
        return `
        <div class="product-card">
            <img src="${imageUrl}" alt="${p.nombre_producto}" class="product-image">
            <div class="product-info">
                <span class="product-category">${p.categoria || 'Colección Exclusiva'}</span>
                <h3 class="product-name">${p.nombre_producto}</h3>
                <p class="product-description">${p.descripcion || 'Confección artesanal de alta gama.'}</p>
                <div class="product-meta">
                    <div class="price-tag">
                        <span class="price-label">Precio</span>
                        <span class="price-value">$${parseFloat(p.precio_venta).toLocaleString()}</span>
                    </div>
                    <div class="stock-tag">${p.stock_actual} en stock</div>
                </div>
                <button class="btn-buy" onclick="openModal(${JSON.stringify(p).replace(/"/g, '&quot;')})">
                    Comprar Ahora
                </button>
            </div>
        </div>
    `}).join('');
}

function openModal(product) {
    const modal = document.getElementById('purchase-modal');
    document.getElementById('modal-product-name').innerText = product.nombre_producto;
    document.getElementById('modal-product-price').innerText = `$${parseFloat(product.precio_venta).toLocaleString()}`;
    document.getElementById('form-product-id').value = product.id_producto;
    document.getElementById('form-quantity').max = product.stock_actual;
    document.getElementById('form-quantity').value = 1;
    
    // Resetear modal
    document.getElementById('purchase-form').style.display = 'block';
    document.getElementById('success-screen').style.display = 'none';
    showStep(1);
    
    modal.style.display = 'flex';
}

function closeModal() {
    document.getElementById('purchase-modal').style.display = 'none';
}

window.onclick = function(event) {
    const modal = document.getElementById('purchase-modal');
    if (event.target == modal) closeModal();
}

const purchaseForm = document.getElementById('purchase-form');
if (purchaseForm) {
    purchaseForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const btnSubmit = e.target.querySelector('button[type="submit"]');
        btnSubmit.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Procesando Pago...';
        btnSubmit.disabled = true;

        const data = {
            id_producto: document.getElementById('form-product-id').value,
            cantidad: document.getElementById('form-quantity').value,
            nombre_cliente: document.getElementById('form-name').value,
            email: document.getElementById('form-email').value
        };

        try {
            // Simulamos una demora de red para el pago
            await new Promise(resolve => setTimeout(resolve, 2000));

            const res = await fetch('/api/purchase', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });

            if (res.ok) {
                showSuccess();
                loadProducts(); 
            } else {
                // Si falla el servidor (ej. en GitHub Pages), igual mostramos éxito en modo demo
                console.warn('Servidor no respondió, pero simulamos éxito en Demo.');
                showSuccess();
            }
        } catch (error) {
            console.error('Error de red, mostrando éxito simulado.');
            showSuccess();
        } finally {
            btnSubmit.innerHTML = '<i class="fas fa-check-circle"></i> Confirmar y Pagar';
            btnSubmit.disabled = false;
        }
    });
}

function showSuccess() {
    document.getElementById('purchase-form').style.display = 'none';
    document.getElementById('success-screen').style.display = 'block';
}

// Admin y otras funciones
async function loadWebSales() {
    const body = document.getElementById('sales-body');
    if (!body) return;

    try {
        const res = await fetch('/api/web-sales');
        const sales = await res.json();
        body.innerHTML = sales.map(s => `
            <tr>
                <td>${new Date(s.fecha_pedido).toLocaleDateString()}</td>
                <td><span style="font-weight: 700;">#${s.id_pedido}</span></td>
                <td>${s.nombre_producto}</td>
                <td><strong>${s.nombre_cliente_web || 'Cliente'}</strong></td>
                <td>${s.cantidad}</td>
                <td>$${parseFloat(s.monto_total).toLocaleString()}</td>
                <td><span class="badge ${s.procesado_web ? 'badge-done' : 'badge-pending'}">${s.procesado_web ? 'PROCESADA' : 'PENDIENTE'}</span></td>
                <td>${!s.procesado_web ? `<button class="btn-process" onclick="processSale(${s.id_pedido}, true)">Procesar</button>` : '---'}</td>
            </tr>`).join('');
    } catch (error) {
        body.innerHTML = '<tr><td colspan="8" style="text-align: center;">Sin conexión al servidor administrativo.</td></tr>';
    }
}
