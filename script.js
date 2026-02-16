// --- VERİTABANI YÖNETİMİ ---
let dbProducts = JSON.parse(localStorage.getItem('fth_db_products')) || [];
let billList = [];

// DOM Elementleri
const newName = document.getElementById('newProdName');
const newPrice = document.getElementById('newProdPrice');
const newUnit = document.getElementById('newProdUnit');
const dbList = document.getElementById('databaseList');
const productSelect = document.getElementById('productSelect');

const displayPrice = document.getElementById('displayPrice');
const displayUnit = document.getElementById('displayUnit');
const quantityInput = document.getElementById('quantityInput');
const lineTotal = document.getElementById('lineTotal');

const billTableBody = document.querySelector('#billTable tbody');
const grandTotalEl = document.getElementById('grandTotal');

// Başlarken verileri yükle
init();

function init() {
    refreshDbUI();
}

// 1. DATABASE'E KAYIT EKLEME
document.getElementById('saveToDbBtn').addEventListener('click', () => {
    if(newName.value === "" || newPrice.value === "") {
        alert("Lütfen isim ve fiyat giriniz!");
        return;
    }

    const newProduct = {
        id: Date.now(),
        name: newName.value,
        price: parseFloat(newPrice.value),
        unit: newUnit.value
    };

    dbProducts.push(newProduct);
    saveDb(); // Hafızaya yaz
    
    // Temizle
    newName.value = "";
    newPrice.value = "";
    refreshDbUI();
});

// Veritabanını LocalStorage'a kaydetme fonksiyonu
function saveDb() {
    localStorage.setItem('fth_db_products', JSON.stringify(dbProducts));
}

// Veritabanı arayüzünü güncelle (Dropdown ve Liste)
function refreshDbUI() {
    // Listeyi temizle
    dbList.innerHTML = "";
    productSelect.innerHTML = '<option value="">-- Veritabanından Seç --</option>';

    dbProducts.forEach((prod, index) => {
        // 1. Sol Paneldeki Listeye Ekle (Silme butonlu)
        const li = document.createElement('li');
        li.innerHTML = `
            <span>${prod.name} (${prod.price}₺/${prod.unit})</span>
            <button class="btn-icon" onclick="deleteFromDb(${index})"><i class="fa-solid fa-trash"></i></button>
        `;
        dbList.appendChild(li);

        // 2. Sağ Paneldeki Dropdown'a Ekle
        const option = document.createElement('option');
        option.value = index; // Array indexini value olarak kullanıyoruz
        option.textContent = prod.name;
        productSelect.appendChild(option);
    });
}

// Veritabanından Silme
window.deleteFromDb = function(index) {
    if(confirm("Bu ürünü veritabanından kalıcı olarak silmek istiyor musunuz?")) {
        dbProducts.splice(index, 1);
        saveDb();
        refreshDbUI();
        
        // Eğer seçili olan silindiyse ekranı sıfırla
        productSelect.value = "";
        displayPrice.textContent = "0.00 ₺";
        displayUnit.textContent = "-";
        lineTotal.textContent = "0.00 ₺";
    }
}

// --- HESAPLAMA MODÜLÜ ---

// Ürün Seçilince
productSelect.addEventListener('change', () => {
    const idx = productSelect.value;
    if(idx !== "") {
        const prod = dbProducts[idx];
        displayPrice.textContent = formatMoney(prod.price);
        displayUnit.textContent = prod.unit;
        calculate();
    } else {
        displayPrice.textContent = "0.00 ₺";
        displayUnit.textContent = "-";
    }
});

// Miktar Girilince
quantityInput.addEventListener('input', calculate);

function calculate() {
    const idx = productSelect.value;
    const qty = parseFloat(quantityInput.value) || 0;
    
    if(idx !== "") {
        const prod = dbProducts[idx];
        const total = prod.price * qty;
        lineTotal.textContent = formatMoney(total);
    }
}

// Listeye (Sepete) Ekleme
document.getElementById('addToBillBtn').addEventListener('click', () => {
    const idx = productSelect.value;
    const qty = parseFloat(quantityInput.value);

    if(idx === "" || !qty || qty <= 0) {
        alert("Ürün seçip miktar giriniz.");
        return;
    }

    const prod = dbProducts[idx];
    const total = prod.price * qty;

    billList.push({
        name: prod.name,
        price: prod.price,
        unit: prod.unit,
        qty: qty,
        total: total
    });

    renderBill();
    quantityInput.value = "";
    lineTotal.textContent = "0.00 ₺";
});

// Fatura Listesini Çiz
function renderBill() {
    billTableBody.innerHTML = "";
    let grandTotal = 0;

    billList.forEach((item, index) => {
        grandTotal += item.total;
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${item.name}</td>
            <td>${item.qty} ${item.unit} x ${item.price}₺</td>
            <td style="color:var(--neon-green)">${formatMoney(item.total)}</td>
            <td><button class="btn-danger-text" onclick="deleteFromBill(${index})">X</button></td>
        `;
        billTableBody.appendChild(row);
    });

    grandTotalEl.textContent = formatMoney(grandTotal);
}

// Faturadan Sil
window.deleteFromBill = function(index) {
    billList.splice(index, 1);
    renderBill();
}

// Faturayı Temizle
window.clearBill = function() {
    billList = [];
    renderBill();
}

function formatMoney(amount) {
    return amount.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' ₺';
}
