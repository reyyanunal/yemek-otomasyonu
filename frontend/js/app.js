let aktifKullanici = JSON.parse(localStorage.getItem('kullanici') || 'null');

const bildirimGoster = (mesaj, tip = 'basari') => {
    const el = document.getElementById('bildirim');
    el.textContent = mesaj;
    el.className = `bildirim ${tip}`;
    setTimeout(() => el.classList.add('gizli'), 4000);
};

const bakiyeGuncelleUI = (yeniBakiye) => {
    if (!aktifKullanici) return;
    aktifKullanici.bakiye = yeniBakiye;
    localStorage.setItem('kullanici', JSON.stringify(aktifKullanici));
    document.getElementById('kb-bakiye').textContent = `${Number(yeniBakiye).toFixed(2)} TL`;
    document.getElementById('bakiye-tutar').textContent = `${Number(yeniBakiye).toFixed(2)} TL`;
};

const arayuzuHazirla = () => {
    const girisEkrani = document.getElementById('giris-ekrani');
    const anaUygulama = document.getElementById('ana-uygulama');
    const kb = document.getElementById('kullanici-bilgi');
    const yonBtn = document.getElementById('yonetici-sekme-btn');

    if (aktifKullanici) {
        girisEkrani.classList.add('gizli');
        anaUygulama.classList.remove('gizli');
        kb.classList.remove('gizli');
        document.getElementById('kb-ad').textContent = `${aktifKullanici.ad} ${aktifKullanici.soyad} (${aktifKullanici.rol})`;
        bakiyeGuncelleUI(aktifKullanici.bakiye);
        yonBtn.classList.toggle('gizli', aktifKullanici.rol !== 'yonetici');
        gunlukMenuGetir();
    } else {
        girisEkrani.classList.remove('gizli');
        anaUygulama.classList.add('gizli');
        kb.classList.add('gizli');
    }
};

// 1. GİRİŞ & ÇIKIŞ
document.getElementById('giris-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const eposta = document.getElementById('giris-eposta').value;
    const sifre = document.getElementById('giris-sifre').value;

    const res = await fetch('/api/giris', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eposta, sifre })
    });
    const data = await res.json();
    if (!res.ok) return bildirimGoster(data.hata || 'Giriş başarısız.', 'hata');

    aktifKullanici = data.kullanici;
    localStorage.setItem('kullanici', JSON.stringify(aktifKullanici));
    bildirimGoster('Giriş başarılı.');
    arayuzuHazirla();
});

document.getElementById('cikis-btn').addEventListener('click', () => {
    aktifKullanici = null;
    localStorage.removeItem('kullanici');
    arayuzuHazirla();
});

// SEKME GEÇİŞLERİ
document.querySelectorAll('.sekme-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.sekme-btn').forEach((b) => b.classList.remove('aktif'));
        document.querySelectorAll('.sekme-icerik').forEach((s) => s.classList.add('gizli'));
        btn.classList.add('aktif');
        const hedef = btn.dataset.sekme;
        document.getElementById(`sekme-${hedef}`).classList.remove('gizli');

        if (hedef === 'haftalik') haftalikMenuGetir();
        if (hedef === 'rezervasyonlar') rezervasyonlariGetir();
        if (hedef === 'bakiye') bakiyeGetir();
        if (hedef === 'yonetici') yoneticiIstatistikGetir();
    });
});

// 2. GÜNÜN MENÜSÜ
const gunlukMenuGetir = async () => {
    const tarih = document.getElementById('gunluk-tarih').value || new Date().toISOString().slice(0, 10);
    const yemekhane_id = document.getElementById('gunluk-yemekhane').value;
    const ogun_id = document.getElementById('gunluk-ogun').value;
    const alan = document.getElementById('gunluk-sonuc');

    const res = await fetch(`/api/menuler/gunluk?tarih=${tarih}&yemekhane_id=${yemekhane_id}&ogun_id=${ogun_id}`);
    const data = await res.json();

    if (!res.ok) {
        alan.innerHTML = `<div class="oge-kart">${data.hata || 'Menü bulunamadı.'}</div>`;
        return;
    }

    const yemekler = data.yemekler || (Array.isArray(data) ? data : []);
    if (yemekler.length === 0) {
        alan.innerHTML = `<div class="oge-kart">Bu seçim için menü kaydı yok.</div>`;
        return;
    }

    const toplamKalori = data.toplam_kalori ?? yemekler.reduce((t, y) => t + (Number(y.kalori) || 0), 0);
    alan.innerHTML = `
        <div class="oge-kart">
            <div class="oge-baslik"><span>Toplam Kalori</span><span>${toplamKalori} kcal</span></div>
            ${yemekler.map((y) => `
                <div>• <strong>${y.yemek_adi || y.ad || ''}</strong> (${y.kalori || 0} kcal)
                ${y.vejetaryen ? ' [Vejetaryen]' : ''}
                ${y.alerjenler ? ` - Alerjen: ${y.alerjenler}` : ''}</div>
            `).join('')}
        </div>
    `;
};
document.getElementById('gunluk-getir-btn').addEventListener('click', gunlukMenuGetir);

// 3. HAFTALIK MENÜ VE REZERVASYON
const haftalikMenuGetir = async () => {
    const alan = document.getElementById('haftalik-sonuc');
    const tarih = document.getElementById('gunluk-tarih').value || new Date().toISOString().slice(0, 10);
    const res = await fetch(`/api/menuler/haftalik?tarih=${tarih}&rol=${aktifKullanici.rol}`);
    const data = await res.json();
    const liste = Array.isArray(data) ? data : (data.menuler || []);

    if (liste.length === 0) {
        alan.innerHTML = `<div class="oge-kart">${data.hata || 'Haftalık menü bulunamadı.'}</div>`;
        return;
    }

    alan.innerHTML = liste.map((m) => {
        const fiyat = m.fiyat ?? (aktifKullanici.rol === 'ogrenci' ? m.ogrenci_fiyati : m.personel_fiyati);
        const sonSaatGecti = m.rezervasyon_son ? new Date(m.rezervasyon_son) < new Date() : false;
        const pasif = m.pasif || sonSaatGecti || Number(m.bos_yer) <= 0;
        return `
            <div class="oge-kart">
                <div class="oge-baslik">
                    <span>#${m.menu_id || m.id} - ${m.yemekhane || ''} (${m.ogun || ''})</span>
                    <span>${fiyat ?? '-'} TL</span>
                </div>
                <div>Tarih: ${String(m.tarih || '').slice(0, 10)} | Boş Yer: ${m.bos_yer ?? '-'}</div>
                <button class="btn-birincil btn-kucuk" style="margin-top:8px" ${pasif ? 'disabled' : ''}
                    onclick="rezervasyonYap(${m.menu_id || m.id})">
                    ${pasif ? 'Süre Doldu / Dolu' : 'Rezervasyon Yap'}
                </button>
            </div>
        `;
    }).join('');
};
document.getElementById('haftalik-yenile-btn').addEventListener('click', haftalikMenuGetir);

window.rezervasyonYap = async (menu_id) => {
    const res = await fetch('/api/rezervasyonlar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kullanici_id: aktifKullanici.id, menu_id })
    });
    const data = await res.json();
    if (!res.ok) return bildirimGoster(data.hata || 'Rezervasyon yapılamadı.', 'hata');

    if (data.detay && data.detay.bakiye != null) bakiyeGuncelleUI(data.detay.bakiye);
    bildirimGoster(data.mesaj || 'Rezervasyon oluşturuldu.');
    haftalikMenuGetir();
};

// 4. REZERVASYONLARIM VE İPTAL
const rezervasyonlariGetir = async () => {
    const alan = document.getElementById('rez-sonuc');
    const res = await fetch(`/api/rezervasyonlar/kullanici/${aktifKullanici.id}`);
    const data = await res.json();
    const liste = Array.isArray(data) ? data : (data.rezervasyonlar || []);

    alan.innerHTML = liste.map((r) => `
        <div class="oge-kart">
            <div class="oge-baslik">
                <span>Rez #${r.rezervasyon_id || r.id} - ${r.yemekhane || ''} (${r.ogun || ''})</span>
                <span>Durum: ${r.durum}</span>
            </div>
            <div>Tarih: ${String(r.tarih || '').slice(0, 10)} | Ücret: ${r.ucret || '-'} TL</div>
            ${r.iptal_edilebilir ? `<button class="btn-tehlike btn-kucuk" style="margin-top:8px" onclick="rezervasyonIptal(${r.rezervasyon_id || r.id})">İptal Et</button>` : ''}
        </div>
    `).join('') || '<div class="oge-kart">Rezervasyonunuz bulunmuyor.</div>';
};
document.getElementById('rez-yenile-btn').addEventListener('click', rezervasyonlariGetir);

window.rezervasyonIptal = async (rezervasyon_id) => {
    const res = await fetch(`/api/rezervasyonlar/${rezervasyon_id}/iptal`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kullanici_id: aktifKullanici.id })
    });
    const data = await res.json();
    if (!res.ok) return bildirimGoster(data.hata || 'İptal edilemedi.', 'hata');

    if (data.detay && data.detay.bakiye != null) bakiyeGuncelleUI(data.detay.bakiye);
    bildirimGoster(data.mesaj || 'Rezervasyon iptal edildi.');
    rezervasyonlariGetir();
};

// 5. BAKİYE
const bakiyeGetir = async () => {
    const res = await fetch(`/api/bakiye/kullanici/${aktifKullanici.id}`);
    const data = await res.json();
    if (!res.ok) return;

    bakiyeGuncelleUI(data.guncel_bakiye);
    const alan = document.getElementById('bakiye-hareketler');
    alan.innerHTML = (data.hareket_gecmisi || []).map((h) => `
        <div class="oge-kart">
            <div class="oge-baslik"><span>${h.tur.toUpperCase()}</span><span>${h.tutar} TL</span></div>
            <div>${h.aciklama || ''} - ${String(h.olusturma).slice(0, 16).replace('T', ' ')}</div>
        </div>
    `).join('');
};

document.getElementById('bakiye-yukle-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const tutar = Number(document.getElementById('yukle-tutar').value);
    const res = await fetch('/api/bakiye/yukle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kullanici_id: aktifKullanici.id, tutar })
    });
    const data = await res.json();
    if (!res.ok) return bildirimGoster(data.hata || 'Yükleme başarısız.', 'hata');

    if (data.detay && data.detay.bakiye != null) bakiyeGuncelleUI(data.detay.bakiye);
    bildirimGoster(data.mesaj);
    document.getElementById('yukle-tutar').value = '';
    bakiyeGetir();
});

// 6. DEĞERLENDİRME
document.getElementById('degerlendirme-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const menu_id = Number(document.getElementById('deg-menu-id').value);
    const puan = Number(document.getElementById('deg-puan').value);
    const yorum = document.getElementById('deg-yorum').value;

    const res = await fetch('/api/degerlendirmeler', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kullanici_id: aktifKullanici.id, menu_id, puan, yorum })
    });
    const data = await res.json();
    if (!res.ok) return bildirimGoster(data.hata || 'Değerlendirme kaydedilemedi.', 'hata');

    bildirimGoster(data.mesaj);
    document.getElementById('deg-yorum').value = '';
});

document.getElementById('deg-getir-btn').addEventListener('click', async () => {
    const menu_id = document.getElementById('deg-sorgu-menu-id').value;
    if (!menu_id) return;
    const res = await fetch(`/api/degerlendirmeler/menu/${menu_id}`);
    const data = await res.json();
    const alan = document.getElementById('deg-sonuc');
    alan.innerHTML = `
        <div class="oge-kart"><strong>Ortalama Puan:</strong> ${data.ortalama_puan || '-'} (${data.oy_sayisi || 0} oy)</div>
        ${(data.yorumlar || []).map((y) => `
            <div class="oge-kart">
                <div class="oge-baslik"><span>${y.kullanici_adi}</span><span>${y.puan} / 5</span></div>
                <div>${y.yorum || 'Yorum yok.'}</div>
            </div>
        `).join('')}
    `;
});

// 7. YÖNETİCİ PANELİ
const yoneticiIstatistikGetir = async () => {
    const res = await fetch(`/api/yonetici/istatistikler?yonetici_id=${aktifKullanici.id}`);
    const data = await res.json();
    const alan = document.getElementById('yon-istatistik-sonuc');
    if (!res.ok) return alan.innerHTML = `<div class="oge-kart">${data.hata}</div>`;

    alan.innerHTML = (data.menuler || []).map((m) => `
        <div class="oge-kart">
            <div class="oge-baslik"><span>#${m.menu_id} ${m.yemekhane} (${m.ogun})</span><span>Doluluk: %${m.doluluk_yuzde}</span></div>
            <div>Rezerve: ${m.rezerve}/${m.kapasite} | Ortalama Puan: ${m.ortalama_puan || '-'} (${m.oy_sayisi} oy)</div>
        </div>
    `).join('');
};
document.getElementById('yon-istatistik-btn').addEventListener('click', yoneticiIstatistikGetir);

document.getElementById('yonetici-menu-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const menuId = document.getElementById('yon-menu-id').value;
    const yemekStr = document.getElementById('yon-yemekler').value.trim();
    const yemek_idleri = yemekStr ? yemekStr.split(',').map((s) => Number(s.trim())).filter(Boolean) : [];

    const body = {
        yonetici_id: aktifKullanici.id,
        yemekhane_id: Number(document.getElementById('yon-yemekhane').value),
        ogun_id: Number(document.getElementById('yon-ogun').value),
        tarih: document.getElementById('yon-tarih').value,
        ogrenci_fiyati: Number(document.getElementById('yon-ogrenci-fiyat').value),
        personel_fiyati: Number(document.getElementById('yon-personel-fiyat').value),
        yemek_idleri
    };

    const url = menuId ? `/api/yonetici/menuler/${menuId}` : '/api/yonetici/menuler';
    const method = menuId ? 'PUT' : 'POST';

    const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
    });
    const data = await res.json();
    if (!res.ok) return bildirimGoster(data.hata || 'İşlem başarısız.', 'hata');

    bildirimGoster(data.mesaj);
    yoneticiIstatistikGetir();
});

document.getElementById('gunluk-tarih').value = new Date().toISOString().slice(0, 10);
arayuzuHazirla();