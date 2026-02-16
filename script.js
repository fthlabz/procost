// --- DEĞİŞKENLER ---
let products = [];
let cart = [];

// --- DOM ELEMENTLERİ ---
const productSelect = document.getElementById('productSelect');
const quantityInput = document.getElementById('quantityInput');
const displayPrice = document.getElementById('displayPrice');
const displayUnit = document.getElementById('displayUnit');
const lineTotal = document.getElementById('lineTotal');
const cartTableBody = document.querySelector('#cartTable tbody');
const grandTotalDisplay = document.getElementById('grandTotal');

// --- BAŞLATMA ---
init();

async function init() {
    // Önce data.json'dan veriyi çekmeye çalışıyoruz
    await loadProductsFromJson();
    renderProductDropdown();
    
    // Sepet boş başlar (veya istersen localStorage'dan sepeti hatırlatabiliriz)
    // renderCart(); 
}

// --- 1. JSON VERİSİNİ ÇEKME FONKSİYONU (YENİ) ---
async function loadProductsFromJson() {
    try {
        const response = await fetch('data.json');
        if (!response.ok) {
            throw new Error('Veri dosyası bulunamadı!');
        }
        // JSON dosyasındaki verileri alıp 'products' değişkenine atıyoruz
        products = await response.json();
        console.log("Fiyat listesi başarıyla yüklendi:", products);
    } catch (error) {
        console.error("Hata:", error);
        alert("Fiyat listesi yüklenemedi! Lütfen data.json dosyasını kontrol edin.");
        // Hata durumunda boş liste kalmasın diye örnek veri
        products = [
            { id: 999, name: "Veri Hatası - Manuel Giriş Yapın", price: 0, unit: "Adet" }
        ];
    }
}

// --- STANDART FONKSİYONLAR ---

// 2. Dropdown'ı Doldur
function renderProductDropdown() {
    productSelect.innerHTML = '<option value="" disabled selected>Listeden seçiniz...</option>';
    products.forEach(product => {
        const option = document.createElement('option');
        option.value = product.id;
        option.textContent = `${product.name}`;
        productSelect.appendChild(option);
    });
}

// 3. Seçim Yapıldığında Fiyatı Getir
productSelect.addEventListener('change', (e) => {
    const selectedId = parseInt(e.target.value);
    const product = products.find(p => p.id === selectedId);
    
    if(product) {
        displayPrice.textContent = formatMoney(product.price);
        displayUnit.textContent = product.unit;
        calculateLineTotal();
    }
});

// 4. Miktar Girildiğinde Ara Toplamı Hesapla
quantityInput.addEventListener('input', calculateLineTotal);

function calculateLineTotal() {
    const selectedId = parseInt(productSelect.value);
    const product = products.find(p => p.id === selectedId);
    const quantity = parseFloat(quantityInput.value) || 0;

    if (product) {
        const total = product.price * quantity;
        lineTotal.textContent = formatMoney(total);
    }
}

// 5. Listeye Ekle
document.getElementById('addToCartBtn').addEventListener('click', () => {
    const selectedId = parseInt(productSelect.value);
    const product = products.find(p => p.id === selectedId);
    const quantity = parseFloat(quantityInput.value);

    if (!product || !quantity || quantity <= 0) {
        alert("Lütfen geçerli bir ürün ve miktar seçin.");
        return;
    }

    const itemTotal = product.price * quantity;
    
    cart.push({
        id: Date.now(),
        name: product.name,
        price: product.price,
        unit: product.unit,
        quantity: quantity,
        total: itemTotal
    });

    renderCart();
    // Formu sıfırla
    quantityInput.value = '';
    lineTotal.textContent = '0.00 ₺';
    productSelect.value = "";
    displayPrice.textContent = "0.00 ₺";
    displayUnit.textContent = "-";
});

// 6. Sepeti Ekrana Bas
function renderCart() {
    cartTableBody.innerHTML = '';
    let grandTotal = 0;

    cart.forEach((item, index) => {
        grandTotal += item.total;
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${item.name}</td>
            <td>${formatMoney(item.price)} / ${item.unit}</td>
            <td>${item.quantity}</td>
            <td><strong>${formatMoney(item.total)}</strong></td>
            <td><button class="btn-danger-text" onclick="removeFromCart(${index})"><i class="fa-solid fa-trash"></i></button></td>
        `;
        cartTableBody.appendChild(row);
    });

    grandTotalDisplay.textContent = formatMoney(grandTotal);
}

// 7. Sepetten Sil
window.removeFromCart = function(index) {
    cart.splice(index, 1);
    renderCart();
}

// 8. Listeyi Temizle
document.getElementById('clearListBtn').addEventListener('click', () => {
    if(confirm("Tüm liste silinecek?")) {
        cart = [];
        renderCart();
    }
});

// 9. Yazdır
document.getElementById('printBtn').addEventListener('click', () => {
    window.print();
});

// Ayarlar butonu artık sadece bilgi verecek (Çünkü JSON elle düzenlenmeli)
document.getElementById("settingsBtn").addEventListener('click', () => {
    alert("Fiyatları güncellemek için GitHub'daki 'data.json' dosyasını düzenleyiniz.");
});

// Para Formatı
function formatMoney(amount) {
    return amount.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' });
}
