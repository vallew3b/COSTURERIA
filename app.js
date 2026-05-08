// Imágenes premium de respaldo (Galería Tuleto - Google Style)
const fallbackImages = [
    'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&q=80&w=800',
    'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&q=80&w=800',
    'https://images.unsplash.com/photo-1539109132314-347f85417bd4?auto=format&fit=crop&q=80&w=800',
    'https://images.unsplash.com/photo-1485230895905-ec40ba36b9bc?auto=format&fit=crop&q=80&w=800',
    'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&q=80&w=800',
    'https://images.unsplash.com/photo-1554412933-514a83d2f3c8?auto=format&fit=crop&q=80&w=800',
    'https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&q=80&w=800',
    'https://images.unsplash.com/photo-1475180098004-caaa744179a5?auto=format&fit=crop&q=80&w=800',
    'https://images.unsplash.com/photo-1537832816519-689ad163238b?auto=format&fit=crop&q=80&w=800',
    'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&q=80&w=800'
];

// Datos de simulación para que NUNCA falle la galería (Modo Demo)
const mockProducts = [
    { id_producto: 1, nombre_producto: "Vestido Gala 'Nocturno'", precio_venta: 1250, descripcion: "Elegancia pura para tus eventos más exclusivos.", categoria: "Gala", stock_actual: 5 },
    { id_producto: 2, nombre_producto: "Saco Ejecutivo 'Elite'", precio_venta: 1890, descripcion: "Corte italiano con acabados hechos a mano.", categoria: "Premium", stock_actual: 3 },
    { id_producto: 3, nombre_producto: "Blusa Seda 'Venezia'", precio_venta: 650, descripcion: "Suavidad y estilo para cualquier ocasión.", categoria: "Dama", stock_actual: 10 },
    { id_producto: 4, nombre_producto: "Traje Completo 'Oxford'", precio_venta: 3200, descripcion: "El estándar de oro para el hombre moderno.", categoria: "Caballero", stock_actual: 2 },
    { id_producto: 5, nombre_producto: "Vestido Cóctel 'Rosa'", precio_venta: 950, descripcion: "Fresco, ligero y sofisticado.", categoria: "Casual", stock_actual: 7 },
    { id_producto: 6, nombre_producto: "Abrigo Invierno 'Nórdico'", precio_venta: 2100, descripcion: "Protección total con diseño de vanguardia.", categoria: "Invierno", stock_actual: 4 }
];

function getProductImage(product) {
    const index = product.id_producto % fallbackImages.length;
    return fallbackImages[index];
}

async function loadProducts() {
    const list = document.getElementById('product-list');
    if (!list) return;

    try {
        const res = await fetch('/api/products');
        if (!res.ok) throw new Error('Servidor no disponible');
        
        const products = await res.json();
        renderProducts(products);
        updateStatus(true);
    } catch (error) {
        console.warn('Servidor local no detectado. Cargando catálogo de simulación...');
        renderProducts(mockProducts);
        updateStatus(false);
    }
}

function updateStatus(connected) {
    const status = document.getElementById('connection-status');
    if (!status) return;
    status.innerHTML = connected 
        ? '<span class="status-dot" style="background: #10b981"></span> Sincronizado con Tuleto ERP (Live)'
        : '<span class="status-dot" style="background: #f59e0b"></span> Modo Catálogo (Demo Offline)';
}

function renderProducts(products) {
    const list = document.getElementById('product-list');
    list.innerHTML = products.map(p => {
        const imageUrl = getProductImage(p);
        return `
        <div class="product-card">
            <img src="${imageUrl}" alt="${p.nombre_producto}" class="product-image">
            <div class="product-info">
                <span class="product-category">${p.categoria || 'Tuleto Exclusive'}</span>
                <h3 class="product-name">${p.nombre_producto}</h3>
                <p class="product-description">${p.descripcion || 'Confección de alta calidad.'}</p>
                <div class="product-meta">
                    <div class="price-tag">
                        <span class="price-label">Precio</span>
                        <span class="price-value">$${parseFloat(p.precio_venta).toLocaleString()}</span>
                    </div>
                    <div class="stock-tag">${p.stock_actual} disponibles</div>
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

        try {
            // Simulación de pasarela de pago (2 segundos)
            await new Promise(resolve => setTimeout(resolve, 2000));

            const data = {
                id_producto: document.getElementById('form-product-id').value,
                cantidad: document.getElementById('form-quantity').value,
                nombre_cliente: document.getElementById('form-name').value,
                email: document.getElementById('form-email').value
            };

            await fetch('/api/purchase', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });

            // Mostramos éxito incluso si el fetch falla (para la demo)
            showSuccess();
            loadProducts();
        } catch (error) {
            showSuccess();
        } finally {
            btnSubmit.innerHTML = 'Confirmar y Pagar';
            btnSubmit.disabled = false;
        }
    });
}

function showSuccess() {
    document.getElementById('purchase-form').style.display = 'none';
    document.getElementById('success-screen').style.display = 'block';
}

function showStep(step) {
    document.getElementById('step-1').style.display = step === 1 ? 'block' : 'none';
    document.getElementById('step-2').style.display = step === 2 ? 'block' : 'none';
    const title = document.getElementById('modal-title');
    if (title) title.innerText = step === 1 ? 'Finalizar Compra' : 'Detalles de Pago';
}
