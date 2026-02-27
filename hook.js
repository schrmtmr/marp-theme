// テスト1用 hook.js
(function() {
  const w = top;
  if (w._marpHookEnabled) return;
  w._marpHookEnabled = true;

  const originalFetch = w.fetch;
  w.fetch = async function(url, opts) {
    if (typeof url === 'string' && url.includes('/api/export/') && opts && opts.method === 'POST') {
      try {
        let bodyObj = JSON.parse(opts.body);
        
        // 削った部分: markdown側の置換を削除しました
        
        // html側からのみ消去する
        if (bodyObj.html) {
          bodyObj.html = bodyObj.html.replace(/<img[^>]*src=["']?x["']?[^>]*>/gi, '');
        }

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
  console.log("[Marp Hook] テスト1 実行中（markdown置換削除版）");
})();
