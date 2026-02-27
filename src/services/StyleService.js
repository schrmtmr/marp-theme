// src/services/StyleService.js
export class StyleService {
  constructor(config) {
    this.config = config;
    this.cache = new Map(); // テーマ名 -> CSS文字列 のキャッシュ
  }

  // 抽出1：プレビュー用（DOMからテーマ名を読み取る）
  getThemeFromDOM(doc) {
    if (!doc) return this.config.DEFAULT_THEME_NAME;
    const trigger = doc.querySelector(this.config.TRIGGER_SELECTOR);
    if (trigger && trigger.dataset.theme) {
      return trigger.dataset.theme;
    }
    return this.config.DEFAULT_THEME_NAME; // 指定がない場合はデフォルトテーマ
  }

  // 抽出2：エクスポート用（Markdown文字列からテーマ名を読み取る）
  getThemeFromMarkdown(markdown) {
    if (!markdown) return this.config.DEFAULT_THEME_NAME;
    
    // 【改善】属性の順序に依存しない堅牢な抽出ロジック
    // まず data-hook="marp-style" を持つ img タグを抽出
    const imgMatch = markdown.match(/<img[^>]*data-hook=["']?marp-style["']?[^>]*>/i);
    if (imgMatch) {
      // 抽出した img タグの中から data-theme の値を安全に取得
      const themeMatch = imgMatch[0].match(/data-theme=["']([^"']+)["']/i);
      if (themeMatch && themeMatch[1]) {
        return themeMatch[1];
      }
    }
    return this.config.DEFAULT_THEME_NAME; // 指定がない場合はデフォルトテーマ
  }

  // テーマ名からCSSファイルのURLを構築する
  buildUrl(themeName) {
    // 拡張子(.css)がなければ補完する
    const fileName = themeName.endsWith('.css') ? themeName : `${themeName}.css`;
    return `${this.config.THEME_BASE_URL}/${fileName}`;
  }

  // CSSを取得する（キャッシュ機能付き、エラー時はデフォルトにフォールバック）
  async fetchThemeCss(themeName) {
    if (!themeName) themeName = this.config.DEFAULT_THEME_NAME;
    
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
      
      // 3. エラー時のフォールバック（デフォルトテーマを再試行）
      if (themeName !== this.config.DEFAULT_THEME_NAME) {
        return await this.fetchThemeCss(this.config.DEFAULT_THEME_NAME);
      }
      
      return ''; // 最終防衛線（CSSなし）
    }
  }
}
