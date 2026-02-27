// src/controllers/PreviewController.js

export class PreviewController {
  constructor(styleService, config) {
    this.styleService = styleService;
    this.config = config;
    this.observer = null;
  }

  // コントローラーの起動
  async start() {
    const iframe = window.top.document.querySelector('iframe');
    if (!iframe) return;

    // 1. 初回のスタイル適用
    await this.applyTheme(iframe);

    // 2. 監視（Observer）の開始
    this.setupObserver(iframe);

    // 3. iframe自体がリロードされた時の再設定フック
    iframe.addEventListener('load', () => {
      this.applyTheme(iframe);
      this.setupObserver(iframe);
    });
  }

  // テーマを判定してiframe内にCSSを注入する
  async applyTheme(iframe) {
    try {
      const doc = iframe.contentDocument || iframe.contentWindow.document;
      if (!doc || !doc.head) return;

      // Serviceを使ってDOMからテーマ名を判定
      const targetTheme = this.styleService.getThemeFromDOM(doc);

      // Serviceを使ってCSS文字列を取得（キャッシュがあれば一瞬で返る）
      const css = await this.styleService.fetchThemeCss(targetTheme);

      // プレビュー内に <style> タグを探す、無ければ作る
      let styleEl = doc.getElementById(this.config.STYLE_ID);
      if (!styleEl) {
        styleEl = doc.createElement('style');
        styleEl.id = this.config.STYLE_ID;
        doc.head.appendChild(styleEl);
      }
      
      // CSSの中身が違う場合のみ書き換える（画面のチラつき防止）
      if (styleEl.textContent !== css) {
        styleEl.textContent = css;
        console.log(`[PreviewController] 🎨 Theme "${targetTheme}" applied to preview.`);
      }
      
    } catch(e) {
      // エディタの高速タイピング中など、DOMアクセスエラーが出る場合は無視
    }
  }

  // プレビューの再描画を監視する
  setupObserver(iframe) {
    if (this.observer) {
      this.observer.disconnect();
    }

    try {
      const doc = iframe.contentDocument || iframe.contentWindow.document;
      if (!doc || !doc.head || !doc.body) return;

      // デバウンス（連続発火防止）用のタイマー変数
      let timeoutId = null;

      // Marpがプレビューを書き換えたら、applyTheme を実行する（デバウンス制御付き）
      this.observer = new MutationObserver(() => {
        // 新しい変更を検知するたびに、前回のタイマー予約をキャンセルする
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
        
        // 連続したDOM変更が落ち着いてから150ms後に1回だけ実行する
        timeoutId = setTimeout(async () => {
          await this.applyTheme(iframe);
        }, 150);
      });

      // head（タグ消去対策）と body（内容変更対策）の両方を監視
      this.observer.observe(doc.head, { childList: true });
      this.observer.observe(doc.body, { childList: true, subtree: true });
    } catch(e) {
      // iframeアクセスエラー等（クロスオリジン制約など）は無視して動作を継続
      console.warn("[PreviewController] Observer setup skipped.", e);
    }
  }
}
