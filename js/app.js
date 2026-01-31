const PRODUCTS_URL = 'data/products.json';

async function fetchProducts(){
  const res = await fetch(PRODUCTS_URL);
  return res.json();
}

// prices and cart removed — site displays name and description only

// Render featured on index
async function renderFeatured(){
  const container = document.getElementById('featured-grid');
  if(!container) return;
  try {
    const products = await fetchProducts();
    const featured = products.slice(0,4);
    container.innerHTML = featured.map(product=>`<article class="card">
      <img src="${product.image}" alt="${product.title}">
      <div class="card-body">
        <h4 class="card-title">${product.title}</h4>
        <p class="small">${product.description}</p>
        <div style="margin-top:.5rem">
          <button class="btn" onclick="openModal(${product.id})">Details</button>
        </div>
      </div>
    </article>`).join('');
    observeNewElements('#featured-grid');
  } catch (err) {
    console.error("Featured failed:", err);
  }
}

// Render products grid on shop
async function renderProductsGrid(){
  const container = document.getElementById('products-grid');
  if(!container) return;
  try {
    const products = await fetchProducts();
    container.innerHTML = products.map(product=>`<article class="card" id="p${product.id}">
      <img src="${product.image}" alt="${product.title}">
      <div class="card-body">
        <h4 class="card-title">${product.title}</h4>
        <p class="small">${product.description}</p>
        <div style="margin-top:.5rem">
          <button class="btn" onclick="openModal(${product.id})">Details</button>
        </div>
      </div>
    </article>`).join('');
    observeNewElements('#products-grid');
  } catch (err) {
    console.error("Grid failed:", err);
    container.innerHTML = `<p>Error loading products. Please try refreshing.</p>`;
  }
}

// Modal
async function openModal(id){
  const products = await fetchProducts();
  const product = products.find(x=>x.id===id);
  const modal = document.getElementById('product-modal');
  const body = document.getElementById('modal-body');
  body.innerHTML = `
    <div style="display:flex;gap:1rem;flex-wrap:wrap">
      <img src="${product.image}" alt="${product.title}" style="width:320px;height:240px;object-fit:cover;border-radius:6px">
      <div>
        <h3>${product.title}</h3>
        <p>${product.description}</p>
      </div>
    </div>
  `;
  modal.classList.remove('hidden');
}

function closeModal(){
  const modal = document.getElementById('product-modal');
  modal.classList.add('hidden');
}

// Cart removed — no client-side cart functions required

// Sidebar logic
function initSidebar(){
  if(window.__mufti_sidebar_inited) return;
  const sidebarToggle = document.getElementById('sidebar-toggle');
  const sidebar = document.getElementById('site-sidebar');
  if(!sidebarToggle || !sidebar) return;

  window.__mufti_sidebar_inited = true;

  function closeSidebar(){
    sidebar.classList.remove('open');
    sidebar.setAttribute('aria-hidden','true');
    sidebarToggle.setAttribute('aria-expanded','false');
    document.body.classList.remove('sidebar-open');
  }

  sidebarToggle.addEventListener('click', (e)=>{
    e.stopPropagation();
    const isOpen = sidebar.classList.toggle('open');
    sidebar.setAttribute('aria-hidden', String(!isOpen));
    sidebarToggle.setAttribute('aria-expanded', String(isOpen));
    document.body.classList.toggle('sidebar-open', isOpen);
  });

  document.addEventListener('click', (e)=>{
    if(window.innerWidth > 900) return;
    if(!sidebar.classList.contains('open')) return;
    const target = e.target;
    if(target === sidebar || sidebar.contains(target) || target === sidebarToggle) return;
    closeSidebar();
  });
  document.addEventListener('keydown', (e)=>{ if(e.key === 'Escape') closeSidebar(); });
}

// Navigation & ScrollSpy
function initNavigation(){
  function getNavLinks(){ return Array.from(document.querySelectorAll('.nav a[href^="#"]')); }
  function headerHeight(){
    const headerEl = document.querySelector('.site-header');
    return headerEl ? headerEl.getBoundingClientRect().height : 0;
  }
  function scrollToSection(el){
    if(!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY - headerHeight() - 8;
    window.scrollTo({top,behavior:'smooth'});
  }

  let links = getNavLinks();
  const attach = () => {
    links = getNavLinks();
    const sections = links.map(l=> document.querySelector(l.getAttribute('href'))).filter(Boolean);
    links.forEach(link => link.addEventListener('click', (event) => {
      const href = link.getAttribute('href');
      if(!href || !href.startsWith('#')) return;
      const target = document.querySelector(href);
      if(!target) return;
      event.preventDefault();
      const sidebar = document.getElementById('site-sidebar');
      if(sidebar && sidebar.classList.contains('open')){
        sidebar.classList.remove('open');
        document.body.classList.remove('sidebar-open');
      }
      scrollToSection(target);
    }));

    let ticking = false;
    function onScroll(){
      if(ticking) return; ticking = true;
      requestAnimationFrame(()=>{
        const offset = window.scrollY + headerHeight() + 12;
        let current = sections[0];
        for(const section of sections){ if(section.offsetTop <= offset) current = section; }
        links.forEach(link =>{
          const target = document.querySelector(link.getAttribute('href'));
          link.classList.toggle('active', target === current);
        });
        ticking = false;
      });
    }
    document.addEventListener('scroll', onScroll, {passive:true});
    onScroll();
  };

  if(!links.length){
    const obs = new MutationObserver(()=>{
      if(getNavLinks().length){ obs.disconnect(); attach(); }
    });
    obs.observe(document.body, {childList:true,subtree:true});
  } else attach();
}

function syncSidebarState(){
  const sidebar = document.getElementById('site-sidebar');
  const toggle = document.getElementById('sidebar-toggle');
  if(!sidebar || !toggle) return;
  const setOpen = (open)=>{
    sidebar.classList.toggle('open', open);
    document.body.classList.toggle('sidebar-open', open);
  };
  setOpen(window.innerWidth >= 900);
  window.addEventListener('resize', ()=>{ setOpen(window.innerWidth >= 900); });
}

// Reveal animations using IntersectionObserver
function setupRevealAnimations(){
  const staticTargets = document.querySelectorAll('.featured, .about, .contact, .shop-top, .reveal-stagger');
  
  const observer = new IntersectionObserver((entries, intersectionObserver)=>{
    entries.forEach(entry=>{
      if(entry.isIntersecting){
        entry.target.classList.add('reveal');
        entry.target.classList.remove('reveal-hidden');
        intersectionObserver.unobserve(entry.target);
      }
    });
  },{threshold:0.1, rootMargin: '0px 0px -100px 0px'});

  staticTargets.forEach(target => {
    if (!target.classList.contains('reveal-stagger')) {
      target.classList.add('reveal-hidden');
    }
    observer.observe(target);
  });

  window.revealObserver = observer;
}

// Function to observe newly added elements (for products)
function observeNewElements(containerSelector) {
  const container = document.querySelector(containerSelector);
  if (!container || !window.revealObserver) return;
  
  const items = container.querySelectorAll('.card');
  items.forEach(item => {
    if (!item.classList.contains('reveal')) {
      item.classList.add('reveal-hidden');
      window.revealObserver.observe(item);
    }
  });
}

// Magnetic Buttons
function setupMagneticButtons() {
  const buttons = document.querySelectorAll('.btn');
  buttons.forEach(btn => {
    btn.addEventListener('mousemove', (e) => {
      const rect = btn.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      btn.style.transform = `translate(${x * 0.3}px, ${y * 0.3}px)`;
    });
    btn.addEventListener('mouseleave', () => {
      btn.style.transform = '';
    });
  });
}

// Parallax Hero
function setupParallax() {
  const hero = document.querySelector('.hero');
  if (!hero) return;
  window.addEventListener('scroll', () => {
    const scrolled = window.scrollY;
    const slides = hero.querySelector('.hero-slides');
    if (slides) {
      slides.style.transform = `translateY(${scrolled * 0.4}px)`;
    }
    const container = hero.querySelector('.container');
    if (container) {
      container.style.transform = `translateY(${scrolled * -0.1}px)`;
      container.style.opacity = 1 - (scrolled / 500);
    }
  });
}

// Scroll-to-top behavior
function setupScrollTop(){
  const btn = document.getElementById('scroll-top');
  if(!btn) return;
  window.addEventListener('scroll', ()=>{
    if(window.scrollY > 300) btn.classList.add('show'); else btn.classList.remove('show');
  });
  btn.addEventListener('click', ()=> window.scrollTo({top:0,behavior:'smooth'}));
}

function setupHeroSlideshow(){
  const wrapper = document.querySelector('.hero-slides');
  if(!wrapper) return;
  const slides = Array.from(wrapper.querySelectorAll('img'));
  if(!slides.length) return;
  let currentIndex = 0;
  slides.forEach((slide, index) => slide.classList.toggle('active', index === 0));
  setInterval(()=>{
    slides[currentIndex].classList.remove('active');
    currentIndex = (currentIndex + 1) % slides.length;
    slides[currentIndex].classList.add('active');
  }, 6000);
}

// Hooks
document.addEventListener('DOMContentLoaded', ()=>{
  renderFeatured();
  renderProductsGrid();
  
  const modalClose = document.getElementById('modal-close');
  if(modalClose) modalClose.addEventListener('click', closeModal);
  const modal = document.getElementById('product-modal');
  if(modal) modal.addEventListener('click', (e)=>{ if(e.target===modal) closeModal(); });
  
  // Sidebar toggle
  initSidebar();
  if(!window.__mufti_sidebar_inited){
    const mutObserver = new MutationObserver((records, mutationObserver)=>{
      if(document.getElementById('site-sidebar') && document.getElementById('sidebar-toggle')){
        initSidebar();
        mutationObserver.disconnect();
      }
    });
    mutObserver.observe(document.documentElement || document.body, {childList:true,subtree:true});
  }

  setupRevealAnimations();
  setupMagneticButtons();
  setupParallax();
  setupScrollTop();
  setupHeroSlideshow();

  // Navigation & ScrollSpy
  initNavigation();
  syncSidebarState();
});
