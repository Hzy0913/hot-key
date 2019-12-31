# hotkey-trigger
hotkey-trigger 是一个帮助你监听键盘按键并且触发事件动作的插件，它可以完成事件触发动作编排，
按键操作权限控制。插件通过元素选择器来获取触发事件，不会入侵你原有的代码。
### 使用

 - 安装

```bash
npm install hotkey-trigger
```
 - 引入

```js
import hotKey from 'hotkey-trigger';
```
 - 使用
 
```javascript
const trigger = hotKey({
  keys: ['a', 's', 'd'],
  log: true,
  pressed(event) {
    trigger.action(e.key);
  }
});

trigger.register('a')('body')(['.button']);

```
上面是简单的使用，通过`keys`参数传入需要监听的按键名，在`pressed` 方法中触发动作，
最后我们为按键`a`注册触发的元素节点。

### API

|  属性 | 说明  | 类型  | 默认值  |
| ------------ | ------------ | ------------ | ------------ |
|  keys | 需要被监听的键盘按键名  |  string[] | -  |
|  pressed | 按键被按下后触发的回调  |  function(event) |   |
| log  |  控制台是否输入按键日志 | boolean  | false  |
| handler  | 全局(window)挂载方法生成后的操作器句柄名  | string  |   |
|  filter | 是否在输入框等触发按键，具体用法见下  | function(event): boolean  |   |
|  clickBefore | 触发事件点击前的回调方法  | function(keyName, node: QueryNodeType)  |   |
|  hotKeyConfig | 快捷键触发动作配置，具体用法见下  | object  | -  |
|  operationControl | 快捷键操作权限控制配置，具体用法见下  | object  | -  |
