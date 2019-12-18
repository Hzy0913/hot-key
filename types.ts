export interface Options {
  keys?: string[];
  handler?: string;
  observerCallback?: (any) => void;
  pressed?: (any) => void;
  log?: boolean;
  font?: string;
  length?: number;
  filter?: (any) => boolean;
}

type FindFunc = (selector: string, isNew: boolean) => QueryNodeType;
type NextFunc = (filterNum: number) => QueryNodeType;
type PrevFunc = (filterNum: number) => QueryNodeType;
type SetFocusFunc = (target: HTMLElement) => void;
type ClearFocus = (target: HTMLElement) => void;

export type currentType = {
  selector: string;
  filterText?: string;
  filterIndex?: number;
};

export interface QueryNodeType {
  currentNode: HTMLElement;
  find: FindFunc;
  next: NextFunc;
  prev: PrevFunc;
  setFocus: SetFocusFunc;
  clearFocus: ClearFocus;
  click: (any) => void;
}

export interface ControllerType {
  keys: string[];
  action: (keyName: string, callback: (any) => void) => void;
  find: FindFunc;
  observerCallback: (any) => void;
  pressed: (any) => void;
  log: boolean;
  observerTrigger: () => void;
  bind: (keys: string[], callback: (any) => void) => void;
  unbind: (keys: string[]) => string[];
  on: (callback: (any) => void) => void;
  off: (callback: (any) => void) => void;
}

export interface HotKeyConfigType {
  [keyName: string]: {
    describe: string;
    operation?: string[];
    dynamic?: boolean;
  };
}

export interface OperationControlType {
  [keyId: string ]: {
    control: 'ALL' | string[];
    dynamicSelector: {
      [keyName: string]: string;
    }
  };
}

export type hotKeyFactoryType = any;
