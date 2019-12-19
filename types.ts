export interface Options {
  keys?: string[];
  handler?: string;
  observerCallback?: (any) => void;
  pressed: (any) => void;
  log?: boolean;
  filter?: (any) => boolean;
  hotKeyConfig: HotKeyConfigType;
  operationControl: OperationControlType;
  clickBefore?: () => void;
}

export type FindFunc = (selector: string, isNew?: boolean) => QueryNodeType;
export type NextFunc = (filterNum?: number) => QueryNodeType;
export type PrevFunc = (filterNum?: number) => QueryNodeType;
export type SetFocusFunc = (target: HTMLElement) => void;
export type ClearFocus = (target: HTMLElement) => void;

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
  readonly keys: string[];
  readonly hotKeyConfig: HotKeyConfigType;
  readonly operationControl: OperationControlType;
  readonly log: boolean;
  action: (keyName: string, callback?: (any) => void) => void;
  find: FindFunc;
  observerCallback: (any) => void;
  pressed: (any) => void;
  observerTrigger: () => void;
  bind: (keys: string[], callback: (any) => void) => void;
  unbind: (keys: string[]) => string[];
  on: (callback: (any) => void) => void;
  off: (callback: (any) => void) => void;
  setFocus: SetFocusFunc;
}

export interface HotKeyConfigType {
  [keyName: string]: {
    describe: string;
    operation?: string[];
    dynamic?: boolean;
  };
}

type OperationType= {
  control: 'ALL' | string[];
  dynamicSelector?: {
    [keyName: string]: string;
  }
};

export interface OperationControlType {
  [keyId: string]: OperationType;
}

export type hotKeyFactoryType = any;
