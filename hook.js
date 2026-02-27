(async function() {
  const w = top;
  if (w._marpHookEnabled) return;
  w._marpHookEnabled = true;

  // 【最適化1】 フック起動時に1度だけCSSを取得し、変数にキャッシュしておく（エクスポートの高速化）
  let customCss = "";
  try {
    const res = await w.fetch('https://raw.githack.com/schrmtmr/marp-theme/main/main.css');
    customCss = await res.text();
  } catch (e) {
    console.error("[Marp Hook] CSS Fetch Error", e);
  }

  const originalFetch = w.fetch;
  w.fetch = async function(url, opts) {
    // エクスポートAPIへのPOST通信のみをフック
    if (typeof url === 'string' && url.includes('/api/export/') && opts && opts.method === 'POST') {
      try {
        let bodyObj = JSON.parse(opts.body);
        const imgRegex = /<img[^>]*src=["']?x["']?[^>]*>/gi;
        
        // 【最適化2】 markdown と html の両方からトリガー画像を完全消去（必須の安全装置）
        if (bodyObj.markdown) bodyObj.markdown = bodyObj.markdown.replace(imgRegex, '');
        if (bodyObj.html)     bodyObj.html     = bodyObj.html.replace(imgRegex, '');
        
        // 事前取得したCSSを結合するだけ（都度通信が発生しない）
        if (customCss) {
          bodyObj.css = (bodyObj.css || '') + '\n' + customCss;
        }
        
        opts.body = JSON.stringify(bodyObj);
      } catch (e) {
        // パースエラー等が発生した場合は握りつぶし、元のデータでフォールバック
      }
    }
    return originalFetch.apply(this, arguments);
  };
  
  console.log("[Marp Hook] ✅ 最終最適化版が起動しました");
})();
