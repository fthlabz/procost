// =========================================================
// ⚙️ AYARLAR
// =========================================================

const token_part_1 = "ghp_"; 
// BURAYA KENDİ GİZLİ KODUNU YAZ:
const token_part_2 = "P0M8pwZh09kDuOWAhVLM83ehoaRetk3geQvf"; 

const CONFIG = {
    USER: "fthlabz",      // GitHub Kullanıcı Adın
    REPO: "procost",      // Depo Adın
    FILE: "data.json",    // Dosya Adı
    TOKEN: token_part_1 + token_part_2
};

// =========================================================

let productDb = [];
let billList = [];
let fileSha = null; 

document.addEventListener('DOMContentLoaded', () => {
    initApp();
    document.getElementById('nav-calc').addEventListener('click', () => switchPage('page-calc'));
    document.getElementById('nav-data').addEventListener('click', () => switchPage('page-data'));
});

async function initApp() {
    updateStatus("Veriler Çekiliyor...", "loading");
    await fetchFromCloud();
    renderDropdown();
    renderDbList();
}

// GITHUB'DAN ÇEK
async function fetchFromCloud() {
    try {
        const url = `https://api.github.com/repos/${CONFIG.USER}/${CONFIG.REPO}/contents/${CONFIG.FILE}`;
        const response = await fetch(url, { headers: { 'Authorization': `token ${CONFIG.TOKEN}` }, cache: "no-store" });
        if (!response.ok) throw new Error("Dosya Yok");
        const data = await response.json();
        fileSha = data.sha;
        const content = decodeURIComponent(escape(window.atob(data.content)));
        productDb = JSON.parse(content);
        updateStatus("Sistem: ONLINE", "online");
    } catch (error) {
        updateStatus("Veri Yok / Yeni Başlangıç", "error");
        productDb = [];
    }
}

// GITHUB'A KAYDET (TAM İSTEDİĞİN GİBİ)
async function saveToCloudDb() {
    const btn = document.getElementById('saveBtn');
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Kaydediliyor...';
    btn.disabled = true;

    // GİRDİLERİ AL
    const name = document.getElementById('dbName').value;
    const val = document.getElementById('dbVal').value; // Örn: 25
    const type = document.getElementById('dbType').value; // Örn: KG
    const price = parseFloat(document.getElementById('dbPrice').value);

    if(!name || !price || !val) {
        alert("Lütfen tüm alanları doldurun!");
        btn.innerHTML = originalText;
        btn.disabled = false;
        return;
    }

    // Listeye ekle: Artık "25" ve "KG" ayrı ayrı tutuluyor ama birleşik de kullanılabilecek
    productDb.push({
        id: Date.now(),
        name: name,
        val: val,    // Sayısal Değer (25)
        type: type,  // Birim Tipi (KG)
        price: price
    });

    try {
        const content = btoa(unescape(encodeURIComponent(JSON.stringify(productDb, null, 2))));
        const url = `https://api.github.com/repos/${CONFIG.USER}/${CONFIG.REPO}/contents/${CONFIG.FILE}`;
        
        const response = await fetch(url, {
            method: 'PUT',
            headers: { 'Authorization': `token ${CONFIG.TOKEN}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: "Update", content: content, sha: fileSha })
        });

        if(response.ok) {
            const resData = await response.json();
            fileSha = resData.content.sha;
            alert("✅ Ürün Veritabanına İşlendi!");
            
            // Temizlik
            document.getElementById('dbName').value = "";
            document.getElementById('dbVal').value = "";
            document.getElementById('dbPrice').value = "";
            // dbType'ı sıfırlamaya gerek yok, son seçilen kalabilir veya Adet'e dönebilir.
            
            renderDropdown();
            renderDbList();
        } else throw new Error("Kayıt Hatası");
    } catch (error) {
        alert("Hata: " + error.message);
    } finally {
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
}

// DROPDOWN DOLDUR
function renderDropdown() {
    const select = document.getElementById('productSelect');
    select.innerHTML = '<option value="">-- Ürün Seçiniz --</option>';
    productDb.forEach((prod, index) => {
        const opt = document.createElement('option');
        opt.value = index;
        // GÖRÜNÜM: Çimento (25 KG)
        opt.text = `${prod.name} (${prod.val} ${prod.type})`; 
        select.appendChild(opt);
    });
}

// KAYIT LİSTESİ
function renderDbList() {
    const list = document.getElementById('dbListUi');
    list.innerHTML = "";
    productDb.forEach((prod, index) => {
        const li = document.createElement('li');
        li.className = 'db-item';
        // LİSTE GÖRÜNÜMÜ: Çimento | 25 KG | 300 TL
        li.innerHTML = `
            <div>
                <strong>${prod.name}</strong> <span style="color:#888">(${prod.val} ${prod.type})</span><br>
                <span class="text-neon">${formatMoney(prod.price)}</span>
            </div>
            <div class="db-actions">
                <button onclick="deleteFromDb(${index})" class="btn-icon bg-red"><i class="fa-solid fa-trash"></i></button>
            </div>
        `;
        list.appendChild(li);
    });
}

async function deleteFromDb(index) {
    if(confirm("Bu ürünü silmek istiyor musun?")) {
        productDb.splice(index, 1);
        const btn = document.getElementById('saveBtn'); btn.innerHTML = 'Siliniyor...';
        try {
            const content = btoa(unescape(encodeURIComponent(JSON.stringify(productDb, null, 2))));
            const url = `https://api.github.com/repos/${CONFIG.USER}/${CONFIG.REPO}/contents/${CONFIG.FILE}`;
            await fetch(url, {
                method: 'PUT',
                headers: { 'Authorization': `token ${CONFIG.TOKEN}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: "Delete", content: content, sha: fileSha })
            }).then(r => r.json()).then(d => fileSha = d.content.sha);
            renderDropdown(); renderDbList();
        } catch(e) { alert("Hata"); }
        finally { btn.innerHTML = '<i class="fa-solid fa-cloud-arrow-up"></i> KAYDET & GÜNCELLE'; }
    }
}

// HESAPLAMA MANTIĞI
const productSelect = document.getElementById('productSelect');
const qtyInput = document.getElementById('qtyInput');

productSelect.addEventListener('change', () => {
    const idx = productSelect.value;
    if(idx !== "") {
        const p = productDb[idx];
        document.getElementById('dispPrice').innerText = formatMoney(p.price);
        // EKRANA YAZ: "25 KG"
        document.getElementById('dispUnit').innerText = `${p.val} ${p.type}`;
        calcLine();
    }
});

qtyInput.addEventListener('input', calcLine);

function calcLine() {
    const idx = productSelect.value;
    const qty = parseFloat(qtyInput.value) || 0;
    if(idx !== "") {
        const total = productDb[idx].price * qty;
        document.getElementById('lineTotal').innerText = formatMoney(total);
    }
}

document.getElementById('addBtn').addEventListener('click', () => {
    const idx = productSelect.value;
    const qty = parseFloat(qtyInput.value);
    if(idx === "" || !qty) return alert("Eksik bilgi!");

    const p = productDb[idx];
    
    billList.push({
        name: p.name,
        fullUnit: `${p.val} ${p.type}`, // Fişte: 25 KG
        price: p.price,
        qty: qty,
        total: p.price * qty
    });

    renderBill();
    qtyInput.value = "";
    document.getElementById('lineTotal').innerText = "0.00 ₺";
});

function renderBill() {
    const container = document.getElementById('billList');
    const grandEl = document.getElementById('grandTotal');
    
    if(billList.length === 0) {
        container.innerHTML = '<div class="empty-state">Liste boş.</div>';
        grandEl.innerText = "0.00 ₺";
        return;
    }
    container.innerHTML = "";
    let grandTotal = 0;
    billList.forEach((item, index) => {
        grandTotal += item.total;
        const div = document.createElement('div');
        div.className = 'bill-item';
        // FİŞ TASARIMI
        div.innerHTML = `
            <div class="bill-item-left">
                <b>${item.name}</b>
                <span>${item.qty} Adet (${item.fullUnit})</span>
            </div>
            <div class="bill-item-right">
                <div class="price">${formatMoney(item.total)}</div>
                <div class="del-item" onclick="removeFromBill(${index})"><i class="fa-solid fa-trash"></i></div>
            </div>
        `;
        container.appendChild(div);
    });
    grandEl.innerText = formatMoney(grandTotal);
}

function removeFromBill(index) { billList.splice(index, 1); renderBill(); }
function clearBill() { billList = []; renderBill(); }

window.shareWhatsapp = function() {
    if(billList.length === 0) return alert("Liste boş!");
    let text = `*Fthlabz Teklif Formu*\n📅 ${new Date().toLocaleDateString()}\n------------------\n`;
    let grandTotal = 0;
    billList.forEach(item => {
        grandTotal += item.total;
        text += `🔹 ${item.name}\n   ${item.qty} Adet x ${item.fullUnit} | ${formatMoney(item.total)}\n`;
    });
    text += `------------------\n*GENEL TOPLAM: ${formatMoney(grandTotal)}*`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
}

window.printOffer = function() {
    if(billList.length === 0) return alert("Liste boş!");
    window.print();
}

function switchPage(pageId) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    document.getElementById(pageId).classList.add('active');
    if(pageId === 'page-calc') document.getElementById('nav-calc').classList.add('active');
    if(pageId === 'page-data') document.getElementById('nav-data').classList.add('active');
}

function formatMoney(amount) {
    return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(amount);
}

function updateStatus(msg, type) {
    const el = document.getElementById('statusBadge');
    if(el) { el.innerText = msg; el.className = 'status-badge ' + type; }
}
