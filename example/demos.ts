import Swal from 'sweetalert2';
import hotKey from '../index';
import '../static/style.css';

const a = hotKey({
  keys: ['1', '2', '3', 'up', 'down', 'f', 'a'],
  log: true,
  filter(event) {
    return (event.target.tagName !== 'INPUT' || event.target.className === 'not-filter');
  },
  hotKeyConfig: {
    r: {
      describe: 'lala',
      operation: [
        ['.button', '.button2'],
        ['.button32'],
      ],
    },
    1: {
      describe: 'help',
      operation: ['.help-button'],
    },
    a: {
      describe: 'async',
      operation: ['.async-button', '.swal2-confirm2'],
    },
    2: {
      describe: 'click the button-2',
      operation: ['.buttons-selector button:1'],
    },
    3: {
      describe: 'click the button-3',
      operation: ['.buttons-selector button=button-3'],
    },
  },
  operationControl: {
    1: {
      control: 'ALL',
      dynamicSelector: {
        down: '#list1 .active',
        up: '#list1 .active',
      },
    },
  },
  // clickBefore(key, target) {
  //
  //   console.log(key, target, 1111)
  //   // return true;
  // },
  pressed(e, handle) {
    // setTimeout(() => {
    //   const a = document.createElement('div');
    //   a.className = 'find';
    //   document.body.appendChild(a);
    // }, 100);
    console.log(e, handle, 11111)
    a.action(e.key, (a,b,v) => {
      console.log(a,b,v, 55555  )
    });
    const { key, currentHotKeyConfig = {}, currentOperationControl } = handle || {};
    currentHotKeyConfig;
    const { dynamicSelector = {} } = currentOperationControl || {};
    if ('updown'.includes(key)) {
      const selector = dynamicSelector[key];
      const func = {
        up: 'prev',
        down: 'next',
      };

      const dynamicSelectorNode = a.find(selector)[func[key]]();
      dynamicSelectorNode.currentNode && dynamicSelectorNode.click();
    }

    console.log(e, a, 11);
    // a.action(e.key, (node, index, keyName) => {
    //   console.log(node.textContent, index, keyName, 7777)
    // });
  },
});

function call(e, e1, e2) {
  // console.log(e.textContent, e1, e2, 999999);
}
a.setFocusId();
a.setFocus(document.body);
a.register('f')('body')(['.button', '.find']);
a.register('enter')('body')(['.swal2-confirm']);
// a.unRegister('f');
// a.unbind(['f', 'a']);
a.on(call);
// a.off(call);
// a.bind(['q'], (e) => {
//   a.action(e.key);
// });

// a.find('.button').click();
let list2: string = '';
for (let i = 0; i < 10; i++) {
  list2 += `<div class="">item-${i}</div>`;
}
list2 = `<ul id='list2'>${list2}</ul>`;

// Swal.fire({
//   title: 'Error!',
//   text: 'Do you want to continue',
//   icon: 'info',
//   html: list2,
//   confirmButtonText: 'Cool',
// });

document.querySelector('.buttons-selector').addEventListener('click', (e) => {
  const { target } = e;
  const text = (<HTMLElement>target).textContent;

  Swal.fire({
    title: `You clicked the ${text}`,
    icon: 'success',
    confirmButtonText: 'Cool',
  });
}, false);

document.querySelector('.async-button').addEventListener('click', (e) => {
  Swal.fire({
    title: 'You clicked the async-button',
    icon: 'success',
    showLoaderOnConfirm: true,
    confirmButtonText: 'Pay',
    onBeforeOpen: () => {
      Swal.showLoading();
      setTimeout(() => {
        Swal.hideLoading();
      }, 1400);
    },
  });
}, false);
