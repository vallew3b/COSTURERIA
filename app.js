// Función para obtener una imagen dinámica basada en el nombre del producto


// Funciones para la Tienda
async function loadProducts() {
    const list = document.getElementById('product-list');
    if (!list) return;

    try {
        const res = await fetch('/api/products');
        if (!res.ok) throw new Error('Servidor no disponible');
        
        const products = await res.json();
        
        if (products.length === 0) {
            list.innerHTML = `
                <div style="grid-column: 1/-1; text-align: center; padding: 4rem;">
                    <p style="font-size: 1.25rem; color: var(--text-muted);">
                        No hay productos registrados en la base de datos.<br>
                        Agrega productos en tu .exe para verlos aquí.
                    </p>
                </div>`;
            return;
        }

        renderProducts(products);
        updateStatus(true);
    } catch (error) {
        console.error('Error al cargar productos reales:', error);
        list.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 4rem;">
                <p style="color: #ef4444; font-size: 1.2rem; font-weight: 700;">
                    Error de Conexión con la Base de Datos
                </p>
                <p style="color: var(--text-muted); margin-top: 1rem;">
                    Asegúrate de que tu servidor (server.js) esté corriendo localmente.<br>
                    Si estás viendo esto en GitHub Pages, recuerda que necesitas un host de Node.js.
                </p>
            </div>`;
        updateStatus(false);
    }
}

function updateStatus(connected) {
    const status = document.getElementById('connection-status');
    if (!status) return;
    status.innerHTML = connected 
        ? '<span class="status-dot" style="background: #10b981"></span> Conectado a Base de Datos Real'
        : '<span class="status-dot" style="background: #ef4444"></span> Error: Servidor Desconectado';
}

function getProductImage(product) {
    if (product.imagen) {
        // Si la imagen es Base64 pero no tiene el prefijo, se lo agregamos
        if (product.imagen.length > 100 && !product.imagen.startsWith('data:')) {
            return `data:image/jpeg;base64,${product.imagen}`;
        }
        return product.imagen;
    }
    // Si no hay imagen, usamos una de respaldo basada en el ID para consistencia
    const query = encodeURIComponent(`${product.nombre_producto} ${product.categoria || ''}`);
    return `https://loremflickr.com/800/800/clothing,apparel,${query}/all`;
}

function renderProducts(products) {
    const list = document.getElementById('product-list');
    list.innerHTML = products.map(p => {
        // Jalar imagen basada en el NOMBRE REAL del producto de tu DB o la imagen guardada
        const imageUrl = getProductImage(p);
        
        return `
        <div class="product-card">
            <div style="position: relative; overflow: hidden;">
                <img src="${imageUrl}" alt="${p.nombre_producto}" class="product-image">
                <div style="position: absolute; top: 10px; right: 10px; background: rgba(255,255,255,0.9); padding: 5px 10px; border-radius: 20px; font-size: 0.7rem; font-weight: 800;">
                    ID: ${p.id_producto}
                </div>
            </div>
            <div class="product-info">
                <span class="product-category">${p.categoria || 'Producto Tuleto'}</span>
                <h3 class="product-name">${p.nombre_producto}</h3>
                <p class="product-description">${p.descripcion || 'Sin descripción disponible.'}</p>
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
        btnSubmit.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Procesando...';
        btnSubmit.disabled = true;

        try {
            const data = {
                id_producto: document.getElementById('form-product-id').value,
                cantidad: document.getElementById('form-quantity').value,
                nombre_cliente: document.getElementById('form-name').value,
                email: document.getElementById('form-email').value
            };

            const res = await fetch('/api/purchase', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });

            if (res.ok) {
                showSuccess();
                loadProducts();
            } else {
                const err = await res.json();
                alert('Error: ' + err.error);
            }
        } catch (error) {
            alert('Error de conexión con el servidor local.');
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
