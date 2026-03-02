// src/config.js

export const CONFIG = {
  // デバッグモード（trueにするとCORSエラー時などにコンソールへ警告を出力）
  DEBUG_MODE: false,

  // テーマファイルが配置されているベースURL
  THEME_BASE_URL: 'https://raw.githack.com/schrmtmr/marp-theme/main/themes',
  
  // デフォルトのテーマ名（拡張子なしで定義）
  DEFAULT_THEME_NAME: 'corp-blue',
  
  // DOM上で設定を読み取るためのトリガー画像のセレクタ
  TRIGGER_SELECTOR: 'img[data-hook="marp-style"]',
  
  // プレビュー画面（iframe）に注入するstyleタグのID
  STYLE_ID: 'marp-custom-preview-style',

  // エクスポート処理をフックするためのAPIエンドポイント
  EXPORT_API_ENDPOINT: '/api/export/',

  // エクスポート時にMarkdownからトリガー画像タグを完全に削除するための正規表現
  TRIGGER_IMG_REGEX: /<img[^>]*data-hook=["']?marp-style["']?[^>]*>/gi,

  // エクスポート時にMarkdown文字列からテーマ名（data-theme属性値）を抽出するための正規表現
  THEME_EXTRACT_REGEX: /<img[^>]*data-hook=["']?marp-style["']?[^>]*data-theme=["']([^"']+)["'][^>]*>/i,

  // PDFエクスポート時にアイコン描画消失を防ぐため、Markdown記法を検出する正規表現
  // キャプチャグループ: 1=altテキスト(任意), 2=画像URL
  ICON_REGEX: /!\[(.*?)\]\((https:\/\/api\.iconify\.design\/[^\)]+)\)/gi
};
