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

  // Для, например, chrome.devtools.inspectedWindow.eval . Загрузить сперва вспомогательный скрипт нельзя, иначе будет загрязнено пространство имён. Поэтому приходится именно представить функцию в виде строки. В будущем можно попробовать заменить этот механизм на загрузку содержимого этого скрипта с помощью fetch или chrome.runtime.getPackageDirectoryEntry
  promisifyAsString: `(f => {
    return (...args) => new Promise((resolve, reject) => {
      args.push(result => {
        if(chrome.runtime.lastError){
          reject(Error(chrome.runtime.lastError.message));
        }
        resolve(result);
      });
      f.apply(null, args);
    });
  })`
};
