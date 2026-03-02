// src/services/IconService.js

export class IconService {
  constructor(config) {
    this.config = config;
    this.cache = new Map(); // URL -> SVG文字列 のメモリキャッシュ
  }

  // Iconify APIからSVGを取得し、インライン用に最適化して返す
  async fetchIconSvg(url) {
    // 1. キャッシュがあれば即座に返す
    if (this.cache.has(url)) {
      return this.cache.get(url);
    }

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status}`);
      }
      
      let svgText = await response.text();

      // CSSで色やサイズを制御できるよう、Web標準の属性を注入・クリーンアップ
      // 1. 専用クラスと currentColor を注入し、親要素の色を継承させる
      svgText = svgText.replace(/<svg\s+/, '<svg class="marp-iconify" fill="currentColor" ');
      
      // 2. 元のwidth/height属性を剥奪（CSS側でサイズ制御するため）
      svgText = svgText.replace(/\s(width|height)="[^"]*"/g, '');

      // 2. 取得成功したらキャッシュに保存
      this.cache.set(url, svgText);
      return svgText;

    } catch (error) {
      if (this.config.DEBUG_MODE) {
        console.warn(`[IconService] ⚠️ Failed to fetch icon SVG: ${url}`, error);
      }
      // エラー時はnullを返し、置換処理をスキップさせる
      return null;
    }
  }

  // エクスポート用：Markdown内の画像記法(![])を、SVGタグ文字列へ一括置換
  async replaceIconsInMarkdown(markdown) {
    if (!markdown || typeof markdown !== 'string') return markdown;
    
    // 全てのアイコン記法を抽出
    const matches =[...markdown.matchAll(this.config.ICON_MARKDOWN_REGEX)];
    if (matches.length === 0) return markdown;

    // 重複URLを排除して非同期で一括取得
    const urls =[...new Set(matches.map(m => m[1]))];
    const fetchPromises = urls.map(async url => {
      const svg = await this.fetchIconSvg(url);
      return { url, svg };
    });
    
    const svgResults = await Promise.all(fetchPromises);
    const svgMap = new Map(svgResults.map(r => [r.url, r.svg]));

    // 取得したSVG文字列でMarkdown文字列を置換
    let result = markdown;
    for (const match of matches) {
      const fullMatch = match[0];
      const url = match[1];
      const svg = svgMap.get(url);
      if (svg) {
        result = result.replace(fullMatch, svg);
      }
    }
    return result;
  }
}
