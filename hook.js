// Marp Web Editor エクスポートAPIフック & CSS自動インジェクション
(function() {
  const w = top;
  if (w._marpHookEnabled) return;
  w._marpHookEnabled = true;

  const originalFetch = w.fetch;
  w.fetch = async function(url, opts) {
    if (typeof url === 'string' && url.includes('/api/export/') && opts && opts.method === 'POST') {
      try {
        let bodyObj = JSON.parse(opts.body);
        console.log("[Marp Hook Payload]:", bodyObj); // ← ペイロード全体を確認
        if (bodyObj.markdown) {
          
          // 🧹【証拠隠滅】PDFに割れたアイコンが出ないよう、送信直前に <img> タグを原稿から削除
          bodyObj.markdown = bodyObj.markdown.replace(/<img[^>]*src=["']?x["']?[^>]*>/gi, '');

          // 🎨 最新のCSSを取得して結合
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
  console.log("[Marp Hook] ✅ カスタムCSSインジェクションが有効化されました");
})();
