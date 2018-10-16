/* eslint-disable react/jsx-filename-extension */
import React, { Children, Component } from 'react';
import PropTypes from 'prop-types';
import PendingList from './utils/PendingList';
import inViewport from './utils/inViewport';

const pendingList = new PendingList();

export default class LazyFastdom extends Component {
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
    pendingList.add(this);
    this.checkVisibility();
  }

  shouldComponentUpdate(_nextProps, nextState) {
    return nextState.visible;
  }

  componentWillUnmount() {
    this.mounted = false;
    if (!this.visible) pendingList.remove(this);
  }

  getContainer() {
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

  // This method is called asynchronously from a throttle function
  // inside PendingList instance.
  checkVisibility() {
    if (!this.node || !this.mounted || this.checkingVisibility) return;

    const offset = this.getOffset();
    const eventNode = this.getContainer();
    this.checkingVisibility = true;
    inViewport(this.node, eventNode, offset).then(this.handleVisibility);
  }

  handleVisibility(visible) {
    this.checkingVisibility = false;

    if (!visible || this.visible) return;
    this.visible = true;
    pendingList.remove(this);

    this.setState({ visible: true }, () => {
      const { onContentVisible } = this.props;
      if (onContentVisible) onContentVisible();
    });
  }

  render() {
    const {
      children,
      className,
      height,
      width,
      elementType: Element,
      placeholder,
    } = this.props;
    const { visible } = this.state;

    const elStyles = { height, width };
    const elClasses = `LazyLoad${visible ? ' is-visible' : ''}${
      className ? ` ${className}` : ''
    }`;

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
