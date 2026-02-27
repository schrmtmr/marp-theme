(async function() {
  const w = top;
  if (w._marpHookEnabled) return;
  w._marpHookEnabled = true;

  const CSS_URL = 'https://raw.githack.com/schrmtmr/marp-theme/main/main.css';
  let customCss = "";

  // CSS取得処理（エラー時は空文字を返す）
  const fetchCss = async () => {
    try {
      const res = await w.fetch(CSS_URL);
      return await res.text();
    } catch (e) {
      console.warn("[Marp Hook] CSSフェッチエラー:", e);
      return "";
    }
  };

  // 初回起動時に1度だけCSSをキャッシュ
  customCss = await fetchCss();

  const originalFetch = w.fetch;
  w.fetch = async function(url, opts) {
    // エクスポートAPIのPOST送信のみを横取り
    if (typeof url === 'string' && url.includes('/api/export/') && opts && opts.method === 'POST') {
      try {
        let bodyObj = JSON.parse(opts.body);
        
        // 🛡️【誤爆防止】 専用の目印（data-hook="marp-style"）を持つ画像だけをピンポイントで消去
        const imgRegex = /<img[^>]*data-hook=["']?marp-style["']?[^>]*>/gi;
        
        // 解析結果に基づき、markdown プロパティのみを狙い撃ち
        if (bodyObj.markdown) {
          bodyObj.markdown = bodyObj.markdown.replace(imgRegex, '');
        }

        // 🛡️【自己修復】 通信の瞬断等でCSSが空だった場合は再取得を試みる
        if (!customCss) customCss = await fetchCss();

        // 取得したCSSをペイロードに注入
        if (customCss) {
          bodyObj.css = (bodyObj.css || '') + '\n' + customCss;
        }
        
        opts.body = JSON.stringify(bodyObj);
      } catch (e) {
        console.error("[Marp Hook] ペイロード処理エラー:", e);
      }
    }
    return originalFetch.apply(this, arguments);
  };
  
  console.log("[Marp Hook] 🚀 カスタムCSSインジェクションが有効化されました (Stable Version)");
})();
