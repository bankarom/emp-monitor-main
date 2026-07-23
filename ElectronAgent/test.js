const { app, BrowserWindow } = require("electron");

app.whenReady().then(() => {
    console.log("Electron is ready");

    const win = new BrowserWindow({
        width: 600,
        height: 400
    });

    win.loadURL("data:text/html,<h1>Hello EmpMonitor</h1>");
});