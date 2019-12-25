import { currentType } from './types';

const delayer = (delay = 10) => new Promise(resolve => setTimeout(() =>
  resolve(true), delay));

const countClosure = (delay?: number) => {
  let pollCount = 0;

  return async function awaitQuery(notEnd?: boolean) {
    if (!notEnd) return 'done';
    await delayer(delay);
    if (pollCount > 60) return 'done';
    pollCount++;
  };
};

const queryHotKey = (operator, currentDom) => {
  const queryAll = [];

  let queryjoin = '';
  const querys = operator.split(' ');
  querys.forEach((value, index) => {
    const [selectorText, filterText] : [string, string | void] = value.split('=');
    const [selectorIndex, filterIndex] : [string, number | void] = value.split(':');
    const selector = (filterText && selectorText) ||
      (filterIndex && selectorIndex) || selectorText;
    queryjoin = (queryjoin += ` ${selector}`).trim();

    if (filterText || filterIndex) {
      queryAll.push({ filterText, filterIndex, selector: queryjoin });
      queryjoin = '';
    }

    if (index === (querys.length - 1) && queryjoin) {
      queryAll.push({ filterText, filterIndex, selector: queryjoin });
    }
  });

  const queryContainer = currentDom || document;

  return queryAll.reduce((prev: HTMLElement, current: currentType) => {
    const { selector, filterText, filterIndex } = current;

    if (filterText) {
      return Array.from(prev.querySelectorAll(selector)).find((el: HTMLElement) =>
        el.textContent === filterText);
    }
    if (filterIndex) {
      return Array.from(prev.querySelectorAll(selector))[filterIndex];
    }
    return prev.querySelector(selector);
  }, queryContainer);
};

export {
  queryHotKey,
  countClosure,
};
