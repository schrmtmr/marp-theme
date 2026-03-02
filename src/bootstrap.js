// src/bootstrap.js

import { CONFIG } from './config.js';
import { StyleService } from './services/StyleService.js';
import { PreviewController } from './controllers/PreviewController.js';
import { ExportController } from './controllers/ExportController.js';

(async function initOrchestrator() {
  const w = window.top; 

  // 二重起動防止
  if (w._marpOrchestrator) {
    if (CONFIG.DEBUG_MODE) {
      console.warn("[Marp Orchestrator] ⚠️ Already initialized. Skipping bootstrap.");
    }
    return;
  }

  // グローバルステートの初期化
  w._marpOrchestrator = {
    status: 'initializing',
    config: CONFIG,
    service: null,
    controllers: {}
  };

  try {
    if (CONFIG.DEBUG_MODE) {
      console.log("[Marp Orchestrator] 🚀 Starting initialization...");
    }

    // Service層の初期化
    const styleService = new StyleService(CONFIG);
    w._marpOrchestrator.service = styleService;

    // Controller層の初期化とDI
    const previewCtrl = new PreviewController(styleService, CONFIG);
    w._marpOrchestrator.controllers.preview = previewCtrl;
    
    const exportCtrl = new ExportController(styleService, CONFIG);
    w._marpOrchestrator.controllers.export = exportCtrl;

    // 各コントローラーの起動
    await previewCtrl.start();
    await exportCtrl.start();

    // 完了ステータスの更新
    w._marpOrchestrator.status = 'ready';
    
    if (CONFIG.DEBUG_MODE) {
      console.log("[Marp Orchestrator] ✅ Initialization complete. System is ready.");
    }

  } catch (error) {
    // エラーハンドリング
    w._marpOrchestrator.status = 'error';
    
    if (CONFIG.DEBUG_MODE) {
      console.error("[Marp Orchestrator] ❌ Initialization failed:", error);
    }
  }
})();
