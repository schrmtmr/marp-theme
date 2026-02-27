// src/bootstrap.js

import { CONFIG } from './config.js';
import { StyleService } from './services/StyleService.js';
import { PreviewController } from './controllers/PreviewController.js';
import { ExportController } from './controllers/ExportController.js';

(async function initOrchestrator() {
  const w = window.top; 

  if (w._marpOrchestrator) {
    return;
  }

  w._marpOrchestrator = {
    status: 'initializing',
    config: CONFIG,
    service: null,
    controllers: {}
  };

  try {
    const styleService = new StyleService(CONFIG);
    w._marpOrchestrator.service = styleService;

    const previewCtrl = new PreviewController(styleService, CONFIG);
    w._marpOrchestrator.controllers.preview = previewCtrl;
    
    const exportCtrl = new ExportController(styleService, CONFIG);
    w._marpOrchestrator.controllers.export = exportCtrl;

    await previewCtrl.start();
    await exportCtrl.start();

    w._marpOrchestrator.status = 'ready';

  } catch (error) {
    console.error("[Marp Orchestrator] ❌ Initialization failed:", error);
    w._marpOrchestrator.status = 'error';
  }
})();
