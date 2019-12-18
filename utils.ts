import { currentType } from './types';

const delayer = (delay = 10) => new Promise(resolve => setTimeout(() =>
  resolve(true), delay));

const countClosure = (delay?: number) => {
  let pollCount = 0;

  return () => {
    async function awaitQuery() {
      await delayer(delay);
    }
    awaitQuery();

    if (pollCount > 60) return 'done';
    pollCount++;
  };
};

const queryCount = countClosure();

const queryHotKey = (operator, currentDom) => {
  const isSelector = ['.', '#'].includes(operator.charAt(0));
  const query = isSelector ? operator : `.hot-key-part-${operator}`;
  const queryAll = [];

  if (isSelector) {
    let queryjoin = '';
    const querys = query.split(' ');
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
  }

  const queryContainer = currentDom || document;

  if (!isSelector) return queryContainer.querySelector(query);

  return queryAll.reduce((prev, current: currentType) => {
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
  queryCount,
};
