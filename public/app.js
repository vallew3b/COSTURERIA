// Imágenes premium de respaldo (Unsplash)
const fallbackImages = [
    'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&q=80&w=800',
    'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&q=80&w=800',
    'https://images.unsplash.com/photo-1539109132314-347f85417bd4?auto=format&fit=crop&q=80&w=800',
    'https://images.unsplash.com/photo-1485230895905-ec40ba36b9bc?auto=format&fit=crop&q=80&w=800',
    'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&q=80&w=800',
    'https://images.unsplash.com/photo-1554412933-514a83d2f3c8?auto=format&fit=crop&q=80&w=800',
    'https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&q=80&w=800'
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
        const products = await res.json();

        if (products.length === 0) {
            list.innerHTML = `
                <div style="grid-column: 1/-1; text-align: center; padding: 4rem;">
                    <p style="font-size: 1.25rem; color: var(--text-muted);">
                        Nuestras existencias se han agotado temporalmente.<br>
                        Vuelve pronto para nuevas colecciones.
                    </p>
                </div>`;
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
                    <p class="product-description">${p.descripcion || 'Confeccionado con los más altos estándares de calidad y diseño contemporáneo.'}</p>
                    
                    <div class="product-meta">
                        <div class="price-tag">
                            <span class="price-label">Precio</span>
                            <span class="price-value">$${parseFloat(p.precio_venta).toLocaleString()}</span>
                        </div>
                        <div class="stock-tag">
                            ${p.stock_actual} en stock
                        </div>
                    </div>
                    
                    <button class="btn-buy" onclick="openModal(${JSON.stringify(p).replace(/"/g, '&quot;')})">
                        Adquirir Ahora
                    </button>
                </div>
            </div>
        `}).join('');
    } catch (error) {
        console.error('Error:', error);
        list.innerHTML = '<p style="color: #ef4444; text-align: center; grid-column: 1/-1; padding: 4rem;">Error al conectar con la galería. Por favor, recarga la página.</p>';
    }
}

function openModal(product) {
    const modal = document.getElementById('purchase-modal');
    document.getElementById('modal-product-name').innerText = product.nombre_producto;
    document.getElementById('modal-product-price').innerText = `$${parseFloat(product.precio_venta).toLocaleString()}`;
    document.getElementById('form-product-id').value = product.id_producto;
    document.getElementById('form-quantity').max = product.stock_actual;
    document.getElementById('form-quantity').value = 1;
    modal.style.display = 'flex';
}

function closeModal() {
    document.getElementById('purchase-modal').style.display = 'none';
}

window.onclick = function(event) {
    const modal = document.getElementById('purchase-modal');
    if (event.target == modal) {
        closeModal();
    }
}

const purchaseForm = document.getElementById('purchase-form');
if (purchaseForm) {
    purchaseForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const btnSubmit = e.target.querySelector('button[type="submit"]');
        const originalText = btnSubmit.innerText;
        btnSubmit.innerText = 'Procesando...';
        btnSubmit.disabled = true;

        const data = {
            id_producto: document.getElementById('form-product-id').value,
            cantidad: document.getElementById('form-quantity').value,
            nombre_cliente: document.getElementById('form-name').value,
            email: document.getElementById('form-email').value
        };

        try {
            const res = await fetch('/api/purchase', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });

            const result = await res.json();
            if (result.success) {
                alert('¡Excelente elección! Su pedido #' + result.id_pedido + ' ha sido registrado. Nos pondremos en contacto pronto.');
                closeModal();
                loadProducts(); 
                purchaseForm.reset();
            } else {
                alert('Lo sentimos: ' + result.error);
            }
        } catch (error) {
            alert('Error al procesar la solicitud. Verifique su conexión.');
        } finally {
            btnSubmit.innerText = originalText;
            btnSubmit.disabled = false;
        }
    });
}

async function loadWebSales() {
    const body = document.getElementById('sales-body');
    if (!body) return;

    try {
        const res = await fetch('/api/web-sales');
        const sales = await res.json();

        if (sales.length === 0) {
            body.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 2rem;">No hay ventas web registradas aún.</td></tr>';
            return;
        }

        body.innerHTML = sales.map(s => `
            <tr>
                <td>${new Date(s.fecha_pedido).toLocaleDateString()}</td>
                <td><span style="font-weight: 700; color: var(--primary);">#${s.id_pedido}</span></td>
                <td>${s.nombre_producto}</td>
                <td>
                    <strong>${s.nombre_cliente_web || 'Cliente Anónimo'}</strong><br>
                    <small style="color: var(--text-muted);">${s.email_cliente || ''}</small>
                </td>
                <td><span class="stock-tag">${s.cantidad} pzs</span></td>
                <td><span style="font-weight: 700;">$${parseFloat(s.monto_total).toLocaleString()}</span></td>
                <td>
                    <span class="badge ${s.procesado_web ? 'badge-done' : 'badge-pending'}">
                        ${s.procesado_web ? 'PROCESADA' : 'PENDIENTE'}
                    </span>
                </td>
                <td>
                    ${!s.procesado_web ? `<button class="btn-process" onclick="processSale(${s.id_pedido}, true)">Marcar Procesada</button>` : '---'}
                </td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Error:', error);
        body.innerHTML = '<tr><td colspan="8" style="color: #ef4444; text-align: center; padding: 2rem;">Error al cargar el historial de ventas.</td></tr>';
    }
}

async function processSale(id, procesado) {
    if (!confirm('¿Deseas confirmar el despacho de este pedido web?')) return;

    try {
        const res = await fetch(`/api/web-sales/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ procesado })
        });

        if (res.ok) {
            loadWebSales();
        } else {
            alert('No se pudo actualizar el estado del pedido.');
        }
    } catch (error) {
        alert('Error de conexión con el servidor.');
    }
}
