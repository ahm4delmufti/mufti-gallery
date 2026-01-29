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
}

// Render products grid on shop
async function renderProductsGrid(){
  const container = document.getElementById('products-grid');
  if(!container) return;
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

// Hooks
document.addEventListener('DOMContentLoaded', ()=>{
  renderFeatured();
  renderProductsGrid();
  const modalClose = document.getElementById('modal-close');
  if(modalClose) modalClose.addEventListener('click', closeModal);
  const modal = document.getElementById('product-modal');
  if(modal) modal.addEventListener('click', (e)=>{ if(e.target===modal) closeModal(); });
  
  // Sidebar toggle (for responsive left navigation)
  // Initialize sidebar behavior when elements are present. Use a MutationObserver
  // to detect injected layout if it appears after this script runs.
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
    function openSidebar(){
      sidebar.classList.add('open');
      sidebar.setAttribute('aria-hidden','false');
      sidebarToggle.setAttribute('aria-expanded','true');
      document.body.classList.add('sidebar-open');
    }

    sidebarToggle.addEventListener('click', (e)=>{
      e.stopPropagation();
      const isOpen = sidebar.classList.toggle('open');
      sidebar.setAttribute('aria-hidden', String(!isOpen));
      sidebarToggle.setAttribute('aria-expanded', String(isOpen));
      document.body.classList.toggle('sidebar-open', isOpen);
    });

    // Close sidebar when clicking outside on small screens
    document.addEventListener('click', (e)=>{
      if(window.innerWidth > 900) return;
      if(!sidebar.classList.contains('open')) return;
      const target = e.target;
      if(target === sidebar || sidebar.contains(target) || target === sidebarToggle) return;
      closeSidebar();
    });
    // Close on Esc
    document.addEventListener('keydown', (e)=>{ if(e.key === 'Escape') closeSidebar(); });
  }

  // Try to init immediately (if layout already injected)
  initSidebar();
  // If not initialized yet, observe DOM for injected layout elements
  if(!window.__mufti_sidebar_inited){
    const mutObserver = new MutationObserver((records, mutationObserver)=>{
      if(document.getElementById('site-sidebar') && document.getElementById('sidebar-toggle')){
        initSidebar();
        mutationObserver.disconnect();
      }
    });
    mutObserver.observe(document.documentElement || document.body, {childList:true,subtree:true});
  }
  // Setup reveal-on-scroll animations
  setupRevealAnimations();
  // Initialize navigation handlers and ScrollSpy
  (function initNavigation(){
    function getNavLinks(){
      return Array.from(document.querySelectorAll('.nav a[href^="#"]'));
    }

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
    if(!links.length){
      // wait for injected layout
      const mutObserverForLinks = new MutationObserver((records, mutationObserver)=>{
        links = getNavLinks();
        if(links.length){
          mutationObserver.disconnect();
          attach();
        }
      });
      mutObserverForLinks.observe(document.documentElement || document.body, {childList:true,subtree:true});
    } else attach();

    function attach(){
      links = getNavLinks();
      const sections = links.map(l=> document.querySelector(l.getAttribute('href'))).filter(Boolean);

      links.forEach(link => link.addEventListener('click', (event) => {
        const href = link.getAttribute('href');
        if(!href || !href.startsWith('#')) return;
        const target = document.querySelector(href);
        if(!target) return;
        event.preventDefault();
        // close sidebar if open (mobile or desktop)
        const sidebar = document.getElementById('site-sidebar');
        const toggle = document.getElementById('sidebar-toggle');
        if(sidebar && sidebar.classList.contains('open')){
          sidebar.classList.remove('open');
          sidebar.setAttribute('aria-hidden','true');
          if(toggle) toggle.setAttribute('aria-expanded','false');
          document.body.classList.remove('sidebar-open');
        }
        scrollToSection(target);
      }));

      // ScrollSpy: update active link
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
      // initial
      onScroll();
    }
  })();
  // Ensure sidebar default state matches viewport (open on desktop)
  (function syncSidebarState(){
    const sidebar = document.getElementById('site-sidebar');
    const toggle = document.getElementById('sidebar-toggle');
    if(!sidebar || !toggle) return;
    const setOpen = (open)=>{
      sidebar.classList.toggle('open', open);
      sidebar.setAttribute('aria-hidden', String(!open));
      toggle.setAttribute('aria-expanded', String(open));
      document.body.classList.toggle('sidebar-open', open);
    };
    // Initial state
    setOpen(window.innerWidth >= 900);
    // Keep in sync when resizing across breakpoint
    let lastIsDesktop = window.innerWidth >= 900;
    window.addEventListener('resize', ()=>{
      const isDesktop = window.innerWidth >= 900;
      if(isDesktop !== lastIsDesktop){
        // On entering desktop, open sidebar; on leaving desktop, close it
        setOpen(isDesktop);
        lastIsDesktop = isDesktop;
      }
    });
  })();
  // Scroll-to-top button
  setupScrollTop();
  // Hero slideshow (index page)
  setupHeroSlideshow();
});

// Reveal animations using IntersectionObserver
function setupRevealAnimations(){
  const targets = document.querySelectorAll('.card, .featured, .about, .contact, .shop-top, .grid');
  if(!targets.length) return;
  targets.forEach(target => target.classList.add('reveal-hidden'));
  const observer = new IntersectionObserver((entries, intersectionObserver)=>{
    entries.forEach(entry=>{
      if(entry.isIntersecting){
        entry.target.classList.add('reveal');
        entry.target.classList.remove('reveal-hidden');
        intersectionObserver.unobserve(entry.target);
      }
    });
  },{threshold:0.12});
  targets.forEach(target => observer.observe(target));
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
