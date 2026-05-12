// Configuración de API dinámica para GitHub Pages vs Local
const API_URL = window.location.hostname.includes('github.io') 
    ? 'https://d788af96b530ff93-79-143-88-223.serveousercontent.com' 
    : '';

// Imágenes premium de respaldo
const fallbackImages = [
    'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&q=80&w=800',
    'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&q=80&w=800',
    'https://images.unsplash.com/photo-1539109132314-347f85417bd4?auto=format&fit=crop&q=80&w=800'
];

function getProductImage(product) {
    if (product.imagen) {
        if (product.imagen.length > 100 && !product.imagen.startsWith('data:')) {
            return `data:image/jpeg;base64,${product.imagen}`;
        }
        return product.imagen;
    }
    const index = product.id_producto % fallbackImages.length;
    return fallbackImages[index];
}

async function loadProducts() {
    const list = document.getElementById('product-list');
    const status = document.getElementById('connection-status');
    if (!list) return;

    try {
        const res = await fetch(`${API_URL}/api/products`);
        if (!res.ok) throw new Error('Servidor no disponible');
        
        const products = await res.json();
        
        if (products.length === 0) {
            list.innerHTML = `
                <div style="grid-column: 1/-1; text-align: center; padding: 10rem;">
                    <p style="font-size: 1.5rem; color: var(--text-muted); font-weight: 700;">
                        Todas nuestras piezas exclusivas han sido adquiridas.<br>
                        <span style="font-size: 1rem; font-weight: 400;">Pronto tendremos nuevas creaciones.</span>
                    </p>
                </div>`;
            return;
        }

        list.innerHTML = products.map((p, index) => {
            const imageUrl = getProductImage(p);
            return `
            <div class="product-card" style="animation-delay: ${index * 0.1}s">
                <div class="product-image-container">
                    <img src="${imageUrl}" alt="${p.nombre_producto}" class="product-image">
                    <div class="product-badge">Colección 2026</div>
                </div>
                <div class="product-info">
                    <span class="product-category">${p.categoria || 'Alta Costura'}</span>
                    <h3 class="product-name">${p.nombre_producto}</h3>
                    <p class="product-description">${p.descripcion || 'Una pieza única confeccionada con los materiales más finos de nuestro taller.'}</p>
                    <div class="product-meta">
                        <div class="price-tag">
                            <span class="price-label">Inversión</span>
                            <span class="price-value">$${parseFloat(p.precio_venta).toLocaleString()}</span>
                        </div>
                        <div class="stock-tag">${p.stock_actual} disponibles</div>
                    </div>
                    <button class="btn-buy" onclick='openModal(${JSON.stringify(p).replace(/'/g, "&apos;")})'>
                        Ver Detalles <i class="fas fa-external-link-alt" style="font-size: 0.8rem;"></i>
                    </button>
                </div>
            </div>
        `}).join('');

        if (status) {
            status.innerHTML = '<span class="status-dot" style="background: var(--success); box-shadow: 0 0 10px var(--success);"></span> <span style="color: var(--primary)">Sincronizado con Tuleto ERP</span>';
        }
    } catch (error) {
        console.error('Error:', error);
        if (status) {
            status.innerHTML = '<span class="status-dot" style="background: #ef4444;"></span> <span style="color: #ef4444">Error de Conexión Local</span>';
        }
        list.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 10rem;">
                <p style="color: #ef4444; font-size: 1.5rem; font-weight: 800;">Error de Sincronización</p>
                <p style="color: var(--text-muted); margin-top: 1rem;">Asegúrate de que tu servidor local (server.js) esté encendido y el túnel de Serveo esté activo.</p>
            </div>`;
    }
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
        const originalText = btnSubmit.innerHTML;
        btnSubmit.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Procesando...';
        btnSubmit.disabled = true;

        const data = {
            id_producto: document.getElementById('form-product-id').value,
            cantidad: document.getElementById('form-quantity').value,
            nombre_cliente: document.getElementById('form-name').value,
            email: document.getElementById('form-email').value
        };

        try {
            const res = await fetch(`${API_URL}/api/purchase`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });

            if (res.ok) {
                document.getElementById('purchase-form').style.display = 'none';
                document.getElementById('success-screen').style.display = 'block';
                loadProducts(); 
            } else {
                const err = await res.json();
                alert('Error: ' + err.error);
            }
        } catch (error) {
            alert('Error de conexión con el servidor.');
        } finally {
            btnSubmit.innerHTML = originalText;
            btnSubmit.disabled = false;
        }
    });
}
