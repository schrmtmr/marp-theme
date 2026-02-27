(async function() {
  const w = top;
  if (w._marpHookEnabled) return;
  w._marpHookEnabled = true;

  const CSS_URL = 'https://raw.githack.com/schrmtmr/marp-theme/main/main.css';
  let customCss = "";

  // CSS取得関数（再利用可能にする）
  const fetchCss = async () => {
    try {
      const res = await w.fetch(CSS_URL);
      return await res.text();
    } catch (e) {
      console.warn("[Marp Hook] CSS Fetch Warn:", e);
      return "";
    }
  };

  // 1. 初回CSSキャッシュ
  customCss = await fetchCss();

  const originalFetch = w.fetch;
  w.fetch = async function(url, opts) {
    if (typeof url === 'string' && url.includes('/api/export/') && opts && opts.method === 'POST') {
      try {
        let bodyObj = JSON.parse(opts.body);
        
        // 🔍 【解析用ログ】サーバーに送信されている全キー（プロパティ）を解剖
        console.group("[Marp Hook] エクスポート・ペイロード解析");
        console.log("送信キー一覧:", Object.keys(bodyObj));
        Object.keys(bodyObj).forEach(key => {
          const val = bodyObj[key];
          const type = typeof val;
          const preview = type === 'string' ? val.substring(0, 50).replace(/\n/g, '\\n') + "..." : val;
          console.log(`- ${key} (${type}):`, preview);
        });
        console.groupEnd();

        // 🛡️ 【堅牢化1】 誤爆防止。data-hook="marp-style" を持つ画像だけをピンポイントで消去
        const imgRegex = /<img[^>]*data-hook=["']?marp-style["']?[^>]*>/gi;
        
        // 安全のため、文字列型の全プロパティを走査してトリガーを消去（未知のプロパティ対策）
        Object.keys(bodyObj).forEach(key => {
          if (typeof bodyObj[key] === 'string') {
            bodyObj[key] = bodyObj[key].replace(imgRegex, '');
          }
        });

        // 🛡️ 【堅牢化2】 CSS取得エラー時の自己修復（再取得）
        if (!customCss || customCss.trim() === "") {
          console.log("[Marp Hook] CSSキャッシュが空のため再取得を試みます...");
          customCss = await fetchCss();
        }

        if (customCss) {
          bodyObj.css = (bodyObj.css || '') + '\n' + customCss;
        } else {
          console.error("[Marp Hook Error] 最終的にCSSを取得できませんでした");
        }
        
        opts.body = JSON.stringify(bodyObj);
      } catch (e) {
        console.error("[Marp Hook Payload Error]", e);
      }
    }
    return originalFetch.apply(this, arguments);
  };
  
  console.log("[Marp Hook] 🛠️ 解析＆堅牢化テスト版が起動しました");
})();
