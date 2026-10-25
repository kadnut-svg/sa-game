/**
 * electron/preload.cjs
 * Preload Script สำหรับเชื่อมโยง Electron Main Process กับ Vite Frontend อย่างปลอดภัย
 */

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  isDesktopApp: true,
  getDesktopInfo: () => ipcRenderer.invoke('desktop:get-info')
});
