(async function() {
  const w = top;
  if (w._marpHookEnabled) return;
  w._marpHookEnabled = true;

  const CSS_URL = 'https://raw.githack.com/schrmtmr/marp-theme/main/main.css';
  let customCss = "";

  const fetchCss = async () => {
    try {
      const res = await w.fetch(CSS_URL);
      return await res.text();
    } catch (e) {
      console.warn("[Marp Hook] CSSフェッチエラー:", e);
      return "";
    }
  };

  customCss = await fetchCss();

  // 👁️ 【新規追加】 プレビュー画面にCSSを反映させるための処理
  const injectPreviewStyle = (cssText) => {
    if (!cssText) return;
    const styleId = 'marp-custom-preview-style';
    
    // 既に注入済みの場合は上書き、なければ新規作成
    let styleEl = w.document.getElementById(styleId);
    if (!styleEl) {
      styleEl = w.document.createElement('style');
      styleEl.id = styleId;
      w.document.head.appendChild(styleEl); // headに注入
    }
    styleEl.textContent = cssText;
    console.log("[Marp Hook] 🎨 プレビュー画面にスタイルを注入しました");
  };

  // 取得成功したらすぐにプレビューに注入する
  injectPreviewStyle(customCss);

  const originalFetch = w.fetch;
  w.fetch = async function(url, opts) {
    // （エクスポートフック処理は変更なし）
    if (typeof url === 'string' && url.includes('/api/export/') && opts && opts.method === 'POST') {
      try {
        let bodyObj = JSON.parse(opts.body);
        const imgRegex = /<img[^>]*data-hook=["']?marp-style["']?[^>]*>/gi;
        
        if (bodyObj.markdown) {
          bodyObj.markdown = bodyObj.markdown.replace(imgRegex, '');
        }

        if (!customCss) {
          customCss = await fetchCss();
          injectPreviewStyle(customCss); // 再取得時もプレビューに反映
        }

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
  
  console.log("[Marp Hook] 🚀 カスタムCSSインジェクションが有効化されました (Preview Test 1)");
})();
