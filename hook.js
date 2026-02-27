// Marp Web Editor エクスポートAPIフック & CSS自動インジェクション
(function() {
  const w = top; // iframe外の親ウィンドウを特定
  if (w._marpHookEnabled) return; // 二重起動防止
  w._marpHookEnabled = true;

  const originalFetch = w.fetch;
  w.fetch = async function(url, opts) {
    // エクスポートAPIへのPOST通信のみを捕捉
    if (typeof url === 'string' && url.includes('/api/export/') && opts && opts.method === 'POST') {
      try {
        let bodyObj = JSON.parse(opts.body);
        
        // トリガーとして用いた <style> タグを正規表現で削除（PDFにゴミを残さないため）
        const triggerRegex = /<style\s+onload=["']import\([^)]+\)["']\s*><\/style>/gi;

        // markdown本体のクリーンアップ
        if (bodyObj.markdown) {
          bodyObj.markdown = bodyObj.markdown.replace(triggerRegex, '');
        }
        // サーバーがHTMLを優先してパースする場合に備えたクリーンアップ
        if (bodyObj.html) {
          bodyObj.html = bodyObj.html.replace(triggerRegex, '');
        }

        // 🎨 最新のCSS（GitHub等）を取得して結合
        const cssRes = await originalFetch('https://cdn.jsdelivr.net/gh/schrmtmr/marp-theme@main/main.css');
        const cssText = await cssRes.text();
        
        // 既存CSSの設定を壊さないよう、末尾に追記する
        bodyObj.css = (bodyObj.css || '') + '\n' + cssText;
        opts.body = JSON.stringify(bodyObj);
        
      } catch (e) {
        console.error("[Marp Hook Error]", e);
      }
    }
    return originalFetch.apply(this, arguments);
  };
  console.log("[Marp Hook] ✅ カスタムCSSインジェクションが有効化されました");
})();
