/**
 * Marp Web Editor Custom CSS Injector (Final Stable Version)
 * Features:
 *  - PDF Export: Injects CSS into payload & removes trigger tag safely.
 *  - Live Preview: Injects CSS into iframe & persists across re-renders.
 *  - Optimization: Caches CSS to minimize network requests.
 */
(async function() {
  const w = top; // Main window context
  if (w._marpHookEnabled) return; // Prevent double execution
  w._marpHookEnabled = true;

  console.log("[Marp Hook] 🚀 Initializing...");

  const CSS_URL = 'https://raw.githack.com/schrmtmr/marp-theme/main/main.css';
  let customCss = "";

  // --- Helper: Fetch CSS with Error Handling ---
  const originalFetch = w.fetch; // Capture original fetch immediately
  const fetchCss = async () => {
    try {
      const res = await originalFetch(CSS_URL);
      if (!res.ok) throw new Error(res.statusText);
      return await res.text();
    } catch (e) {
      console.warn("[Marp Hook] CSS Fetch Warning:", e);
      return "";
    }
  };

  // --- Feature 1: Live Preview Synchronization (Frontend) ---
  const initPreviewSync = async () => {
    // Ensure CSS is loaded before injecting
    if (!customCss) customCss = await fetchCss();

    const iframe = w.document.querySelector('iframe');
    if (!iframe) return;

    // Injection Logic
    const inject = () => {
      try {
        const doc = iframe.contentDocument || iframe.contentWindow.document;
        if (!doc || !doc.head) return;

        // Inject only if missing
        if (!doc.getElementById('marp-custom-preview-style')) {
          const style = doc.createElement('style');
          style.id = 'marp-custom-preview-style';
          style.textContent = customCss;
          doc.head.appendChild(style);
        }
      } catch(e) { /* Ignore DOM access errors during reloading */ }
    };

    // Observer: Re-apply CSS when Marp re-renders the preview
    const observer = new MutationObserver(() => inject());
    
    const startObserving = () => {
      try {
        const doc = iframe.contentDocument || iframe.contentWindow.document;
        if (doc && doc.head) {
          inject(); // Initial injection
          observer.disconnect(); // Reset observer
          // Watch both head (style removal) and body (full re-render)
          observer.observe(doc.head, { childList: true });
          observer.observe(doc.body, { childList: true });
        }
      } catch(e) {}
    };

    // Start watching
    startObserving();
    // Re-attach if the iframe itself reloads
    iframe.addEventListener('load', startObserving);
  };

  // --- Feature 2: PDF Export Injection (Backend) ---
  w.fetch = async function(url, opts) {
    // Intercept only POST requests to the export API
    if (typeof url === 'string' && url.includes('/api/export/') && opts && opts.method === 'POST') {
      try {
        // Fallback: Try fetching CSS again if empty
        if (!customCss) customCss = await fetchCss();

        let bodyObj = JSON.parse(opts.body);
        
        // 1. Remove the trigger tag from Markdown to prevent "broken image" icon in PDF
        // Target specific tag: <img data-hook="marp-style" ...>
        const imgRegex = /<img[^>]*data-hook=["']?marp-style["']?[^>]*>/gi;
        
        // Only removing from markdown is sufficient based on analysis
        if (bodyObj.markdown) {
          bodyObj.markdown = bodyObj.markdown.replace(imgRegex, '');
        }

        // 2. Inject CSS into the payload
        if (customCss) {
          bodyObj.css = (bodyObj.css || '') + '\n' + customCss;
        }
        
        opts.body = JSON.stringify(bodyObj);
      } catch (e) {
        console.error("[Marp Hook] Export Payload Error:", e);
      }
    }
    return originalFetch.apply(this, arguments);
  };

  // --- Execution ---
  await initPreviewSync();
  console.log("[Marp Hook] ✅ System Ready: Preview & Export synced.");

})();
