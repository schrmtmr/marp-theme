// src/services/StyleService.js
export class StyleService {
  constructor(config) {
    this.config = config;
    this.cache = new Map(); // テーマ名 -> CSS文字列 のキャッシュ
  }

  // 抽出1：プレビュー用（DOMからテーマ名を読み取る）
  getThemeFromDOM(doc) {
    if (!doc) return 'main';
    const trigger = doc.querySelector(this.config.TRIGGER_SELECTOR);
    if (trigger && trigger.dataset.theme) {
      return trigger.dataset.theme;
    }
    return 'main'; // 指定がない場合はデフォルトテーマ
  }

  // 抽出2：エクスポート用（Markdown文字列からテーマ名を読み取る）
  getThemeFromMarkdown(markdown) {
    if (!markdown) return 'main';
    // 正規表現で data-theme="xxx" を探す
    const themeRegex = /<img[^>]*data-hook=["']?marp-style["']?[^>]*data-theme=["']([^"']+)["'][^>]*>/i;
    const match = markdown.match(themeRegex);
    if (match && match[1]) {
      return match[1];
    }
    return 'main'; // 指定がない場合はデフォルトテーマ
  }

  // テーマ名からCSSファイルのURLを構築する
  buildUrl(themeName) {
    // 拡張子(.css)がなければ補完する
    const fileName = themeName.endsWith('.css') ? themeName : `${themeName}.css`;
    return `${this.config.THEME_BASE_URL}/${fileName}`;
  }

  // CSSを取得する（キャッシュ機能付き、エラー時はmainにフォールバック）
  async fetchThemeCss(themeName) {
    if (!themeName) themeName = 'main';
    
    // 1. キャッシュがあれば即座に返す
    if (this.cache.has(themeName)) {
      return this.cache.get(themeName);
    }

    const url = this.buildUrl(themeName);
    try {
      console.log(`[StyleService] 📥 Fetching theme: "${themeName}" from ${url}`);
      // ※通信フックの対象外（Marp外部）へのリクエストなので安全にfetch可能
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status}`);
      }
      
      const css = await response.text();
      // 2. 取得成功したらキャッシュに保存
      this.cache.set(themeName, css);
      return css;
    } catch (error) {
      console.warn(`[StyleService] ⚠️ Failed to load theme "${themeName}". Falling back to default.`, error);
      
      // 3. エラー時のフォールバック（mainテーマを再試行）
      if (themeName !== 'main') {
        return await this.fetchThemeCss('main');
      }
      
      return ''; // 最終防衛線（CSSなし）
    }
  }
}
