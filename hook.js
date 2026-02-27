// Marp Web Editor エクスポートAPIフック & CSS自動インジェクション (v2)
(function() {
  const w = top;
  if (w._marpHookEnabled) return;
  w._marpHookEnabled = true;

  const originalFetch = w.fetch;
  w.fetch = async function(url, opts) {
    if (typeof url === 'string' && url.includes('/api/export/') && opts && opts.method === 'POST') {
      try {
        let bodyObj = JSON.parse(opts.body);
        
        // 消去する対象の画像タグ（src="x"を持つimg）
        const imgRegex = /<img[^>]*src=["']?x["']?[^>]*>/gi;

        // 1. markdown側からの消去
        if (bodyObj.markdown) {
          bodyObj.markdown = bodyObj.markdown.replace(imgRegex, '');
        }
        
        // 2. 【最重要】フロントで変換済みの html 側からも完全消去
        if (bodyObj.html) {
          bodyObj.html = bodyObj.html.replace(imgRegex, '');
        }

        // 🎨 最新のCSSを取得して結合（キャッシュ回避のためURLを変更しています）
        const cssRes = await originalFetch('https://raw.githack.com/schrmtmr/marp-theme/main/main.css');
        const cssText = await cssRes.text();
        
        bodyObj.css = (bodyObj.css || '') + '\n' + cssText;
        opts.body = JSON.stringify(bodyObj);
          
      } catch (e) {
        console.error("[Marp Hook Error]", e);
      }
    }
    return originalFetch.apply(this, arguments);
  };
  console.log("[Marp Hook] ✅ カスタムCSSインジェクションが有効化されました (v2)");
})();
