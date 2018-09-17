import React, { Children, Component } from 'react';
import { unstable_scheduleWork as scheduleWork } from 'schedule';
import PropTypes from 'prop-types';
import { debounce, throttle } from 'lodash';
import inViewport from './utils/inViewport';

export default class LazyFastdom extends Component {
  static groups = new Map();

  static createHandler(container, key, th, db) {
    if (th <= 0) return;
    const handleAttached = () => {
      const { attached } = LazyFastdom.groups.get(container)[key];
      attached.forEach(lazy => lazy.checkVisibility());
    };

    const handler = (db ? debounce : throttle)(handleAttached, th);
    const attached = [];

    const object = { handler, attached };

    if (!LazyFastdom.groups.has(container)) LazyFastdom.groups.set(container, {});
    LazyFastdom.groups.get(container)[key] = object;

    window.addEventListener('resize', handler);
    container.addEventListener('scroll', handler);
    container.addEventListener('touchmove', handler);
    container.addEventListener('transitionend', handler);
  }

  static removeHandler(container, key) {
    const { handler } = LazyFastdom.groups.get(container)[key];

    handler.cancel();

    window.removeEventListener('resize', handler);
    container.removeEventListener('scroll', handler);
    container.removeEventListener('touchmove', handler);
    container.removeEventListener('transitionend', handler);

    delete LazyFastdom.groups.get(container)[key];
  }

  static getKey(lazy) {
    const { throttle: th, debounce: db } = lazy.props;
    return `${th}_${db}`;
  }

  static attachLazyFastdom(lazy) {
    const { throttle: th, debounce: db } = lazy.props;
    const key = LazyFastdom.getKey(lazy);
    const container = lazy.getEventNode();

    if (!LazyFastdom.groups.has(container) || !LazyFastdom.groups.get(container)[key]) {
      LazyFastdom.createHandler(container, key, th, db);
    }

    LazyFastdom.groups.get(container)[key].attached.push(lazy);
  }

  static detachLazyFastdom(lazy) {
    const key = LazyFastdom.getKey(lazy);
    const container = lazy.getEventNode();
    const obj = LazyFastdom.groups.get(container)[key];

    if (!obj) return; // Do nothing. Handler does not exist.

    obj.attached = obj.attached.filter(a => a !== lazy);
    if (obj.attached.length === 0) LazyFastdom.removeHandler(container, key);
  }

  constructor(props) {
    super(props);

    this.checkVisibility = this.checkVisibility.bind(this);
    this.handleVisibility = this.handleVisibility.bind(this);

    this.checkingVisibility = false;
    this.visible = false;
    this.mounted = false;
    this.finishedAsyncMount = false;
    this.state = { visible: false };
  }

  componentDidMount() {
    this.mounted = true;
    LazyFastdom.attachLazyFastdom(this);
    this.checkVisibility();
  }

  shouldComponentUpdate(_nextProps, nextState) {
    return nextState.visible;
  }

  componentWillUnmount() {
    this.mounted = false;
    window.cancelAnimationFrame(this.rafId);
    LazyFastdom.detachLazyFastdom(this);
  }

  getEventNode() {
    return this.props.container || window;
  }

  getOffset() {
    const {
      offset,
      offsetVertical,
      offsetHorizontal,
      offsetTop,
      offsetBottom,
      offsetLeft,
      offsetRight,
      threshold,
    } = this.props;

    const offsetAll = threshold || offset;

    return {
      top: offsetTop || offsetVertical || offsetAll,
      bottom: offsetBottom || offsetVertical || offsetAll,
      left: offsetLeft || offsetHorizontal || offsetAll,
      right: offsetRight || offsetHorizontal || offsetAll,
    };
  }

  checkVisibility() {
    if (!this.mounted || this.checkingVisibility) return;
    const offset = this.getOffset();
    const eventNode = this.getEventNode();
    this.checkingVisibility = true;
    inViewport(this.node, eventNode, offset).then(this.handleVisibility);
  }

  tick() {
    this.rafId = window.requestAnimationFrame(() => {
      if (!this.finishedAsyncMount) {
        if (this.props.async) this.tick();
        else {
          this.setState({ visible: true }, () => {
            const { onContentVisible } = this.props;
            if (onContentVisible) onContentVisible();
          });
        }
      }
    });
  }

  handleVisibility(visible) {
    this.checkingVisibility = false;

    if (!visible || this.visible) return;
    this.visible = true;

    if (this.props.async) {
      scheduleWork(() =>
        this.setState({ visible: true }, () => {
          this.finishedAsyncMount = true;
          const { onContentVisible } = this.props;
          if (onContentVisible) onContentVisible();
        }),
      );
      this.tick();
    } else {
      this.setState({ visible: true }, () => {
        const { onContentVisible } = this.props;
        if (onContentVisible) onContentVisible();
      });
    }

    LazyFastdom.detachLazyFastdom(this);
  }

  render() {
    const { children, className, height, width, elementType: Element, placeholder } = this.props;
    const { visible } = this.state;

    const elStyles = { height, width };
    const elClasses = `LazyLoad${visible ? ' is-visible' : ''}${className ? ` ${className}` : ''}`;

    return (
      <Element
        className={elClasses}
        ref={node => {
          this.node = node;
        }}
        style={elStyles}
      >
        {visible ? Children.only(children) : placeholder}
      </Element>
    );
  }
}

LazyFastdom.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
  container: PropTypes.shape({}),
  async: PropTypes.bool,
  elementType: PropTypes.string,
  height: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  offset: PropTypes.number,
  offsetBottom: PropTypes.number,
  offsetHorizontal: PropTypes.number,
  offsetLeft: PropTypes.number,
  offsetRight: PropTypes.number,
  offsetTop: PropTypes.number,
  offsetVertical: PropTypes.number,
  threshold: PropTypes.number,
  width: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onContentVisible: PropTypes.func,
  placeholder: PropTypes.oneOfType([PropTypes.func, PropTypes.object]),
};

LazyFastdom.defaultProps = {
  className: null,
  container: null,
  height: null,
  width: null,
  threshold: 0,
  onContentVisible: null,
  async: false,
  elementType: 'div',
  offset: 0,
  offsetBottom: 0,
  offsetHorizontal: 0,
  offsetLeft: 0,
  offsetRight: 0,
  offsetTop: 0,
  offsetVertical: 0,
  placeholder: null,
};
