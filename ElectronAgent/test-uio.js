const { uIOhook, UiohookKey } = require('uiohook-napi');
console.log("uiohook loaded");
uIOhook.on('input', (e) => {});
uIOhook.start();
setTimeout(() => {
  uIOhook.stop();
  console.log("uiohook stopped");
  process.exit(0);
}, 2000);
