const PRODUCTS_URL = 'data/products.json';
let currentLang = localStorage.getItem('mufti_lang') || 'en';
let translations = {};

async function loadTranslations() {
  try {
    const res = await fetch('data/translations.json');
    translations = await res.json();
    applyTranslations();
  } catch (err) {
    console.error("Failed to load translations:", err);
  }
}

function applyTranslations() {
  const dict = translations[currentLang];
  if (!dict || Object.keys(dict).length === 0) return;

  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (dict[key]) {
      el.innerText = dict[key];
    }
  });

  document.documentElement.lang = currentLang;
  document.documentElement.dir = currentLang === 'ar' ? 'rtl' : 'ltr';
  document.body.classList.toggle('rtl', currentLang === 'ar');

  // Trigger content refreshes
  renderFeatured();
  renderProductsGrid();
}

async function changeLanguage(lang) {
  currentLang = lang;
  localStorage.setItem('mufti_lang', lang);
  applyTranslations();
  await renderFeatured();
  await renderProductsGrid();
  
  const sidebar = document.getElementById('site-sidebar');
  if (window.innerWidth < 900 && sidebar) {
    sidebar.classList.remove('open');
    document.body.classList.remove('sidebar-open');
  }
}

async function fetchProducts(){
  const res = await fetch(PRODUCTS_URL);
  return res.json();
}

async function renderFeatured(){
  const container = document.getElementById('featured-grid');
  if(!container) return;
  try {
    const products = await fetchProducts();
    const featured = products.slice(0,4);
    container.innerHTML = featured.map(product=>{
      const title = currentLang === 'en' ? product.title : (product[`title_${currentLang}`] || product.title);
      const desc = currentLang === 'en' ? product.description : (product[`description_${currentLang}`] || product.description);
      const detailsText = translations[currentLang]?.details || 'Details';
      return `<article class="card">
        <img src="${product.image}" alt="${title}">
        <div class="card-body">
          <h4 class="card-title">${title}</h4>
          <p class="small">${desc}</p>
          <div style="margin-top:.5rem">
            <button class="btn btn-sm" onclick="openModal(${product.id})">${detailsText}</button>
          </div>
        </div>
      </article>`;
    }).join('');
    observeNewElements('#featured-grid');
  } catch (err) { console.error("Featured failed:", err); }
}

async function renderProductsGrid(){
  const container = document.getElementById('products-grid');
  if(!container) return;
  try {
    const products = await fetchProducts();
    container.innerHTML = products.map(product=>{
      const title = currentLang === 'en' ? product.title : (product[`title_${currentLang}`] || product.title);
      const desc = currentLang === 'en' ? product.description : (product[`description_${currentLang}`] || product.description);
      const detailsText = translations[currentLang]?.details || 'Details';
      return `<article class="card" id="p${product.id}">
        <img src="${product.image}" alt="${title}">
        <div class="card-body">
          <h4 class="card-title">${title}</h4>
          <p class="small">${desc}</p>
          <div style="margin-top:.5rem">
            <button class="btn btn-sm" onclick="openModal(${product.id})">${detailsText}</button>
          </div>
        </div>
      </article>`;
    }).join('');
    observeNewElements('#products-grid');
  } catch (err) { console.error("Grid failed:", err); }
}

async function openModal(id){
  const products = await fetchProducts();
  const product = products.find(x=>x.id===id);
  const modal = document.getElementById('product-modal');
  const body = document.getElementById('modal-body');
  const title = currentLang === 'en' ? product.title : (product[`title_${currentLang}`] || product.title);
  const desc = currentLang === 'en' ? product.description : (product[`description_${currentLang}`] || product.description);
  body.innerHTML = `<div style="display:flex;gap:1rem;flex-wrap:wrap"><img src="${product.image}" alt="${title}" style="width:320px;height:240px;object-fit:cover;border-radius:6px"><div><h3>${title}</h3><p>${desc}</p></div></div>`;
  modal.classList.remove('hidden');
}

function closeModal(){ document.getElementById('product-modal').classList.add('hidden'); }

function initSidebar(){
  if(window.__mufti_sidebar_inited) return;
  const toggle = document.getElementById('sidebar-toggle');
  const sidebar = document.getElementById('site-sidebar');
  if(!toggle || !sidebar) return;
  window.__mufti_sidebar_inited = true;
  toggle.addEventListener('click', (e)=>{
    e.stopPropagation();
    const isOpen = sidebar.classList.toggle('open');
    document.body.classList.toggle('sidebar-open', isOpen);
  });
  document.addEventListener('click', (e)=>{
    if(window.innerWidth > 900 || !sidebar.classList.contains('open')) return;
    if(!sidebar.contains(e.target) && e.target !== toggle) {
      sidebar.classList.remove('open');
      document.body.classList.remove('sidebar-open');
    }
  });
}

function initNavigation(){
  const getLinks = () => Array.from(document.querySelectorAll('.nav a[href^="#"]'));
  const headerHeight = () => document.querySelector('.site-header')?.offsetHeight || 0;
  const attach = () => {
    const links = getLinks();
    const sections = links.map(l=> document.querySelector(l.getAttribute('href'))).filter(Boolean);
    links.forEach(link => link.addEventListener('click', (e) => {
      const target = document.querySelector(link.getAttribute('href'));
      if(!target) return;
      e.preventDefault();
      document.getElementById('site-sidebar').classList.remove('open');
      document.body.classList.remove('sidebar-open');
      window.scrollTo({top: target.offsetTop - headerHeight() - 8, behavior:'smooth'});
    }));
  };
  const links = getLinks();
  if(!links.length){
    new MutationObserver((_, obs)=>{ if(getLinks().length){ obs.disconnect(); attach(); } }).observe(document.body, {childList:true,subtree:true});
  } else attach();
}

function syncSidebarState(){
  const s = document.getElementById('site-sidebar');
  if(!s) return;
  const update = () => {
    const isDesk = window.innerWidth >= 900;
    s.classList.toggle('open', isDesk);
    document.body.classList.toggle('sidebar-open', isDesk);
  };
  update();
  window.addEventListener('resize', update);
}

function setupRevealAnimations(){
  const observer = new IntersectionObserver((entries)=>{
    entries.forEach(entry=>{
      if(entry.isIntersecting){
        entry.target.classList.add('reveal');
        entry.target.classList.remove('reveal-hidden');
      }
    });
  },{threshold:0.1, rootMargin: '0px 0px -50px 0px'});
  document.querySelectorAll('.featured, .about, .contact, .shop-top, .reveal-stagger').forEach(t => observer.observe(t));
  window.revealObserver = observer;
}

function observeNewElements(selector) {
  const container = document.querySelector(selector);
  if (!container || !window.revealObserver) return;
  container.querySelectorAll('.card').forEach(item => {
    item.classList.add('reveal-hidden');
    window.revealObserver.observe(item);
  });
}

function setupMagneticButtons() {
  document.querySelectorAll('.btn').forEach(btn => {
    btn.addEventListener('mousemove', (e) => {
      const r = btn.getBoundingClientRect();
      btn.style.transform = `translate(${(e.clientX - r.left - r.width/2)*0.3}px, ${(e.clientY - r.top - r.height/2)*0.3}px)`;
    });
    btn.addEventListener('mouseleave', () => btn.style.transform = '');
  });
}

function setupParallax() {
  window.addEventListener('scroll', () => {
    const s = window.scrollY;
    const slides = document.querySelector('.hero-slides');
    if (slides) slides.style.transform = `translateY(${s * 0.4}px)`;
    const cont = document.querySelector('.hero .container');
    if (cont) {
      cont.style.transform = `translateY(${s * -0.1}px)`;
      cont.style.opacity = 1 - (s / 500);
    }
  });
}

function setupScrollTop(){
  const btn = document.getElementById('scroll-top');
  if(!btn) return;
  window.addEventListener('scroll', ()=> btn.classList.toggle('show', window.scrollY > 300));
  btn.addEventListener('click', ()=> window.scrollTo({top:0,behavior:'smooth'}));
}

function setupHeroSlideshow(){
  const slides = document.querySelectorAll('.hero-slides img');
  if(!slides.length) return;
  
  // Set first slide active initially
  slides[0].classList.add('active');
  
  let cur = 0;
  setInterval(()=>{
    slides[cur].classList.remove('active');
    cur = (cur + 1) % slides.length;
    slides[cur].classList.add('active');
  }, 6000);
}

document.addEventListener('DOMContentLoaded', ()=>{
  loadTranslations();
  initSidebar();
  const mut = new MutationObserver(()=>{ if(document.getElementById('site-sidebar')){ initSidebar(); syncSidebarState(); mut.disconnect(); } });
  mut.observe(document.body, {childList:true,subtree:true});
  
  const modalClose = document.getElementById('modal-close');
  if(modalClose) modalClose.addEventListener('click', closeModal);
  const modal = document.getElementById('product-modal');
  if(modal) modal.addEventListener('click', (e)=>{ if(e.target===modal) closeModal(); });

  setupRevealAnimations();
  setupMagneticButtons();
  setupParallax();
  setupScrollTop();
  setupHeroSlideshow();
  initNavigation();

  // Initial render (English/Fallback) while translations load
  renderFeatured();
  renderProductsGrid();
});
