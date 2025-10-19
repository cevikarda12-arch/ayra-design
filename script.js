// Utilities
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

const cart = [];

function updateCartUI() {
  const cartCount = $('#cartCount');
  const cartList = $('#cartList');
  cartCount.textContent = cart.length;
  cartList.innerHTML = '';
  if (cart.length === 0) {
    const li = document.createElement('li');
    li.textContent = 'Sepetiniz boş';
    cartList.appendChild(li);
  } else {
    cart.forEach((item, idx) => {
      const li = document.createElement('li');
      li.innerHTML = `<span>${item}</span>`;
      const rm = document.createElement('button');
      rm.type = 'button';
      rm.className = 'remove-btn';
      rm.textContent = 'Kaldır';
      rm.addEventListener('click', () => {
        cart.splice(idx, 1);
        updateCartUI();
      });
      li.appendChild(rm);
      cartList.appendChild(li);
    });
  }
}

function scrollToCheckout() {
  const el = document.getElementById('checkout');
  if (el) el.scrollIntoView({ behavior: 'smooth' });
}

function initHeroFade() {
  const heroContent = document.querySelector('.hero-content');
  const hero = document.getElementById('hero');
  function onScroll() {
    const rect = hero.getBoundingClientRect();
    const visible = Math.max(0, Math.min(1, rect.bottom / window.innerHeight));
    const opacity = Math.max(0, Math.min(1, visible));
    
    // 3D rotation effect - like paper rotating away
    const rotationX = (1 - opacity) * 90; // rotate around X axis
    const rotationY = (1 - opacity) * 15; // slight Y rotation for depth
    const translateZ = (1 - opacity) * -200; // move away from viewer
    const translateY = (1 - opacity) * 50; // subtle move up
    
    heroContent.style.opacity = String(opacity);
    heroContent.style.transform = `
      perspective(1000px) 
      rotateX(${rotationX}deg) 
      rotateY(${rotationY}deg) 
      translateZ(${translateZ}px) 
      translateY(-${translateY}px)
    `;
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}

function initChooser() {
  $$('.card').forEach(btn => {
    btn.addEventListener('click', () => {
      const item = btn.getAttribute('data-item');
      if (!item) return;
      cart.push(item);
      updateCartUI();
      scrollToCheckout();
    });
  });
}

function initCustomRequest() {
  const customInput = document.getElementById('customRequest');
  const addCustomBtn = document.getElementById('addCustomBtn');
  
  function addCustomItem() {
    const value = customInput.value.trim();
    if (value) {
      cart.push(value);
      updateCartUI();
      customInput.value = '';
      scrollToCheckout();
    }
  }
  
  // Enter tuşu ile ekleme
  customInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addCustomItem();
    }
  });
  
  // + butonuna tıklama ile ekleme
  addCustomBtn.addEventListener('click', addCustomItem);
}

function initCartControls() {
  const cartButton = document.getElementById('cartButton');
  const clearCart = document.getElementById('clearCart');
  cartButton.addEventListener('click', scrollToCheckout);
  clearCart.addEventListener('click', () => { cart.length = 0; updateCartUI(); });
}

function buildEmailBody(values) {
  const lines = [];
  lines.push('Yeni tasarım talebi');
  lines.push('');
  lines.push(`Ad Soyad: ${values.name}`);
  lines.push(`E-posta: ${values.email}`);
  lines.push(`Teslim süresi: ${values.deadline}`);
  if (values.budget) lines.push(`Bütçe: ${values.budget}`);
  lines.push('');
  lines.push('İstenilen hizmetler:');
  if (cart.length === 0) {
    lines.push('- (sepet boş)');
  } else {
    cart.forEach((c, i) => lines.push(`- ${i + 1}. ${c}`));
  }
  if (values.notes) {
    lines.push('');
    lines.push('Notlar:');
    lines.push(values.notes);
  }
  return lines.join('\n');
}

async function trySendWithEmailJS(values, statusEl) {
  // Read config from data attributes
  const form = document.getElementById('requestForm');
  const serviceId = form.getAttribute('data-emailjs-service') || '';
  const templateId = form.getAttribute('data-emailjs-template') || '';
  const publicKey = form.getAttribute('data-emailjs-public') || '';

  if (!serviceId || !templateId || !publicKey || typeof window.emailjs === 'undefined') {
    return false;
  }

  try {
    window.emailjs.init({ publicKey });
    const templateParams = {
      to_email: 'ayradesign20@gmail.com',
      from_name: values.name,
      reply_to: values.email,
      deadline: values.deadline,
      budget: values.budget || '-',
      notes: values.notes || '-',
      items: cart.join(', '),
      message: buildEmailBody(values)
    };
    await window.emailjs.send(serviceId, templateId, templateParams);
    statusEl.textContent = 'Talebiniz alındı. E-posta ile iletildi. Teşekkürler!';
    return true;
  } catch (err) {
    console.error(err);
    return false;
  }
}

function sendViaMailto(values) {
  const subject = encodeURIComponent('Yeni Tasarım Talebi - Ayra');
  const body = encodeURIComponent(buildEmailBody(values));
  const to = 'ayradesign20@gmail.com';
  const href = `mailto:${to}?subject=${subject}&body=${body}`;
  window.location.href = href;
}

function initForm() {
  const form = document.getElementById('requestForm');
  const statusEl = document.getElementById('formStatus');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    statusEl.textContent = 'Gönderiliyor...';

    const formData = new FormData(form);
    const values = Object.fromEntries(formData.entries());

    // Try EmailJS, fallback to mailto
    const ok = await trySendWithEmailJS(values, statusEl);
    if (!ok) {
      sendViaMailto(values);
      statusEl.textContent = 'E-posta istemciniz açıldı. Eğer açılmadıysa lütfen manuel olarak e-posta gönderin.';
    }
  });
}

function initFooterYear() {
  const y = document.getElementById('year');
  y.textContent = String(new Date().getFullYear());
}

// Ödeme Fonksiyonları
function payWithPayPal() {
  // PayPal Business hesabınızın e-posta adresini buraya yazın
  const paypalEmail = 'ayradesign20@gmail.com';
  
  // Sepet toplamını hesapla (örnek fiyatlandırma)
  const totalAmount = calculateTotal();
  
  // PayPal URL oluştur
  const paypalUrl = `https://www.paypal.com/paypalme/${paypalEmail}/${totalAmount}TL`;
  
  // Yeni sekmede PayPal'ı aç
  window.open(paypalUrl, '_blank');
  
  // Kullanıcıya bilgi ver
  alert(`PayPal ödeme sayfası açıldı. Ödeme tutarı: ${totalAmount} TL`);
}

function showBankInfo() {
  const bankInfo = `
🏦 BANKA BİLGİLERİ:

Banka: [Banka Adınız]
Şube: [Şube Adınız]
Hesap Adı: Ayra Design
IBAN: TR00 0000 0000 0000 0000 0000 00

📝 Açıklama: Tasarım hizmeti ödemesi

💰 Ödeme tutarı: ${calculateTotal()} TL

Ödeme yaptıktan sonra dekontu ayradesign20@gmail.com adresine gönderin.
  `;
  
  alert(bankInfo);
}

function calculateTotal() {
  // Basit fiyatlandırma sistemi
  const prices = {
    'Logo': 500,
    'Banner': 300,
    'Afiş': 400,
    'Kartvizit': 200,
    'Sosyal Medya Postu': 150,
    'Web Tasarım': 2000
  };
  
  let total = 0;
  cart.forEach(item => {
    if (prices[item]) {
      total += prices[item];
    } else {
      // Özel istekler için varsayılan fiyat
      total += 300;
    }
  });
  
  return total || 0;
}

// Init
document.addEventListener('DOMContentLoaded', () => {
  initHeroFade();
  initChooser();
  initCustomRequest();
  initCartControls();
  initForm();
  initFooterYear();
  updateCartUI();
});
