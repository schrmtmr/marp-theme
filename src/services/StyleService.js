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
    if (!markdown || typeof markdown !== 'string') return this.config.DEFAULT_THEME_NAME;
    
    try {
      // 正規表現では対象範囲を絞り込むだけに留める
      const imgMatches = markdown.match(/<img[^>]+data-hook=["']?marp-style["']?[^>]*>/gi);
      
      if (imgMatches && imgMatches.length > 0) {
        // DOMParserを使って安全かつ確実に属性をパースする
        const parser = new DOMParser();
        const doc = parser.parseFromString(imgMatches[0], 'text/html');
        const imgEl = doc.querySelector('img[data-hook="marp-style"]');
        
        if (imgEl && imgEl.dataset.theme) {
          return imgEl.dataset.theme;
        }
      }
    } catch (e) {
      console.warn("[StyleService] ⚠️ Theme parsing failed, using default.", e);
    }
    
    return this.config.DEFAULT_THEME_NAME; // エラー時・指定がない場合はデフォルト
  }

  // テーマ名からCSSファイルのURLを構築する
  buildUrl(themeName) {
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
      // 通信フックの対象外（Marp外部）へのリクエストなので安全にfetch可能
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status}`);
      }
      
      const css = await response.text();
      // 2. 取得成功したらキャッシュに保存
      this.cache.set(themeName, css);
      return css;
      
    } catch (error) {
      console.warn(`[StyleService] ⚠️ Failed to fetch theme "${themeName}":`, error);
      
      // 3. エラー時のフォールバック
      // デフォルトテーマ自身の取得に失敗した場合の無限ループを完全防止
      if (themeName !== this.config.DEFAULT_THEME_NAME) {
        return await this.fetchThemeCss(this.config.DEFAULT_THEME_NAME);
      }
      
      // デフォルトテーマすら取得できなかった場合は、エラーを起こさず空文字を返す
      return '';
    }
  }
}
