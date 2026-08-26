gsap.registerPlugin(ScrollTrigger);

/* Custom cursor */
const cursor = document.getElementById('cursor');
let mx=0,my=0,cx=0,cy=0;
window.addEventListener('mousemove', e=>{ mx=e.clientX; my=e.clientY; });
document.querySelectorAll('.magnetic, .g-tile, .menu-tab, button, a').forEach(el=>{
  el.addEventListener('mouseenter', ()=>cursor.classList.add('grow'));
  el.addEventListener('mouseleave', ()=>cursor.classList.remove('grow'));
});
(function loop(){
  cx += (mx-cx)*0.18; cy += (my-cy)*0.18;
  cursor.style.transform = `translate(${cx}px, ${cy}px) translate(-50%,-50%)`;
  requestAnimationFrame(loop);
})();

/* Magnetic buttons */
function wireMagnetic(el){
  el.addEventListener('mousemove', e=>{
    const r = el.getBoundingClientRect();
    const relX = e.clientX - r.left - r.width/2;
    const relY = e.clientY - r.top - r.height/2;
    gsap.to(el, { x: relX*0.3, y: relY*0.4, duration:0.3, ease:'power2.out' });
  });
  el.addEventListener('mouseleave', ()=>{
    gsap.to(el, { x:0, y:0, duration:0.5, ease:'elastic.out(1,0.4)' });
  });
}
document.querySelectorAll('.magnetic').forEach(wireMagnetic);

/* Hero intro timeline */
const tl = gsap.timeline({ defaults:{ ease:'power3.out' } });
tl.from('#heroBrand', { opacity:0, y:24, duration:0.6 })
  .from('.hero-title .inner', { yPercent:120, duration:0.9, stagger:0.1 }, '-=0.2')
  .from('#stickerEl', { opacity:0, rotate:-16, y:-20, duration:0.6 }, 0.15)
  .from('#heroSub', { opacity:0, y:16, duration:0.6 }, '-=0.5')
  .from('#heroCtas', { opacity:0, y:16, duration:0.6 }, '-=0.4')
  .from('#heroStrip', { opacity:0, y:16, duration:0.6 }, '-=0.4')
  .from('.photo-orbit', { opacity:0, scale:0.8, duration:0.8 }, 0.4);

/* Hero photo build-in + tilt */
gsap.from('#burger3d', { opacity:0, scale:0.85, rotateY:-20, duration:1, delay:0.5, ease:'power3.out' });
gsap.from('.photo-sticker', { opacity:0, scale:0.5, rotate:20, duration:0.6, delay:1.3, ease:'back.out(2)' });

const burger3d = document.getElementById('burger3d');
const scene = document.querySelector('.burger-scene');
scene.addEventListener('mousemove', e=>{
  const r = scene.getBoundingClientRect();
  const px = (e.clientX - r.left)/r.width - 0.5;
  const py = (e.clientY - r.top)/r.height - 0.5;
  gsap.to(burger3d, { rotateY: px*24, rotateX: -py*18, duration:0.6, ease:'power2.out' });
});
scene.addEventListener('mouseleave', ()=>{
  gsap.to(burger3d, { rotateY:0, rotateX:0, duration:0.8, ease:'elastic.out(1,0.5)' });
});
gsap.to(burger3d, { rotateY:5, duration:3, yoyo:true, repeat:-1, ease:'sine.inOut', delay:2 });

/* Nav pill indicator */
const navListEl = document.getElementById('navList');
const navLinks = document.querySelectorAll('nav a');

function movePill(target){
  if(!target) return;
  const pill = document.getElementById('navPill');
  const li = target.closest('li');
  const y = Math.max(0, (navListEl.clientHeight - target.offsetHeight) / 2);
  gsap.to(pill, {
    x: li.offsetLeft,
    y,
    width: target.offsetWidth,
    height: target.offsetHeight,
    duration: 0.35,
    ease: 'power3.out'
  });
}

function setNavOver(link){
  navLinks.forEach(a => a.classList.remove('is-over'));
  if(link) link.classList.add('is-over');
}

window.addEventListener('load', ()=>{
  const activeLink = document.querySelector('nav a.active');
  movePill(activeLink);
  animateReveals(document.getElementById('accueil'));
});
window.addEventListener('resize', ()=>{
  movePill(document.querySelector('nav a.is-over') || document.querySelector('nav a.active'));
});

/* Page navigation with transition */
function goTo(page){
  const current = document.querySelector('.page.active');
  const next = document.getElementById(page);
  if(current === next) return;

  gsap.to(current, { opacity:0, y:-16, duration:0.3, onComplete:()=>{
    current.classList.remove('active');
    current.style.opacity=''; current.style.transform='';
    next.classList.add('active');
    gsap.fromTo(next, { opacity:0, y:16 }, { opacity:1, y:0, duration:0.4 });
    ScrollTrigger.refresh();
    animateReveals(next);
  }});

  navLinks.forEach(a=>a.classList.remove('active'));
  const link = document.querySelector(`nav a[data-page="${page}"]`);
  link.classList.add('active');
  setNavOver(link);
  movePill(link);
  window.scrollTo({top:0, behavior:'smooth'});
}
navLinks.forEach(a=>{
  a.addEventListener('click', e=>{ e.preventDefault(); goTo(a.dataset.page); });
  a.addEventListener('mouseenter', ()=>{
    setNavOver(a);
    movePill(a);
  });
});
navListEl.addEventListener('mouseleave', ()=>{
  const active = document.querySelector('nav a.active');
  setNavOver(null);
  movePill(active);
});

/* Scroll reveals (also run manually on page switch since content is display:none) */
function animateReveals(container){
  const items = container.querySelectorAll('.reveal');
  gsap.fromTo(items, { opacity:0, y:26 }, { opacity:1, y:0, duration:0.6, stagger:0.08, ease:'power2.out' });
  const favCards = container.querySelectorAll('.fav-card');
  if(favCards.length){
    gsap.fromTo(favCards, { opacity:0, y:24, scale:0.95 }, { opacity:1, y:0, scale:1, duration:0.5, stagger:0.05, ease:'power2.out' });
  }
  const orderItems = container.querySelectorAll('.order-item');
  if(orderItems.length){
    gsap.fromTo(orderItems, { opacity:0, y:18 }, { opacity:1, y:0, duration:0.45, stagger:0.04, ease:'power2.out' });
  }
  const homeBits = container.querySelectorAll('.home-service, .highlight-card, .home-flow-step');
  if(homeBits.length){
    gsap.fromTo(homeBits, { opacity:0, y:22 }, { opacity:1, y:0, duration:0.45, stagger:0.06, ease:'power2.out' });
  }
  const aboutBits = container.querySelectorAll('.about-stat, .about-value, .about-mosaic-main, .about-mosaic-tile');
  if(aboutBits.length){
    gsap.fromTo(aboutBits, { opacity:0, y:22 }, { opacity:1, y:0, duration:0.5, stagger:0.06, ease:'power2.out' });
  }
  const contactBits = container.querySelectorAll('.contact-quick-card, .contact-info, .contact-form-card, .contact-map');
  if(contactBits.length){
    gsap.fromTo(contactBits, { opacity:0, y:20 }, { opacity:1, y:0, duration:0.45, stagger:0.06, ease:'power2.out' });
  }
  const tiles = container.querySelectorAll('.g-tile');
  if(tiles.length){ gsap.fromTo(tiles, { opacity:0, scale:0.85 }, { opacity:1, scale:1, duration:0.5, stagger:0.06, ease:'back.out(1.5)' }); }
}

/* Gallery 3D tilt on hover (compat, si des tuiles galerie existent encore) */
document.querySelectorAll('.g-tile').forEach(tile=>{
  tile.addEventListener('mousemove', e=>{
    const r = tile.getBoundingClientRect();
    const px = (e.clientX - r.left)/r.width - 0.5;
    const py = (e.clientY - r.top)/r.height - 0.5;
    gsap.to(tile, { rotateY: px*22, rotateX: -py*22, scale:1.05, duration:0.3, ease:'power2.out', transformPerspective:600 });
  });
  tile.addEventListener('mouseleave', ()=>{
    gsap.to(tile, { rotateY:0, rotateX:0, scale:1, duration:0.5, ease:'power3.out' });
  });
});

/* Mobile nav */
const navToggle = document.getElementById('navToggle');
const navList = document.getElementById('navList');
navToggle.addEventListener('click', ()=>{
  const open = navList.style.display === 'flex';
  navList.style.display = open ? 'none' : 'flex';
  navList.style.flexDirection='column';
  navList.style.position='absolute';
  navList.style.top='60px'; navList.style.right='24px';
  navList.style.background='#1B1522';
  navList.style.border='1px solid rgba(251,243,231,0.12)';
  navList.style.borderRadius='14px';
  navList.style.padding='10px'; navList.style.gap='4px';
});

/* Contact form (demo only — pas de backend connecté) */
const contactForm = document.getElementById('contactForm');
if(contactForm){
  contactForm.addEventListener('submit', e=>{
    e.preventDefault();
    const note = document.getElementById('formNote');
    const data = new FormData(contactForm);
    const subject = data.get('subject') || 'message';
    note.classList.add('is-success');
    note.textContent = `Message envoyé ✓ (${subject}) — on te répond très vite.`;
    gsap.fromTo(note, { opacity:0, y:8 }, { opacity:1, y:0, duration:0.4 });
    gsap.fromTo(contactForm, { boxShadow:'0 0 0 rgba(107,203,119,0)' }, { boxShadow:'0 0 28px rgba(107,203,119,0.25)', duration:0.4, yoyo:true, repeat:1 });
    contactForm.reset();
  });
}

/* ============ MENU DATA ============ */
const MENU_IMGS = {
  burgers: 'images/6c970db3dc2c5aeae885a0c89b22db9a.jpg',
  sandwichs: 'images/6506fbf5f37817d960e0fb4d937035c7.jpg',
  salades: 'images/6506fbf5f37817d960e0fb4d937035c7.jpg',
  bols: 'images/31e9acf8abd1794aded0c4c3989071f5.jpg',
  desserts: 'images/31e9acf8abd1794aded0c4c3989071f5.jpg',
  boissons: 'images/image.png',
};
let MENU_DATA = [
  { id:'k1', cat:'burgers', name:'Le Kassoumaï', price:3500, desc:'Double smash steak, cheddar fondu, sauce maison.', tags:['bestseller'], weight:'320 g', brand:'Esamaï Smash', stock:50 },
  { id:'k2', cat:'burgers', name:'Le Mamelles', price:3000, desc:'Poulet pané croustillant, coleslaw, sauce piquante.', tags:['spicy'], weight:'300 g', brand:'Esamaï Smash', stock:50 },
  { id:'k3', cat:'burgers', name:'Le Classique', price:2500, desc:'Steak, salade, tomate, oignons, sauce burger.', tags:[], weight:'280 g', brand:'Esamaï Smash', stock:50 },
  { id:'k4', cat:'burgers', name:'Le Végétarien', price:3000, desc:'Galette de légumes grillée, cheddar, sauce maison.', tags:['veggie'], weight:'270 g', brand:'Esamaï Smash', stock:40 },
  { id:'s1', cat:'sandwichs', name:'Poulet Braisé', price:2500, desc:'Poulet braisé, oignons caramélisés, sauce maison.', tags:['bestseller'], weight:'290 g', brand:'Sandwich House', stock:50 },
  { id:'s2', cat:'sandwichs', name:'Merguez', price:2000, desc:'Merguez grillées, poivrons, harissa douce.', tags:['spicy'], weight:'260 g', brand:'Sandwich House', stock:50 },
  { id:'s3', cat:'sandwichs', name:'Thon Mayo', price:2200, desc:'Thon, mayo maison, crudités fraîches.', tags:[], weight:'250 g', brand:'Sandwich House', stock:50 },
  { id:'sa1', cat:'salades', name:'César Poulet', price:2800, desc:'Romaine, poulet grillé, parmesan, croûtons.', tags:[], weight:'340 g', brand:'Fresh Bowl', stock:40 },
  { id:'sa2', cat:'salades', name:'Salade Fraîcheur', price:2600, desc:'Avocat, tomate, mozzarella, vinaigrette.', tags:['veggie'], weight:'320 g', brand:'Fresh Bowl', stock:40 },
  { id:'b1', cat:'bols', name:'Bowl Poulet Teriyaki', price:3200, desc:'Riz, poulet teriyaki, légumes, sésame.', tags:['bestseller'], weight:'420 g', brand:'Bowl Lab', stock:40 },
  { id:'b2', cat:'bols', name:'Bowl Falafel', price:2900, desc:'Falafels, houmous, légumes, sauce yaourt.', tags:['veggie'], weight:'400 g', brand:'Bowl Lab', stock:40 },
  { id:'b3', cat:'bols', name:'Bowl Bœuf Épicé', price:3400, desc:'Bœuf épicé, riz, oignons croustillants.', tags:['spicy'], weight:'430 g', brand:'Bowl Lab', stock:40 },
  { id:'d1', cat:'desserts', name:'Gaufre Caramel', price:1500, desc:'Gaufre moelleuse, caramel beurre salé.', tags:['bestseller'], weight:'180 g', brand:'Sweet Spot', stock:60 },
  { id:'d2', cat:'desserts', name:'Cookie Choco', price:1000, desc:'Cookie moelleux aux pépites de chocolat.', tags:['veggie'], weight:'90 g', brand:'Sweet Spot', stock:60 },
  { id:'d3', cat:'desserts', name:'Brownie', price:1200, desc:'Brownie fondant, éclats de noix.', tags:['veggie'], weight:'110 g', brand:'Sweet Spot', stock:60 },
  { id:'bo1', cat:'boissons', name:'Calypso Ocean Blue', price:1000, desc:'Boisson rafraîchissante citronnade.', tags:['veggie'], weight:'50 cl', brand:'Drink Bar', stock:100 },
  { id:'bo2', cat:'boissons', name:'Tropico', price:800, desc:'Jus de fruits pétillant.', tags:['veggie'], weight:'33 cl', brand:'Drink Bar', stock:100 },
  { id:'bo3', cat:'boissons', name:'Jus de Bissap Maison', price:1000, desc:'Bissap frais préparé maison.', tags:['veggie'], weight:'40 cl', brand:'Drink Bar', stock:100 },
  { id:'bo4', cat:'boissons', name:'Eau Minérale', price:500, desc:'Eau minérale 50cl.', tags:['veggie'], weight:'50 cl', brand:'Drink Bar', stock:100 },
];
const CATS = [
  { id:'all', label:'Tous', icon:'✨' },
  { id:'burgers', label:'Burgers', icon:'🍔' },
  { id:'sandwichs', label:'Sandwichs', icon:'🥪' },
  { id:'salades', label:'Salades', icon:'🥗' },
  { id:'bols', label:'Bols', icon:'🍜' },
  { id:'desserts', label:'Desserts', icon:'🧇' },
  { id:'boissons', label:'Boissons', icon:'🥤' },
];
const TAG_LABELS = { bestseller:'🔥 Best', veggie:'🌱 Végé', spicy:'🌶️ Spicy' };
const WHATSAPP_NUMBER = (window.ESAMAI_CONFIG && window.ESAMAI_CONFIG.whatsappNumber) || '221786882655';

let activeCat = 'all';
let cart = {};
let backendReady = false;

function productImage(item){
  return item.image || MENU_IMGS[item.cat] || MENU_IMGS.burgers;
}

function fmtPrice(p){ return p.toLocaleString('fr-FR') + ' F'; }

function dietMeta(tags){
  if(tags.includes('veggie')) return { cls:'veggie', icon:'🌱', title:'Végétarien' };
  if(tags.includes('spicy')) return { cls:'spicy', icon:'🌶️', title:'Épicé' };
  if(tags.includes('bestseller')) return { cls:'bestseller', icon:'★', title:'Best-seller' };
  return { cls:'meat', icon:'●', title:'Viande' };
}

function addToCart(id, btn){
  const item = MENU_DATA.find(m => m.id === id);
  if(!item) return;
  const nextQty = (cart[id] || 0) + 1;
  if(typeof item.stock === 'number' && nextQty > item.stock){
    if(btn){
      const prev = btn.textContent;
      btn.textContent = 'Rupture';
      setTimeout(()=>{ btn.textContent = prev || 'Ajouter'; }, 1000);
    }
    return;
  }
  cart[id] = nextQty;
  renderCart();
  if(btn){
    btn.classList.add('added');
    btn.textContent = 'Ajouté ✓';
    gsap.fromTo(btn, { scale:0.9 }, { scale:1, duration:0.35, ease:'back.out(2)' });
    setTimeout(()=>{
      btn.classList.remove('added');
      btn.textContent = 'Ajouter';
    }, 1100);
  }
}

function renderMenuPage(animate = true){
  const tabsEl = document.getElementById('menuTabs');
  const gridsEl = document.getElementById('menuGrids');
  if(!tabsEl || !gridsEl) return;

  tabsEl.innerHTML = CATS.map(c => `
    <button class="fav-cat${c.id===activeCat?' active':''}" data-cat="${c.id}" type="button">
      <span class="fav-ico">${c.icon}</span>
      <span>${c.label}</span>
    </button>`).join('');

  const items = MENU_DATA.filter(m => activeCat==='all' || m.cat === activeCat);
  gridsEl.innerHTML = items.length ? items.map(m => {
    const diet = dietMeta(m.tags);
    const img = productImage(m);
    return `
      <article class="fav-card">
        <div class="fav-card-meta">
          <span class="fav-weight">${m.weight}</span>
          <span class="fav-diet ${diet.cls}" title="${diet.title}">${diet.icon}</span>
        </div>
        <div class="fav-media">
          <img src="${img}" alt="${m.name}" loading="lazy" width="264" height="264">
        </div>
        <h3 class="fav-name">${m.name}</h3>
        <p class="fav-sub">${m.brand} · ${m.desc}${typeof m.stock==='number' ? ` · Stock ${m.stock}` : ''}</p>
        <div class="fav-bottom">
          <span class="fav-price">${fmtPrice(m.price)}</span>
          <button class="fav-add magnetic" type="button" data-id="${m.id}">Ajouter</button>
        </div>
      </article>`;
  }).join('') : `<p class="fav-empty">Aucun plat dans cette catégorie pour l’instant.</p>`;

  tabsEl.querySelectorAll('.fav-cat').forEach(tab=>{
    tab.addEventListener('click', ()=>{
      if(activeCat === tab.dataset.cat) return;
      activeCat = tab.dataset.cat;
      renderMenuPage(true);
    });
  });

  gridsEl.querySelectorAll('.fav-add').forEach(btn=>{
    btn.addEventListener('mouseenter', ()=>cursor.classList.add('grow'));
    btn.addEventListener('mouseleave', ()=>cursor.classList.remove('grow'));
    wireMagnetic(btn);
    btn.addEventListener('click', ()=> addToCart(btn.dataset.id, btn));
  });

  if(animate){
    const cards = gridsEl.querySelectorAll('.fav-card');
    gsap.fromTo(cards,
      { opacity:0, y:28, scale:0.94 },
      { opacity:1, y:0, scale:1, duration:0.45, stagger:0.05, ease:'power2.out' }
    );
  }
}

renderMenuPage(false);

/* ============ CART / COMMANDER ============ */
let orderCat = 'all';

function cartCount(){
  return Object.values(cart).reduce((s, n) => s + (n > 0 ? n : 0), 0);
}

function renderOrderCatBar(){
  const bar = document.getElementById('orderCatBar');
  if(!bar) return;
  bar.innerHTML = CATS.map(c => `
    <button type="button" class="order-cat-btn${c.id===orderCat?' active':''}" data-cat="${c.id}">
      ${c.icon || ''} ${c.label}
    </button>`).join('');
  bar.querySelectorAll('.order-cat-btn').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      orderCat = btn.dataset.cat;
      renderOrderCatBar();
      renderOrderList(true);
    });
  });
}

function renderOrderList(animate = false){
  const el = document.getElementById('orderList');
  if(!el) return;
  const items = MENU_DATA.filter(m => orderCat === 'all' || m.cat === orderCat);
  el.innerHTML = items.map(m => {
    const img = productImage(m);
    const qty = cart[m.id] || 0;
    return `
      <article class="order-item" data-id="${m.id}">
        <img class="order-item-img" src="${img}" alt="${m.name}" loading="lazy" width="144" height="144">
        <div>
          <div class="order-item-name">${m.name}</div>
          <p class="order-item-desc">${m.desc}${typeof m.stock==='number' ? ` · Stock ${m.stock}` : ''}</p>
          <div class="order-item-price">${fmtPrice(m.price)}</div>
        </div>
        <div class="order-item-actions">
          <button class="add-btn magnetic" type="button" data-id="${m.id}" aria-label="Ajouter ${m.name}">+</button>
          <span class="order-qty-badge${qty?' show':''}" data-badge="${m.id}">${qty || ''}</span>
        </div>
      </article>`;
  }).join('') || `<p class="fav-empty">Aucun plat dans cette catégorie.</p>`;

  el.querySelectorAll('.add-btn').forEach(btn=>{
    btn.addEventListener('mouseenter', ()=>cursor.classList.add('grow'));
    btn.addEventListener('mouseleave', ()=>cursor.classList.remove('grow'));
    wireMagnetic(btn);
    btn.addEventListener('click', ()=>{
      addToCart(btn.dataset.id);
      gsap.fromTo(btn, { scale:1.25, rotate:15 }, { scale:1, rotate:0, duration:0.35, ease:'back.out(3)' });
      const panel = document.getElementById('cartPanel');
      if(panel) gsap.fromTo(panel, { boxShadow:'0 0 0 rgba(255,90,31,0)' }, { boxShadow:'0 0 36px rgba(255,90,31,0.35)', duration:0.35, yoyo:true, repeat:1 });
    });
  });

  if(animate){
    gsap.fromTo(el.querySelectorAll('.order-item'),
      { opacity:0, y:18 },
      { opacity:1, y:0, duration:0.4, stagger:0.04, ease:'power2.out' }
    );
  }
}

function updateOrderBadges(){
  document.querySelectorAll('.order-qty-badge').forEach(badge=>{
    const id = badge.dataset.badge;
    const qty = cart[id] || 0;
    badge.textContent = qty || '';
    badge.classList.toggle('show', qty > 0);
  });
}

function renderCart(){
  const itemsEl = document.getElementById('cartItems');
  const totalEl = document.getElementById('cartTotal');
  const countEl = document.getElementById('cartCount');
  const waBtn = document.getElementById('whatsappOrderBtn');
  if(!itemsEl || !totalEl || !waBtn) return;

  const ids = Object.keys(cart).filter(id => cart[id] > 0);
  const count = cartCount();
  if(countEl){
    countEl.textContent = String(count);
    gsap.fromTo(countEl, { scale:1.25 }, { scale:1, duration:0.3, ease:'back.out(2)' });
  }
  updateOrderBadges();

  if(!ids.length){
    itemsEl.innerHTML = `
      <div class="cart-empty-state">
        <div class="cart-empty-ico">🛒</div>
        <p>Ton panier est vide</p>
        <span>Ajoute un plat pour commencer</span>
      </div>`;
    totalEl.textContent = '0 F';
    waBtn.classList.add('is-disabled');
    return;
  }

  waBtn.classList.remove('is-disabled');
  let total = 0;
  itemsEl.innerHTML = ids.map(id => {
    const item = MENU_DATA.find(m => m.id === id);
    const qty = cart[id];
    const lineTotal = item.price * qty;
    total += lineTotal;
    const img = productImage(item);
    return `
      <div class="cart-line">
        <img class="cart-line-img" src="${img}" alt="" width="96" height="96">
        <div class="cart-line-info">
          <div class="cart-line-name">${item.name}</div>
          <div class="cart-line-sub">${fmtPrice(lineTotal)}</div>
        </div>
        <div class="cart-line-qty">
          <button class="qty-btn" type="button" data-id="${id}" data-action="minus" aria-label="Retirer">−</button>
          <span>${qty}</span>
          <button class="qty-btn" type="button" data-id="${id}" data-action="plus" aria-label="Ajouter">+</button>
        </div>
      </div>`;
  }).join('');
  totalEl.textContent = fmtPrice(total);

  gsap.fromTo(itemsEl.querySelectorAll('.cart-line'),
    { opacity:0, x:10 },
    { opacity:1, x:0, duration:0.3, stagger:0.04, ease:'power2.out' }
  );

  itemsEl.querySelectorAll('.qty-btn').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const id = btn.dataset.id;
      const item = MENU_DATA.find(m => m.id === id);
      if(btn.dataset.action === 'plus'){
        const next = (cart[id] || 0) + 1;
        if(item && typeof item.stock === 'number' && next > item.stock) return;
        cart[id] = next;
      } else {
        cart[id] = Math.max(0, cart[id]-1);
      }
      renderCart();
    });
  });
}

function buildWhatsAppMessage(orderId){
  const ids = Object.keys(cart).filter(id => cart[id] > 0);
  let total = 0;
  const lines = ['Bonjour Esamaï 👋 Je souhaite commander :'];
  if(orderId) lines.unshift(`Commande #${String(orderId).slice(0, 8)}`);
  ids.forEach(id => {
    const item = MENU_DATA.find(m => m.id === id);
    const qty = cart[id];
    const lineTotal = item.price * qty;
    total += lineTotal;
    lines.push(`• ${item.name} x${qty} — ${fmtPrice(lineTotal)}`);
  });
  lines.push(`\nTotal estimé : ${fmtPrice(total)}`);
  return lines.join('\n');
}

function setCartStatus(msg, type){
  const el = document.getElementById('cartStatus');
  if(!el) return;
  el.textContent = msg || '';
  el.classList.remove('is-error', 'is-ok');
  if(type) el.classList.add(type);
}

async function submitOrder(){
  const ids = Object.keys(cart).filter(id => cart[id] > 0);
  if(!ids.length) return;

  const waBtn = document.getElementById('whatsappOrderBtn');
  const name = document.getElementById('cartCustomerName')?.value?.trim() || '';
  const phone = document.getElementById('cartCustomerPhone')?.value?.trim() || '';

  const openWhatsApp = (orderId) => {
    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(buildWhatsAppMessage(orderId))}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  if(!window.EsamiApi || !EsamiApi.isReady()){
    setCartStatus('Mode local : commande non enregistrée en base.', 'is-error');
    openWhatsApp(null);
    return;
  }

  waBtn.classList.add('is-disabled');
  waBtn.textContent = 'Enregistrement...';
  setCartStatus('Enregistrement de la commande...', null);

  try{
    const items = ids.map(id => ({ id, qty: cart[id] }));
    const orderId = await EsamiApi.placeOrder({
      items,
      customerName: name,
      customerPhone: phone,
      note: 'Commande site web'
    });
    setCartStatus(`Commande enregistrée ✓ (#${String(orderId).slice(0, 8)})`, 'is-ok');
    openWhatsApp(orderId);
    // refresh stock from DB
    const products = await EsamiApi.fetchProducts();
    if(products?.length){
      MENU_DATA = products;
      renderMenuPage(false);
      renderOrderList(false);
    }
    cart = {};
    renderCart();
  } catch (err){
    console.error(err);
    setCartStatus(err.message || 'Erreur lors de la commande', 'is-error');
  } finally {
    waBtn.classList.remove('is-disabled');
    waBtn.textContent = 'Commander via WhatsApp';
  }
}

document.getElementById('clearCartBtn')?.addEventListener('click', ()=>{
  cart = {};
  renderCart();
  setCartStatus('');
  gsap.fromTo('#cartPanel', { opacity:0.7 }, { opacity:1, duration:0.35 });
});

document.getElementById('whatsappOrderBtn')?.addEventListener('click', (e)=>{
  e.preventDefault();
  submitOrder();
});

async function initCatalog(){
  renderOrderCatBar();
  renderMenuPage(false);
  renderOrderList();
  renderCart();

  if(!window.EsamiApi || !EsamiApi.isReady()){
    console.info('Esamaï: Supabase non configuré — menu local utilisé');
    return;
  }
  try{
    const products = await EsamiApi.fetchProducts();
    if(products?.length){
      MENU_DATA = products;
      backendReady = true;
      renderMenuPage(false);
      renderOrderList(false);
      renderCart();
      console.info('Esamaï: menu chargé depuis Supabase');
    }
  } catch (err){
    console.warn('Esamaï: fallback menu local', err);
  }
}

initCatalog();

const footerYear = document.getElementById('footerYear');
if(footerYear) footerYear.textContent = new Date().getFullYear();
