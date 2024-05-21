const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  setTitle: (title) => ipcRenderer.send('set-title', title),
  browserWindow: (file, height, width) => ipcRenderer.send('create-window', file, height, width),
  openFile: () => ipcRenderer.invoke('open-file-dialog'),
  saveSettings: (key, value) => ipcRenderer.send('save-settings', key, value),
  getSettings: () => ipcRenderer.invoke('get-settings'),
  getModData: (url) => ipcRenderer.invoke('get-mod-data', url),
  downloadMod: (url, fileName) => ipcRenderer.invoke('download-mod', url, fileName)
})