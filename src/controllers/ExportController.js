// src/controllers/ExportController.js
export class ExportController {
  constructor(styleService, config) {
    this.styleService = styleService;
    this.config = config;
    // 初期化時に、Marpの本来のfetch機能を退避しておく
    this.originalFetch = window.top.fetch;
  }

  async start() {
    const self = this;
    const w = window.top;

    // 【ハック中核】Marpの通信機能（fetch）を乗っ取る
    w.fetch = async function(url, opts) {
      // エクスポートAPI(/api/export/)へのPOSTリクエストのみターゲットにする
      if (typeof url === 'string' && url.includes('/api/export/') && opts && opts.method === 'POST') {
        try {
          console.log("[ExportController] 📤 Intercepted export request.");
          
          // 【リスク対策1: 非同期ガード】システムがReadyになるまで最大5秒待機する
          let attempts = 0;
          while (w._marpOrchestrator.status !== 'ready' && attempts < 50) {
            await new Promise(resolve => setTimeout(resolve, 100)); // 100ミリ秒待つ
            attempts++;
          }

          // ペイロード（送信データ）を展開
          let bodyObj = JSON.parse(opts.body);
          
          // 【リスク対策2: Markdownからの抽出】DOMではなく送信データからテーマを判定
          const targetTheme = self.styleService.getThemeFromMarkdown(bodyObj.markdown);
          console.log(`[ExportController] 🔍 Detected theme for export: "${targetTheme}"`);

          // テーマCSSを取得（キャッシュが効いているので即座に返る）
          const customCss = await self.styleService.fetchThemeCss(targetTheme);

          if (bodyObj.markdown) {
            // PDFに「壊れた画像アイコン」が出ないよう、トリガータグを完全に削り取る
            const imgRegex = new RegExp(`<img[^>]*data-hook=["']?marp-style["']?[^>]*>`, 'gi');
            bodyObj.markdown = bodyObj.markdown.replace(imgRegex, '');
          }

          // MarpのシステムCSSに、取得したカスタムCSSを連結する
          if (customCss) {
            bodyObj.css = (bodyObj.css || '') + '\n' + customCss;
          }
          
          // 改変したデータを再パック
          opts.body = JSON.stringify(bodyObj);
          console.log("[ExportController] ✨ Successfully injected CSS into export payload.");
          
        } catch (e) {
          console.error("[ExportController] ❌ Export Payload Error:", e);
        }
      }
      
      // 改変したデータを使って、本来の送信処理を続行
      return self.originalFetch.apply(this, arguments);
    };
  }
}
