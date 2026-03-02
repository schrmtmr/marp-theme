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

    // Marpの通信機能（fetch）を乗っ取る
    w.fetch = async function(url, opts) {
      // エクスポートAPIへのPOSTリクエストのみターゲットにする（エンドポイントはConfigで一元管理）
      if (typeof url === 'string' && url.includes(self.config.EXPORT_API_ENDPOINT) && opts && opts.method === 'POST') {
        try {
          // ペイロードが文字列(JSON)でなければ何もしない（フェイルセーフ）
          if (typeof opts.body !== 'string') {
            return self.originalFetch.apply(this, arguments);
          }

          // システムがReadyになるまで最大5秒待機する
          let attempts = 0;
          while (w._marpOrchestrator && w._marpOrchestrator.status !== 'ready' && attempts < 50) {
            await new Promise(resolve => setTimeout(resolve, 100)); // 100ミリ秒待つ
            attempts++;
          }

          // ペイロード（送信データ）を展開
          let bodyObj = JSON.parse(opts.body);
          
          // markdownプロパティが存在しない場合は何もしない（SaaS仕様変更対策）
          if (!bodyObj || typeof bodyObj.markdown !== 'string') {
            return self.originalFetch.apply(this, arguments);
          }
          
          // 送信データからテーマを判定
          const targetTheme = self.styleService.getThemeFromMarkdown(bodyObj.markdown);

          // テーマCSSを取得
          const customCss = await self.styleService.fetchThemeCss(targetTheme);

          // PDFに「壊れた画像アイコン」が出ないよう、トリガータグを削り取る（正規表現はConfigで一元管理）
          bodyObj.markdown = bodyObj.markdown.replace(self.config.TRIGGER_IMG_REGEX, '');

          // MarpのシステムCSSに、取得したカスタムCSSを連結する
          if (customCss) {
            bodyObj.css = (bodyObj.css || '') + '\n' + customCss;
          }
          
          // 改変したデータを再パック
          opts.body = JSON.stringify(bodyObj);
          
        } catch (e) {
          // 何らかのエラー（パース失敗等）が起きた場合は、
          // ペイロードの改変を諦め、素のデータで元のfetchを叩かせる（PDF出力を妨害しない）
          if (self.config.DEBUG_MODE) {
            console.error("[ExportController] ❌ Export Payload Alteration Failed. Fallback to original fetch.", e);
          }
        }
      }
      
      // 改変データ（またはエラー時は元のデータ）を使って、本来の送信処理を続行
      return self.originalFetch.apply(this, arguments);
    };
  }
}
