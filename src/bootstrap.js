// src/bootstrap.js
import { CONFIG } from './config.js';
import { StyleService } from './services/StyleService.js';

// 【変更点1】PreviewController のコメントアウトを外す
import { PreviewController } from './controllers/PreviewController.js';

// ※ ExportController は次回実装します
// import { ExportController } from './controllers/ExportController.js';

(async function initOrchestrator() {
  const w = window.top; 

  if (w._marpOrchestrator) {
    return;
  }

  console.log("[Marp Orchestrator] 🚀 Bootstrapping system...");

  w._marpOrchestrator = {
    status: 'initializing',
    config: CONFIG,
    service: null,
    controllers: {}
  };

  try {
    const styleService = new StyleService(CONFIG);
    w._marpOrchestrator.service = styleService;
    console.log("[Marp Orchestrator] 📦 StyleService initialized.");

    // 【変更点2】PreviewController の初期化と起動のコメントアウトを外す
    const previewCtrl = new PreviewController(styleService, CONFIG);
    w._marpOrchestrator.controllers.preview = previewCtrl;
    
    // const exportCtrl = new ExportController(styleService, CONFIG);
    // w._marpOrchestrator.controllers.export = exportCtrl;

    await previewCtrl.start();
    // await exportCtrl.start();

    w._marpOrchestrator.status = 'ready';
    console.log("[Marp Orchestrator] ✅ System Ready.");

  } catch (error) {
    console.error("[Marp Orchestrator] ❌ Initialization failed:", error);
    w._marpOrchestrator.status = 'error';
  }
})();
