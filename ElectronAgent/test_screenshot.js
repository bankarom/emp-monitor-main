const { app, desktopCapturer } = require('electron');

app.whenReady().then(async () => {
    try {
        const sources = await desktopCapturer.getSources({ types: ['screen'] });
        console.log("Sources:", JSON.stringify(sources.map(s => ({name: s.name, id: s.id}))));
    } catch(e) {
        console.error(e);
    }
    app.quit();
});
