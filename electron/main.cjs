/**
 * electron/main.cjs
 * Electron Main Process สำหรับรันแอปพลิเคชันเกมบน Desktop (Windows / macOS / Linux)
 * ทำหน้าที่สตาร์ท Node.js + SQLite Backend Server อัตโนมัติ และเปิดหน้าต่าง Vite Frontend
 */

const { app, BrowserWindow, ipcMain, shell } = require('electron');
const path = require('node:path');
const fs = require('node:fs');

let mainWindow = null;
let backendServer = null;
const API_PORT = 3456;

async function bootBackend() {
  try {
    const serverModulePath = path.join(__dirname, '..', 'backend', 'server.js');
    const fileUrl = new URL(`file://${serverModulePath.replace(/\\/g, '/')}`).href;
    const { startBackendServer } = await import(fileUrl);
    backendServer = await startBackendServer(API_PORT);
  } catch (err) {
    console.error('[Electron Main] ไม่สามารถสตาร์ท Backend SQLite ได้:', err);
  }
}

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1360,
    height: 860,
    minWidth: 1024,
    minHeight: 700,
    title: 'IS Architect Quest — เกมจำแนกประเภทของระบบสารสนเทศ (ชั้นปีที่ 2 • หลักสูตรแกนกลาง 2560)',
    backgroundColor: '#0f172a',
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  const devServerUrl = process.env.VITE_DEV_SERVER_URL || (process.argv.includes('--dev') ? 'http://localhost:5173' : null);
  const distIndex = path.join(__dirname, '..', 'dist', 'index.html');

  if (devServerUrl) {
    mainWindow.loadURL(devServerUrl);
  } else if (fs.existsSync(distIndex)) {
    mainWindow.loadFile(distIndex);
  } else {
    mainWindow.loadURL('http://localhost:5173');
  }

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });
}

app.whenReady().then(async () => {
  await bootBackend();

  ipcMain.handle('desktop:get-info', () => ({
    isElectron: true,
    platform: process.platform,
    electronVersion: process.versions.electron,
    nodeVersion: process.versions.node,
    apiBaseUrl: `http://127.0.0.1:${API_PORT}/api`
  }));

  createMainWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (backendServer && typeof backendServer.close === 'function') {
    backendServer.close();
  }
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
