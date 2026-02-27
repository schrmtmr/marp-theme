// hook.js (最新版)
(function() {
  const w = top;
  if (w._marpHookEnabled) return;
  w._marpHookEnabled = true;

  const originalFetch = w.fetch;
  w.fetch = async function(url, opts) {
    if (typeof url === 'string' && url.includes('/api/export/') && opts && opts.method === 'POST') {
      try {
        let bodyObj = JSON.parse(opts.body);
        if (bodyObj.markdown) {
          
          // 1. 【証拠隠滅】 <img src="x" ...> をMarkdownから消去 (正規表現を強化)
          // src="x" を含む img タグ全体を空文字に置換
          const removeRegex = /<img[^>]+src=["']x["'][^>]*>/gi;
          bodyObj.markdown = bodyObj.markdown.replace(removeRegex, '');

          // 2. CSS注入
          const cssRes = await originalFetch('https://cdn.jsdelivr.net/gh/schrmtmr/marp-theme@main/main.css');
          const cssText = await cssRes.text();
          bodyObj.css = (bodyObj.css || '') + '\n' + cssText;
          
          opts.body = JSON.stringify(bodyObj);
          console.log("[Marp Hook] ✅ CSS Injected & Cleanup Done!");
        }
      } catch (e) {
        console.error("[Marp Hook Error]", e);
      }
    }
    return originalFetch.apply(this, arguments);
  };
})();
