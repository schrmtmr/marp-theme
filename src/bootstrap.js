// src/bootstrap.js
import { CONFIG } from './config.js';
import { StyleService } from './services/StyleService.js';
import { PreviewController } from './controllers/PreviewController.js';

// 【最終変更点】ExportController を読み込む
import { ExportController } from './controllers/ExportController.js';

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

    const previewCtrl = new PreviewController(styleService, CONFIG);
    w._marpOrchestrator.controllers.preview = previewCtrl;
    
    // 【最終変更点】ExportControllerを初期化して登録
    const exportCtrl = new ExportController(styleService, CONFIG);
    w._marpOrchestrator.controllers.export = exportCtrl;

    await previewCtrl.start();
    
    // 【最終変更点】ExportControllerを起動（フック開始）
    await exportCtrl.start();

    w._marpOrchestrator.status = 'ready';
    console.log("[Marp Orchestrator] ✅ System Ready.");

  } catch (error) {
    console.error("[Marp Orchestrator] ❌ Initialization failed:", error);
    w._marpOrchestrator.status = 'error';
  }
})();
