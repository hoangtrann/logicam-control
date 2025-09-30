#!/usr/bin/env node

import { WebcamTUI } from './ui.js';

function main() {
  console.log('Starting LogiCam Control...');

  try {
    const app = new WebcamTUI();
    app.run();
  } catch (error) {
    console.error('Failed to start LogiCam Control:', error);
    process.exit(1);
  }
}

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

main();