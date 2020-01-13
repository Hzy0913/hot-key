export interface Options {
  keys: string[];
  handler?: string;
  observerCallback?: () => void;
  pressed: (event, keyboard) => void;
  log?: boolean;
  filter?: (any) => boolean;
  hotKeyConfig?: HotKeyConfigType;
  operationControl?: OperationControlType;
  clickBefore?: (keyName, node) => void | boolean;
}

export type FindFunc = (selector: string, isNew: boolean | void) => QueryNodeType;
export type NextFunc = (filterNum?: number) => QueryNodeType;
export type PrevFunc = (filterNum?: number) => QueryNodeType;
export type SetFocusFunc = (target: HTMLElement) => void;
export type ClearFocus = (target: HTMLElement) => void;
export type QueryNodeFunc = (target: HTMLElement) => any;
export type actionFunc = (keyName: string, className: string) => void;
export type setFocusIdFunc = (id?: string | number | void) => string | number | void;
export type RegisterFunc = (keyName: string) => (containerName: string) =>
  (className: string[]) => void;

export type currentType = {
  selector: string;
  filterText?: string;
  filterIndex?: number;
};

export interface QueryNodeType {
  currentNode: HTMLElement | void;
  find: FindFunc;
  next: NextFunc;
  prev: PrevFunc;
  setFocus: SetFocusFunc;
  clearFocus: ClearFocus;
  click: (keyName: string, node: QueryNodeType) => void;
}

export type RegisterKey = {
  className: string[];
  key: string;
  container: string;
};

export interface HotKeyFactoryType {
  constructor: (option: Options) => ControllerType;
  showLog?: boolean;
  focusId?: string | number | void;
  handles?: any[];
  hotKeyConfig?: HotKeyConfigType;
  operationControl?: OperationControlType;
  clickBeforeProp?: (keyName: string, node: QueryNodeType) => void;
  asyncQueryHotKeyDom: (operator: string, currentDom: HTMLElement, polling?: boolean) =>
    HTMLElement | void;
  queryHotKeyDom: (operator: string, currentDom: HTMLElement) =>
    HTMLElement | void;
  dynamicAction: (keyName: string, target: HTMLElement) => boolean | void | HTMLElement;
  queryNode: (target: HTMLElement | void) => QueryNodeType;
  find: FindFunc;
  log: (isShowLog: boolean, option: { keyName?: string; waring?: string; log?: string })
    => void;
  triggerRegister: (keyName: string, callback, polling?: boolean) => boolean | void;
  registerKey?: RegisterKey[];
  listener: (callback, result: any, index: number, keyName: string) => void;
  register: RegisterFunc;
  actuator: (keyName: string, callback: (target, index, keyName) => void, isPolling) => void;
  unRegister: (keyName: string) => void;
  clickBefore: (keyName: string, node: QueryNodeType) => any;
  rejectDoAction: (keyName: string) => boolean | void;
  getFocusId: () => string | number | void;
  action: actionFunc;
  actionCompose: (operation: string[], keyName: string, callback: any) => void;
  next: NextFunc;
  prev: PrevFunc;
  setFocus: SetFocusFunc;
  clearFocus: ClearFocus;
  setFocusId: setFocusIdFunc;
  bind: (keys: string[], callBack: (event) => void) => void;
  unbind: (keys: string[]) => void;
  on: (callback: (any) => void) => void;
  off: (callback: (any) => void) => void;
}

export interface ControllerType {
  readonly keys?: string[];
  readonly hotKeyConfig?: HotKeyConfigType;
  readonly operationControl?: OperationControlType;
  readonly log?: boolean;
  action: (keyName: string, callback?: (node, index, keyName) => void, poll?: boolean) => void;
  find: FindFunc;
  observerTrigger: () => void;
  bind: (keys: string[], callback: (event) => void) => void;
  unbind: (keys: string[]) => string[];
  on: (callback: (target, index, keyName) => void) => void;
  off: (callback: (target, index, keyName) => void) => void;
  setFocus: SetFocusFunc;
  setFocusId: <T>(id?: T) => T;
  getFocusId: () => string | number;
  register: RegisterFunc;
  unRegister: (keyName: string) => void;
  clearFocus: ClearFocus;
  observer: (any) => any;
}

export interface HotKeyConfigType {
  [keyName: string]: {
    describe?: string;
    operation?: string[] | string[][];
    dynamic?: boolean;
  };
}

type OperationType = {
  control: 'ALL' | string[];
  dynamicSelector?: {
    [keyName: string]: string;
  }
};

export interface OperationControlType {
  [keyId: string]: OperationType;
}
