const os = require('os');
const path = require('path')
const Toastify = require('toastify-js');
const { contextBridge, ipcRenderer } = require('electron');

// getting the os
contextBridge.exposeInMainWorld('ipcRenderer', {
    send: (channel, data) => ipcRenderer.send(channel, data),
    on: (channel, func) => ipcRenderer.on(channel, (event, ...args) => func(...args))
});

contextBridge.exposeInMainWorld('path', {
    join: (...args) => path.join(...args)
});

contextBridge.exposeInMainWorld('Toastify', {
    toast: (options) => Toastify(options).showToast()
});

contextBridge.exposeInMainWorld('os', {
    homedir: () => os.homedir()
});

// We can do the following if we want versions
//contextBridge.exposeInMainWorld('versions', {
    //node: () => process.versions.node,
    //chrome: () => process.versions.chrome,
    //electron: () => process.versions.electron,
    // we can also expose variable, not just functions
//});