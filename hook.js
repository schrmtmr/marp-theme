// hook.js (v3: ID指定による確実な消去版)
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
          
          // 1. 【証拠隠滅】 id="inj" を持つタグを、タグ名に関係なく正規表現で消し去る
          // これにより、imgでもlinkでも確実に削除されます
          const removeRegex = /<[^>]+id=["']inj["'][^>]*>/gi;
          bodyObj.markdown = bodyObj.markdown.replace(removeRegex, '');

          // 2. CSS注入
          const cssRes = await originalFetch('https://cdn.jsdelivr.net/gh/schrmtmr/marp-theme@main/main.css');
          const cssText = await cssRes.text();
          bodyObj.css = (bodyObj.css || '') + '\n' + cssText;
          
          opts.body = JSON.stringify(bodyObj);
        }
      } catch (e) {
        console.error("[Marp Hook Error]", e);
      }
    }
    return originalFetch.apply(this, arguments);
  };
})();
