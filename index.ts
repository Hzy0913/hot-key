import * as keymaster from 'keymaster';
import { Options, HotKeyConfigType, ControllerType, QueryNodeType, HotKeyFactoryType,
  RegisterKey } from './types';
import { queryHotKey, countClosure } from './utils';

const keyboard = keymaster.noConflict();

const hotKeyFactory: HotKeyFactoryType = {
  constructor({
    keys = [],
    handler,
    observerCallback,
    pressed = () => {},
    log = false,
    hotKeyConfig = {},
    operationControl = {},
    filter,
    clickBefore,
  }) {
    keyboard(keys.join(), pressed);
    filter && (keyboard.filter = filter);

    const observe = observerCallback && new MutationObserver(observerCallback);
    hotKeyFactory.showLog = log;
    hotKeyFactory.hotKeyConfig = hotKeyConfig;
    hotKeyFactory.operationControl = operationControl;
    hotKeyFactory.clickBeforeProp = clickBefore;

    const controller: ControllerType = {
      keys,
      hotKeyConfig,
      operationControl,
      action: this.actuator,
      find: this.find,
      setFocusId: this.setFocusId,
      getFocusId: this.getFocusId.bind(this),
      register: this.register,
      unRegister: this.unRegister,
      setFocus: this.setFocus,
      clearFocus: this.clearFocus,
      observerTrigger: observerCallback,
      bind: this.bind,
      unbind: this.unbind,
      on: this.on,
      off: this.off,
      observer(dom, config = { attributes: true, childList: true, subtree: true }) {
        const containerDom = dom || document.body;
        observe.observe(containerDom, config);
      },
    };
    if (typeof handler === 'string') {
      if (window[handler]) throw ` The ${handler} property already exists in the window `;
      window[handler] = controller;
    }
    return controller;
  },
  asyncQueryHotKeyDom(operator, currentDom, polling) {
    const queryCount = countClosure();
    async function pollQueryDom() {
      const target = queryHotKey(operator, currentDom);
      if (target) return target;

      const result = await queryCount(polling);
      if (result === 'done') return;

      return pollQueryDom();
    }

    return pollQueryDom();
  },
  dynamicAction(keyName: string, target: HTMLElement, polling?: boolean) {
    const { dynamic } = this.hotKeyConfig[keyName] as HotKeyConfigType || { dynamic: undefined };
    if (!dynamic) return;

    const { dynamicSelector = {} } = this.operationControl[this.focusId] || {};
    const targetKey = Object.keys(dynamicSelector).find(key => key.includes(keyName));
    const domSelector = dynamicSelector[targetKey];
    const actionNode = hotKeyFactory.queryNode(target).find(domSelector, undefined,
      polling) as QueryNodeType;

    actionNode.currentNode && actionNode.click(keyName, actionNode);

    if (!actionNode.currentNode) {
      hotKeyFactory.log(true,
        { waring: `the [${keyName}] hot-key of dynamic trigger Dom not found` });
      return true;
    }

    return actionNode.currentNode;
  },
  async triggerRegister(keyName, callback, polling) {
    if (!hotKeyFactory.registerKey) return;

    const trigger = this.registerKey.find(item => item.key === keyName);
    if (!trigger) return;

    const { container, className } = trigger;
    const containerDom = await this.asyncQueryHotKeyDom(container, undefined, false);
    let targetNode: QueryNodeType;
    const classNameList = Array.isArray(className) ? className : [className];

    for (let i = 0; i < classNameList.length; i++) {
      const selectorName = classNameList[i];
      const queryNode = await hotKeyFactory.queryNode(containerDom)
        .find(selectorName, undefined, polling);
      targetNode = queryNode;
      if (queryNode.currentNode) break;
    }

    if (targetNode.currentNode) {
      targetNode.click(keyName, targetNode);
      hotKeyFactory.listener(callback, targetNode, 0, keyName);
    }

    hotKeyFactory.log(!targetNode.currentNode,
      { waring: 'register hot-key trigger Dom not found' });
    return true;
  },
  register(keyName) {
    return containerName => (className) => {
      const registerKey: RegisterKey = {
        className,
        key: keyName,
        container: containerName,
      };

      if (!hotKeyFactory.registerKey) {
        hotKeyFactory.registerKey = [registerKey];
      } else {
        const addKey = [...hotKeyFactory.registerKey.filter(item =>
          item.key !== keyName), registerKey];
        hotKeyFactory.registerKey = addKey;
      }
    };
  },
  unRegister(keyName) {
    if (hotKeyFactory.registerKey) {
      const keys = hotKeyFactory.registerKey.filter(item => item.key !== keyName);
      hotKeyFactory.registerKey = keys;
    }
  },
  queryNode(target) {
    const {
      find, next, prev, setFocus, clearFocus,
    } = this as QueryNodeType;  // tslint:disable-line

    return {
      find,
      next,
      prev,
      setFocus,
      clearFocus,
      currentNode: target,
      click(keyName, node) {
        const notClick = hotKeyFactory.clickBefore(keyName, node);
        notClick || this.currentNode.click();
      },
    };
  },
  rejectDoAction(keyName) {
    const id = hotKeyFactory.getFocusId();
    if (!id) return true;

    const { control } = this.operationControl[id] || { control: undefined };

    if (typeof control === 'string' && control === 'ALL') return;
    if (!control || !(Array.isArray(control) && control.includes(keyName))) return true;
  },
  action(keyName, className, isPolling) {
    return new Promise(async (resolve, reject) => {
      const target = await this.asyncQueryHotKeyDom(className, undefined, isPolling);

      const dynamicActionTarget = hotKeyFactory.dynamicAction(keyName, target, isPolling);
      if (dynamicActionTarget) return resolve(dynamicActionTarget);

      if (target) {
        const hotKeyProto = hotKeyFactory.queryNode(target);

        hotKeyProto.click(keyName, hotKeyProto);

        resolve(hotKeyProto);
      } else {
        hotKeyFactory.log(true, { waring: `not found hot key target of [${className}]` });
      }
    });
  },
  async actionCompose(operation, keyName, callback, isPolling) {
    let actionPromise = null;
    const { listener } = hotKeyFactory;

    for (let index = 0; index < operation.length; index++) {
      const className = operation[index];

      if (!actionPromise) {
        actionPromise = hotKeyFactory.action(keyName, className, isPolling);
        if (index === (operation.length - 1)) {
          const res = await actionPromise;
          listener(callback, res, index, keyName);
        }
      } else {
        const res = await actionPromise;
        listener(callback, res, index - 1, keyName);

        actionPromise = hotKeyFactory.action(keyName, className, isPolling);

        if (index === (operation.length - 1)) {
          const res = await actionPromise;
          listener(callback, res, index, keyName);
        }
      }
    }

    return actionPromise;
  },
  async actuator(keyName, callback, isPolling) {
    hotKeyFactory.log(true, { keyName });

    if (await hotKeyFactory.triggerRegister(keyName, callback, isPolling)) return;
    if (hotKeyFactory.rejectDoAction(keyName)) return;

    const { operation = ['.hot-key-focus-container'] } = this.hotKeyConfig[keyName] || {};
    const operations = Array.isArray(operation[0]) ? operation : [operation];

    for (let index = 0; index < operations.length; index++) {
      await hotKeyFactory.actionCompose(operations[index], keyName, callback, isPolling);
    }
  },
  async find(selector, isNew, polling) {
    let currentNode;
    if (!this.currentNode || isNew) {
      currentNode = await hotKeyFactory.asyncQueryHotKeyDom(selector, undefined, polling);
    } else {
      currentNode = await hotKeyFactory.asyncQueryHotKeyDom(selector, this.currentNode, polling);
    }

    return hotKeyFactory.queryNode(currentNode);
  },
  next(filterNum = 1) {
    for (let i = 0; i < filterNum; i++) {
      if (!this.currentNode) {
        hotKeyFactory.log(true,
          { waring: 'There is a warning in the next, trigger Dom is not found ' });
        break;
      }
      this.currentNode = this.currentNode.nextSibling;
    }

    return this;
  },
  prev(filterNum = 1) {
    for (let i = 0; i < filterNum; i++) {
      if (!this.currentNode) {
        hotKeyFactory.log(true,
          { waring: 'There is a warning in the prev, trigger Dom is not found ' });
        break;
      }
      this.currentNode = this.currentNode.previousSibling;
    }

    return this;
  },
  setFocus(target) {
    const focusClassName = 'hot-key-focus-container';
    const currentFocusContainer = document.querySelector(`.${focusClassName}`);
    currentFocusContainer && currentFocusContainer.classList.remove(focusClassName);

    const container = target || this.currentNode;
    container && container.classList.add(focusClassName);
    hotKeyFactory.log(!container, { waring: 'the set focus container Dom is not found' });
  },
  clearFocus() {
    const focusContainer = Array.from(document.querySelectorAll('.hot-key-focus-container'));

    for (const dom of focusContainer) {
      dom.classList.remove('hot-key-focus-container');
    }
    hotKeyFactory.log(true, { log: 'the focus container is clear' });
  },
  clickBefore(keyName, node) {
    const { clickBeforeProp } = hotKeyFactory;
    if (clickBeforeProp) return clickBeforeProp(keyName, node);
  },
  setFocusId(id) {
    return hotKeyFactory.focusId = id;
  },
  getFocusId() {
    const { focusId } = hotKeyFactory;
    if (typeof focusId === 'string' || typeof focusId === 'number') return focusId;

    const focusContainer = document.querySelector('.hot-key-focus-container');
    if (!focusContainer) {
      return hotKeyFactory.log(true, { waring: 'the focus container is not found' });
    }

    let classList;
    const currentClassList = Array.from(focusContainer.classList) || [];
    if (currentClassList.includes('hot-key-id')) {
      classList = currentClassList;
    } else {
      const hotKeyIdNode = focusContainer.querySelector('.hot-key-id');
      hotKeyFactory.log(!hotKeyIdNode, { waring: 'not have any bind hot-key id node' });

      if (!hotKeyIdNode) return;

      classList = Array.from(hotKeyIdNode.classList) || [];
    }
    const [, id] = (classList.find(className =>
      className.includes('hot-key-id=')) || '').split('=');
    this.focusId = id;

    return id;
  },
  bind(keys = [], callBack) {
    keyboard(keys.join(), callBack);
  },
  unbind(keys = []) {
    keys.forEach(key => keyboard.unbind(key));
  },
  handles: [],
  on(callback) {
    const handles = hotKeyFactory.handles;
    const isHaveEvent = handles.some(handle => handle === callback);

    if (!isHaveEvent) {
      handles.push(callback);
    }
  },
  off(callback) {
    const handles = hotKeyFactory.handles;
    const handleIndex = handles.findIndex(handle => handle === callback);

    if (~handleIndex) {
      handles.splice(handleIndex, 1);
    }
  },
  listener(callback, result, index, keyName) {
    const node: HTMLElement = result.nodeType === 1 ? result : result.currentNode;
    hotKeyFactory.handles.forEach(handle => handle(node, index, keyName));

    callback && callback(node, index, keyName);
  },
  log(isShowLog: boolean, { keyName, waring }: { keyName: string; waring?: string }) {
    if (!this.showLog || !isShowLog) return;

    if (keyName) console.log(`[hot-key]: ${keyName}`);
    if (waring) console.log(`[hot-key-waring]: ${waring}`);
  },
};

function hotKey(options: Options): ControllerType {
  return hotKeyFactory.constructor.call(hotKeyFactory, options);
}

hotKey.hotKeyBindClass = function (id, otherClassName = '') {
  return `${otherClassName} hot-key-id hot-key-id=${id}`;
};

export default hotKey;
