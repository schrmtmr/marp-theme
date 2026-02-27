// Marp Web Editor エクスポートAPIフック & CSS自動インジェクション
(function() {
  const w = top; // 親ウィンドウ(Marp本体)をターゲット
  if (w._marpHookEnabled) return; // 二重起動防止
  w._marpHookEnabled = true;

  const originalFetch = w.fetch;
  w.fetch = async function(url, opts) {
    // エクスポート時のPOST通信のみを検知
    if (typeof url === 'string' && url.includes('/api/export/') && opts && opts.method === 'POST') {
      try {
        let bodyObj = JSON.parse(opts.body);
        if (bodyObj.markdown) {
          // ★ここでGitHubから最新のCSSを取得して結合
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
