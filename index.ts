import * as keymaster from 'keymaster';
import { Options, HotKeyConfigType, FindFunc, ControllerType } from './types';
import { queryHotKey, queryCount } from './utils';

const keyboard = keymaster.noConflict();

/**
 * Created by hzy on 2019/11/27.
 */
/**
 * @hotKey(option) 调用hotKey方法初始化状态
 * @option 可传入选项 {handler: 全局的句柄默认为$}
 * @observerCallback dom变化后的回调
 * @log 是否显示log
 * @hotKeyConfig 快捷键配置项
 * @operationControl 快捷键权限控制
 * @clickBefore 点击事件前的回调方法
 *
 * 初始化后的方法
 * action 传入第一个参数 按键字符串，触发config中的动作，返回一个promise，执行then方法可以从参数中拿到当前的上下文对象
 * action 第二个参数为回调函数，回调函数的参数会返回当前的动作触发的元素属性以及当前为第几步
 *
 * observer 监听dom变化，第一个参数为监听的dom目标，第二个参数为配置  具体查看 new MutationObserver observer
 * find 查找dom，可链式调用
 * next 查找下一个兄弟节点，参数中可传入数量跳过几个相邻的
 * prev 查找上一个兄弟节点，参数中可传入数量跳过几个相邻的
 * click 触发点击事件
 * register 注册一个全局的快捷键，第一个方法参数为快捷键名，第二个方法参数为目标容器class名，第三个方法参数为触发事件dom class名
 * unRegister 注销一个全局的快捷键
 *
 * config & control 说明 见 ./config.js 文件
 *
 */

const hotKeyFactory: any = {
  constructor({
    keys = [],
    handler,
    observerCallback,
    pressed,
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

    const controller = {
      keys,
      hotKeyConfig,
      operationControl,
      action: this.actuator,
      find: this.find,
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
  asyncQueryHotKeyDom(operator, currentNode) {
    const pollQueryDom = () => {
      const target = queryHotKey(operator, currentNode);
      if (target) return target;

      const result = queryCount();
      if (result === 'done') return;

      return pollQueryDom();
    };

    return pollQueryDom();
  },
  dynamicAction(keyName, target) {
    const { dynamic } = this.hotKeyConfig[keyName] as HotKeyConfigType || { dynamic: undefined };
    if (!dynamic) return;

    const { dynamicSelector = {} } = this.operationControl[this.focusId] || {};
    const targetKey = Object.keys(dynamicSelector).find(key => key.includes(keyName));
    const domSelector = dynamicSelector[targetKey];
    const actionNode = hotKeyFactory.queryNode(target).find(domSelector);

    actionNode.currentNode && actionNode.click(keyName, actionNode);

    if (!actionNode.currentNode) {
      hotKeyFactory.log(true,
        { waring: `the [${keyName}] hot-key of dynamic trigger Dom not found` });
      return true;
    }

    return actionNode.currentNode;
  },
  triggerRegister(keyName) {
    if (!hotKeyFactory.registerKey) return;

    const trigger = this.registerKey.find(item => item.key === keyName);
    if (!trigger) return;

    const { container, className } = trigger;
    const containerDom = this.asyncQueryHotKeyDom(container);
    let targetNode;
    const classNameList = Array.isArray(className) ? className : [className];
    classNameList.some((name) => {
      const queryNode = hotKeyFactory.queryNode(containerDom).find(name);
      targetNode = queryNode;
      return !!queryNode.currentNode;
    });

    targetNode.currentNode && targetNode.click(targetNode);
    hotKeyFactory.log(!targetNode.currentNode,
      { waring: 'register hot-key trigger Dom not found' });
  },
  register(keyName) {
    return containerName => (className) => {
      const registerKey = {
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
    } = this;  // tslint:disable-line

    return {
      find,
      next,
      prev,
      setFocus,
      clearFocus,
      currentNode: target,
      click(keyName, target) {
        const notClick = hotKeyFactory.clickBefore(keyName, target);
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
  action(keyName, className) {
    return new Promise((resolve, reject) => {
      const target = this.asyncQueryHotKeyDom(className);

      const dynamicActionTarget = hotKeyFactory.dynamicAction(keyName, target);
      if (dynamicActionTarget) return resolve(dynamicActionTarget);

      if (target) {
        const hotKeyProto = hotKeyFactory.queryNode(target);

        hotKeyProto.click(keyName, hotKeyProto);

        resolve(hotKeyProto);
      } else {
        hotKeyFactory.log(true, { waring: `not found hot ket target of [${className}]` });
      }
    });
  },
  async actionCompose(operation, keyName, callback) {
    let actionPromise = null;
    const { listener } = hotKeyFactory;

    for (let index = 0; index < operation.length; index++) {
      const className = operation[index];

      if (!actionPromise) {
        actionPromise = hotKeyFactory.action(keyName, className);
        if (index === (operation.length - 1)) {
          const res = await actionPromise;
          listener(callback, res, index, keyName);
        }
      } else {
        const res = await actionPromise;
        listener(callback, res, index - 1, keyName);

        actionPromise = hotKeyFactory.action(keyName, className);

        if (index === (operation.length - 1)) {
          const res = await actionPromise;
          listener(callback, res, index, keyName);
        }
      }
    }

    return actionPromise;
  },
  async actuator(keyName, callback) {
    hotKeyFactory.log(true, { keyName });

    if (hotKeyFactory.triggerRegister(keyName)) return;
    if (hotKeyFactory.rejectDoAction(keyName)) return;

    const { operation = ['.hot-key-focus-container'] } = this.hotKeyConfig[keyName] || {};
    const operations = Array.isArray(operation[0]) ? operation : [operation];

    for (let index = 0; index < operations.length; index++) {
      await hotKeyFactory.actionCompose(operations[index], keyName, callback);
    }
  },
  find(selector, isNew): FindFunc {
    let currentNode;
    if (!this.currentNode || isNew) {
      currentNode = hotKeyFactory.asyncQueryHotKeyDom(selector);
    } else {
      currentNode = hotKeyFactory.asyncQueryHotKeyDom(selector, this.currentNode);
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
    const container = target || this.currentNode;
    container && container.classList.add('hot-key-focus-container');
    hotKeyFactory.log(!container, { waring: 'the set focus container Dom is not found' });
  },
  clearFocus() {
    const focusContainer = Array.from(document.querySelectorAll('.hot-key-focus-container'));

    for (const dom of focusContainer) {
      dom.classList.remove('hot-key-focus-container');
    }
    hotKeyFactory.log(true, { log: 'the focus container is clear' });
  },
  clickBefore(keyName, target) {
    const { clickBeforeProp } = hotKeyFactory;
    if (clickBeforeProp) return clickBeforeProp(keyName, target);
  },
  getFocusId() {
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
  listener(callback, result: any, index, keyName) {
    const node = result.nodeType === 1 ? result : result.currentNode;
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

hotKey.hotKeyNotFilter = function (otherClassName = '') {
  return `${otherClassName} hot-key-not-filter`;
};

export default hotKey;
