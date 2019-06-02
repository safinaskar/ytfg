// 2018DECTMP

"use strict";

const ytfg = {
  // "p" for "promisify"
  p(f){
    return (...args) => new Promise((resolve, reject) => {
      args.push(result => {
        if(chrome.runtime.lastError){
          reject(Error(chrome.runtime.lastError.message));
        }
        resolve(result);
      });
      f.apply(null, args);
    });
  },

  // Asynchronous DirectoryEntry
  ade: {
    getFile(entry, path, options){
      return new Promise((resolve, reject) => {
        entry.getFile(path, options, resolve, error => { reject(Error(error.message)); });
      });
    }
  },

  // Asynchronous FileEntry
  afe: {
    file(entry){
      return new Promise((resolve, reject) => {
        entry.file(resolve, error => { reject(Error(error.message)); });
      });
    }
  },

  async fileFromExtension(path){
    return await ytfg.afe.file(await ytfg.ade.getFile(await ytfg.p(chrome.runtime.getPackageDirectoryEntry)(), path, {}));
  },

  // Для обработки результата chromium-exec
  bufferToStr(buffer){
    return new TextDecoder().decode(new Uint8Array(buffer));
  }
};
