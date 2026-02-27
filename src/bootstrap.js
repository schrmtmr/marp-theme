// src/bootstrap.js
import { CONFIG } from './config.js';

// 【変更点1】StyleService のコメントアウトを外す
import { StyleService } from './services/StyleService.js';

// ※ Controllerはまだ未実装なのでコメントアウトのままにしておきます
// import { PreviewController } from './controllers/PreviewController.js';
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
    // 【変更点2】Serviceの初期化コメントアウトを外す
    const styleService = new StyleService(CONFIG);
    w._marpOrchestrator.service = styleService;
    console.log("[Marp Orchestrator] 📦 StyleService initialized.");

    // (Controllerの初期化は次回行います)
    // const previewCtrl = new PreviewController(styleService, CONFIG);
    // const exportCtrl = new ExportController(styleService, CONFIG);
    // w._marpOrchestrator.controllers.preview = previewCtrl;
    // w._marpOrchestrator.controllers.export = exportCtrl;
    // await previewCtrl.start();
    // await exportCtrl.start();

    w._marpOrchestrator.status = 'ready';
    console.log("[Marp Orchestrator] ✅ System Ready.");

  } catch (error) {
    console.error("[Marp Orchestrator] ❌ Initialization failed:", error);
    w._marpOrchestrator.status = 'error';
  }
})();
