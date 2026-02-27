// src/bootstrap.js
import { CONFIG } from './config.js';

// ※ServiceとControllerは後続のステップで実装するため、今回はコメントアウトしてあります。
// import { StyleService } from './services/StyleService.js';
// import { PreviewController } from './controllers/PreviewController.js';
// import { ExportController } from './controllers/ExportController.js';

(async function initOrchestrator() {
  const w = window.top; // Marpのトップウィンドウコンテキスト

  // 【リスク対策】二重読み込み防止（シングルトン保証）
  // すでに初期化済みの場合は処理をスキップする
  if (w._marpOrchestrator) {
    return;
  }

  console.log("[Marp Orchestrator] 🚀 Bootstrapping system...");

  // グローバルに状態とインスタンスを保持する「司令塔」のオブジェクトを作成
  w._marpOrchestrator = {
    status: 'initializing',
    config: CONFIG,
    service: null,
    controllers: {}
  };

  try {
    // -------------------------------------------------------------
    // 以降のステップでモジュールの中身を実装したら、コメントを外して結合します。
    // -------------------------------------------------------------
    
    // 1. Serviceの初期化 (Data Layer)
    // const styleService = new StyleService(CONFIG);
    // w._marpOrchestrator.service = styleService;

    // 2. Controllersの初期化とDI (UI / Network Layer)
    // const previewCtrl = new PreviewController(styleService, CONFIG);
    // const exportCtrl = new ExportController(styleService, CONFIG);
    // w._marpOrchestrator.controllers.preview = previewCtrl;
    // w._marpOrchestrator.controllers.export = exportCtrl;

    // 3. システム起動
    // await previewCtrl.start();
    // await exportCtrl.start();

    w._marpOrchestrator.status = 'ready';
    console.log("[Marp Orchestrator] ✅ System Ready.");

  } catch (error) {
    console.error("[Marp Orchestrator] ❌ Initialization failed:", error);
    w._marpOrchestrator.status = 'error';
  }
})();
