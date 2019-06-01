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
  }
};
