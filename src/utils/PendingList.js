import debounce from 'lodash.debounce';
import throttle from 'lodash.throttle';

export default class PendingList {
  static generateKey(lazy) {
    const { throttle: th, debounce: db } = lazy.props;
    return `${th}_${db}`;
  }

  constructor() {
    this.groups = new Map();
  }

  add(lazy) {
    const container = lazy.getContainer();
    const key = PendingList.generateKey(lazy);

    // Exits if throttle value is 0 (is this necessary?)
    if (lazy.props.throttle <= 0) return;

    // Get group' by container
    let group = this.groups.get(container);
    if (!group) {
      group = {};
      this.groups.set(container, group);
    }

    // Get 'checker' by generated key
    // 'checker' has a list of LazyFastdom instances and a
    // function that checks visibility of those instances.
    let checker = group[key];
    if (!checker) {
      const list = []; // list of lazy instances;

      const { throttle: th, debounce: db } = lazy.props;

      checker = {
        list,
        func: (db ? debounce : throttle)(() =>
          list.forEach(lazyInstance => lazyInstance.checkVisibility(), th),
        ),
      };

      group[key] = checker;

      // Add eventListeners
      window.addEventListener('resize', checker.func);
      container.addEventListener('scroll', checker.func);
      container.addEventListener('touchmove', checker.func);
      container.addEventListener('transitionend', checker.func);
    }

    // Add lazy instance
    checker.list.push(lazy);
  }

  remove(lazy) {
    const container = lazy.getContainer();
    const key = PendingList.generateKey(lazy);

    const group = this.groups.get(container);

    const checker = group[key];

    // WARNING - checker must never be falsy at this point!!
    if (!checker) return; // Do nothing. Handler does not exist.

    const { func, list } = checker;

    // Remove this lazy instance from checker
    checker.list = list.filter(a => a !== lazy);

    if (!list.length) {
      // Cancel function execution
      func.cancel();

      // Remove eventListeners if there are no more lazy instances
      window.removeEventListener('resize', func);
      container.removeEventListener('scroll', func);
      container.removeEventListener('touchmove', func);
      container.removeEventListener('transitionend', func);

      // Remove checker
      delete group[key];
    }
  }
}
