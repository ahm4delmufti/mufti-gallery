// Fetch layout.html and inject its header and footer into pages.
(function(){
  async function includeLayout(){
    try{
      const res = await fetch('layout.html');
      if(!res.ok) return;
      const text = await res.text();
      const parser = new DOMParser();
      const doc = parser.parseFromString(text, 'text/html');
      const header = doc.querySelector('header.site-header');
      const footer = doc.querySelector('footer.site-footer');
      const aside = doc.querySelector('aside.sidebar');
      const scrollTopBtn = doc.getElementById('scroll-top');

      // Insert header (replace placeholder)
      if(header){
        const ph = document.getElementById('site-header');
        if(ph) ph.replaceWith(header.cloneNode(true));
      }

      // Insert sidebar (if present) after the header in the document
      if(aside){
        // Only insert if a sidebar isn't already present
        if(!document.querySelector('aside.sidebar')){
          const headerElem = document.querySelector('header.site-header');
          if(headerElem && headerElem.parentNode){
            headerElem.parentNode.insertBefore(aside.cloneNode(true), headerElem.nextSibling);
          } else {
            // Fallback: append to body
            document.body.insertBefore(aside.cloneNode(true), document.body.firstChild);
          }
        }
      }

      // Insert footer (replace placeholder)
      if(footer){
        const pf = document.getElementById('site-footer');
        if(pf) pf.replaceWith(footer.cloneNode(true));
      }

      // Insert scroll-to-top button if present and not already on the page
      if(scrollTopBtn && !document.getElementById('scroll-top')){
        document.body.appendChild(scrollTopBtn.cloneNode(true));
      }
    }catch(err){
      console.error('Could not include layout:', err);
    }
  }
  // Run as soon as possible
  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', includeLayout);
  } else includeLayout();
})();
