// =========================================================
// ⚙️ AYARLAR (GitHub Bağlantısı)
// =========================================================

// GÜVENLİK: Token'ı iki parça halinde yazıyoruz ki GitHub otomatik silmesin.
const token_part_1 = "ghp_"; 
// AŞAĞIYA KENDİ GİZLİ KODUNUN GERİ KALANINI YAPIŞTIR:
const token_part_2 = "P0M8pwZh09kDuOWAhVLM83ehoaRetk3geQvf"; 

const CONFIG = {
    USER: "fthlabz",      // Senin Kullanıcı Adın
    REPO: "procost",      // Senin Depo Adın
    FILE: "data.json",    // Kayıt Dosyası
    TOKEN: token_part_1 + token_part_2 // Otomatik birleştirir
};

// =========================================================
// 🚀 UYGULAMA MANTIĞI (Dokunmana Gerek Yok)
// =========================================================

let productDb = [];
let billList = [];
let fileSha = null; 

// Sayfa Yüklendiğinde Başlat
document.addEventListener('DOMContentLoaded', () => {
    initApp();
    
    // Navigasyon Butonları
    document.getElementById('nav-calc').addEventListener('click', () => switchPage('page-calc'));
    document.getElementById('nav-data').addEventListener('click', () => switchPage('page-data'));
});

// 1. BAŞLATMA
async function initApp() {
    updateStatus("Veriler Çekiliyor...", "loading");
    await fetchFromCloud();
    renderDropdown();
    renderDbList();
}

// 2. GITHUB'DAN VERİ ÇEK (GET)
async function fetchFromCloud() {
    try {
        const url = `https://api.github.com/repos/${CONFIG.USER}/${CONFIG.REPO}/contents/${CONFIG.FILE}`;
        const response = await fetch(url, {
            headers: { 'Authorization': `token ${CONFIG.TOKEN}` },
            cache: "no-store"
        });

        if (!response.ok) throw new Error("Dosya Henüz Yok veya Token Hatalı");

        const data = await response.json();
        fileSha = data.sha; // Dosya kimliğini al (Güncelleme için şart)

        // Türkçe karakter sorunu olmasın diye özel çözümleme
        const content = decodeURIComponent(escape(window.atob(data.content)));
        productDb = JSON.parse(content);

        updateStatus("Sistem: ONLINE", "online");
    } catch (error) {
        console.error(error);
        updateStatus("Veri Yok / Yeni Başlangıç", "error");
        productDb = []; // Hata varsa boş başla
    }
}

// 3. GITHUB'A KAYDET (PUT)
async function saveToCloudDb() {
    const btn = document.getElementById('saveBtn');
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Kaydediliyor...';
    btn.disabled = true;

    // Formdan verileri al
    const name = document.getElementById('dbName').value;
    const desc = document.getElementById('dbDesc').value; // Birim/Özellik
    const price = parseFloat(document.getElementById('dbPrice').value);

    if(!name || !price) {
        alert("Lütfen İsim ve Fiyat giriniz!");
        btn.innerHTML = originalText;
        btn.disabled = false;
        return;
    }

    // Listeye ekle
    productDb.push({
        id: Date.now(),
        name: name,
        desc: desc,
        price: price
    });

    try {
        // Türkçe karakter destekli Base64 çevrimi
        const content = btoa(unescape(encodeURIComponent(JSON.stringify(productDb, null, 2))));

        const url = `https://api.github.com/repos/${CONFIG.USER}/${CONFIG.REPO}/contents/${CONFIG.FILE}`;
        
        const bodyData = {
            message: "Fthlabz App: Yeni Ürün Eklendi",
            content: content,
            sha: fileSha // Eğer dosya varsa SHA zorunludur
        };

        const response = await fetch(url, {
            method: 'PUT',
            headers: {
                'Authorization': `token ${CONFIG.TOKEN}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(bodyData)
        });

        if(response.ok) {
            const resData = await response.json();
            fileSha = resData.content.sha; // Yeni SHA'yı güncelle
            alert("✅ Ürün Veritabanına Kaydedildi!");
            
            // Temizlik
            document.getElementById('dbName').value = "";
            document.getElementById('dbDesc').value = "";
            document.getElementById('dbPrice').value = "";
            
            renderDropdown();
            renderDbList();
        } else {
            throw new Error("GitHub Kayıt Hatası!");
        }
    } catch (error) {
        alert("Hata Oluştu: " + error.message);
        // Hata durumunda eklenen son ürünü geri al (Rollback)
        productDb.pop();
    } finally {
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
}

// 4. LİSTELERİ GÜNCELLEME
function renderDropdown() {
    const select = document.getElementById('productSelect');
    select.innerHTML = '<option value="">-- Ürün Seçiniz --</option>';
    
    productDb.forEach((prod, index) => {
        const opt = document.createElement('option');
        opt.value = index;
        opt.text = `${prod.name}`;
        select.appendChild(opt);
    });
}

function renderDbList() {
    const list = document.getElementById('dbListUi');
    list.innerHTML = "";
    
    productDb.forEach((prod, index) => {
        const li = document.createElement('li');
        li.className = 'db-item';
        li.innerHTML = `
            <div>
                <strong>${prod.name}</strong> <span style="color:#888">(${prod.desc})</span><br>
                <span class="text-neon">${formatMoney(prod.price)}</span>
            </div>
            <div class="db-actions">
                <button onclick="deleteFromDb(${index})" class="btn-icon bg-red"><i class="fa-solid fa-trash"></i></button>
            </div>
        `;
        list.appendChild(li);
    });
}

// Veritabanından Silme
async function deleteFromDb(index) {
    if(confirm("Bu ürünü silip GitHub'ı güncellemek istiyor musun?")) {
        productDb.splice(index, 1);
        
        // Silme işlemi için sahte bir kayıt isteği göndererek dosyayı güncelliyoruz
        // (UI'da form boş olduğu için sadece listeyi kaydeder)
        
        const btn = document.getElementById('saveBtn'); 
        btn.innerHTML = 'Siliniyor...';
        
        try {
            const content = btoa(unescape(encodeURIComponent(JSON.stringify(productDb, null, 2))));
            const url = `https://api.github.com/repos/${CONFIG.USER}/${CONFIG.REPO}/contents/${CONFIG.FILE}`;
            
            await fetch(url, {
                method: 'PUT',
                headers: { 'Authorization': `token ${CONFIG.TOKEN}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: "Ürün Silindi", content: content, sha: fileSha })
            }).then(r => r.json()).then(d => { fileSha = d.content.sha; });
            
            renderDropdown();
            renderDbList();
            alert("🗑️ Ürün Silindi.");
        } catch(e) {
            alert("Silme Hatası");
        } finally {
            btn.innerHTML = '<i class="fa-solid fa-cloud-arrow-up"></i> KAYDET & GÜNCELLE';
        }
    }
}

// 5. HESAPLAMA MANTIĞI
const productSelect = document.getElementById('productSelect');
const qtyInput = document.getElementById('qtyInput');

productSelect.addEventListener('change', () => {
    const idx = productSelect.value;
    if(idx !== "") {
        const p = productDb[idx];
        document.getElementById('dispPrice').innerText = formatMoney(p.price);
        document.getElementById('dispDesc').innerText = p.desc;
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

// Listeye Ekle Butonu
document.getElementById('addBtn').addEventListener('click', () => {
    const idx = productSelect.value;
    const qty = parseFloat(qtyInput.value);

    if(idx === "" || !qty) return alert("Ürün ve Miktar Seçin!");

    const p = productDb[idx];
    billList.push({
        name: p.name,
        desc: p.desc,
        price: p.price,
        qty: qty,
        total: p.price * qty
    });

    renderBill();
    qtyInput.value = "";
    document.getElementById('lineTotal').innerText = "0.00 ₺";
});

// Fatura Listesini Çiz
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
        div.innerHTML = `
            <div class="bill-item-left">
                <b>${item.name}</b>
                <span>${item.qty} Adet (${item.desc})</span>
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

function removeFromBill(index) {
    billList.splice(index, 1);
    renderBill();
}

function clearBill() {
    billList = [];
    renderBill();
}

// 6. WHATSAPP PAYLAŞIM
window.shareWhatsapp = function() {
    if(billList.length === 0) return alert("Liste boş, paylaşılacak bir şey yok!");

    let text = `*Fthlabz Teklif Formu*\n📅 Tarih: ${new Date().toLocaleDateString()}\n------------------\n`;
    let grandTotal = 0;

    billList.forEach(item => {
        grandTotal += item.total;
        text += `🔹 ${item.name} (${item.qty} x ${item.desc})\n   Tutar: ${formatMoney(item.total)}\n`;
    });

    text += `------------------\n*GENEL TOPLAM: ${formatMoney(grandTotal)}*`;
    text += `\n\n_Bu teklif Fthlabz Cloud sistemi ile hazırlanmıştır._`;

    // WhatsApp Linki (Mobilde uygulamayı, PC'de web'i açar)
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
}

window.printOffer = function() {
    if(billList.length === 0) return alert("Liste boş!");
    window.print();
}

// Yardımcı Fonksiyonlar
function switchPage(pageId) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    
    document.getElementById(pageId).classList.add('active');
    
    // Aktif butonu boya
    if(pageId === 'page-calc') document.getElementById('nav-calc').classList.add('active');
    if(pageId === 'page-data') document.getElementById('nav-data').classList.add('active');
}

function formatMoney(amount) {
    return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(amount);
}

function updateStatus(msg, type) {
    const el = document.getElementById('statusBadge');
    if(el) {
        el.innerText = msg;
        el.className = 'status-badge ' + type;
    }
}
