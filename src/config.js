// src/config.js
export const CONFIG = {
  // テーマファイルが配置されているベースURL
  THEME_BASE_URL: 'https://raw.githack.com/schrmtmr/marp-theme/main/themes',
  
  // デフォルトのテーマファイル名
  DEFAULT_THEME: 'main.css',
  
  // DOM上で設定を読み取るためのトリガー画像のセレクタ
  TRIGGER_SELECTOR: 'img[data-hook="marp-style"]',
  
  // プレビュー画面（iframe）に注入するstyleタグのID
  STYLE_ID: 'marp-custom-preview-style'
};
