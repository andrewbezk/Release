const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('spaceExpedition', {
  state: () => ipcRenderer.invoke('game:state'),
  create: payload => ipcRenderer.invoke('game:create', payload),
  assign: payload => ipcRenderer.invoke('game:assign', payload),
  act: payload => ipcRenderer.invoke('game:act', payload),
  save: payload => ipcRenderer.invoke('game:save', payload),
  load: payload => ipcRenderer.invoke('game:load', payload),
  loadLast: () => ipcRenderer.invoke('game:load-last'),
  newSession: () => ipcRenderer.invoke('game:new-session'),
  importCharacters: () => ipcRenderer.invoke('game:import'),
  clearLog: () => ipcRenderer.invoke('game:clear-log')
});
