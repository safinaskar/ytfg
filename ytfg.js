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
  },

  internalError(message){
    const fullMessage = chrome.runtime.id + ": internal error: " + message;
    console.error(fullMessage);
    alert(fullMessage); // Не печатает backtrace, и это не важно
    throw Error(fullMessage);
  },

  // Поведение Chromium может измениться (см. комменты 0 и 1 к https://crbug.com/969672 ), поэтому документация к моим функциям, открывающим вкладки, должна описывать не что они делают, а что они должны делать, т. е. какое поведение от них требуется. Максимально общим образом. Чтобы после смены поведения Chromium можно было сменить реализацию функций без смены кода, который использует эти функции
  // Открывает страницу расширения в новой вкладке. Открывает в этом же окне, если это возможно. Если нет, то в новом отдельном окне
  // В своих расширениях я не рассматриваю совсем уж редкий случай открытия новой вкладки из невкладочных окон, таких как окна PWA
  async extensionPageNewTab(currentTab, page){
    if(/:\/\//.exec(page)){
      ytfg.internalError("есть \"://\"");
    }

    if((!chrome.runtime.getManifest().incognito || chrome.runtime.getManifest().incognito === "spanning") && currentTab.incognito){
      await ytfg.p(chrome.windows.create)({ url: page });
    }else{
      await ytfg.p(chrome.tabs.create)({ url: page });
    }
  },

  // Открывает страницу расширения в новой вкладке. Гарантированно в этом же окне
  async extensionPageForceNewTab(page){
    if(/:\/\//.exec(page)){
      ytfg.internalError("есть \"://\"");
    }

    if(!chrome.runtime.getManifest().incognito || chrome.runtime.getManifest().incognito === "spanning"){
      ytfg.internalError("Неправильно настроен manifest");
    }

    await ytfg.p(chrome.tabs.create)({ url: page });
  },

  // Реализует идиому: добавляем listener и ждём пока listener запустится и скажет, что можно больше не слушать
  // Реализовано так, чтобы в любом случае гарантировать удаление listener'а
  // Моя функция принимает именно обычный callback, а не асинхронный, иначе callback может сообщить, что можно больше не слушать, в тот момент, когда уже успел запуститься ещё один instance callback'а
  listen(event, callback){
    return new Promise((resolve, reject) => {
      event.addListener(function f(...args){
        try{
          const result = callback.apply(null, args);
          if(!result.continue){
            event.removeListener(f);
            resolve(result.result);
          }
        }catch(e){
          event.removeListener(f);
          reject(e);
        }
      });
    });
  },

  listenDOM(target, type, callback){
    return new Promise((resolve, reject) => {
      target.addEventListener(type, function f(...args){
        try{
          const result = callback.apply(null, args);
          if(!result.continue){
            target.removeEventListener(type, f);
            resolve(result.result);
          }
        }catch(e){
          target.removeEventListener(type, f);
          reject(e);
        }
      });
    });
  },

  waitForMutation(target, options, callback){
    return new Promise((resolve, reject) => {
      new MutationObserver((changes, observer) => {
        try{
          const result = callback(changes, observer);
          if(!result.continue){
            observer.disconnect();
            resolve(result.result);
          }
        }catch(e){
          observer.disconnect();
          reject(e);
        }
      }).observe(target, options);
    });
  },

  sleep(ms){
    return new Promise((resolve, reject) => {
      try{
        const n = setTimeout(() => resolve(undefined), ms);

        if(typeof n !== "number" || n <= 0){
          reject(Error("Failed"));
        }
      }catch(e){
        reject(e);
      }
    });
  },

  // Создаёт ровно одну ноду из переданного HTML
  n(html){
    const div = document.createElement("div");
    div.innerHTML = html;
    if(div.childNodes.length !== 1){
      throw Error("Count of nodes is not 1");
    }
    const result = div.childNodes[0];
    result.remove();
    return result;
  }
};
