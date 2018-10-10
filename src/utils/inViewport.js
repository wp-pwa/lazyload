import {
  getBoundingClientRect,
  getElementBox,
  getWindowProps,
} from './fastdom';

// Finds element's position relative to the whole document,
// rather than to the viewport as it is the case with .getBoundingClientRect().
const getElementPosition = (elementClientRect, windowProps) => {
  const { top, left } = elementClientRect;
  const { pageXOffset, pageYOffset } = windowProps;
  return {
    top: top + pageYOffset,
    left: left + pageXOffset,
  };
};

const inViewport = (element, container, customOffset) =>
  Promise.all([
    getBoundingClientRect(element),
    getElementBox(element),
    getWindowProps(),
  ])
    .then(([elementClientRect, elementBox, windowProps]) => {
      if (!element || elementBox.offsetParent === null) return false;

      if (typeof container === 'undefined' || container === window) {
        const {
          pageXOffset,
          pageYOffset,
          innerWidth,
          innerHeight,
        } = windowProps;
        return {
          left: pageXOffset,
          top: pageYOffset,
          right: pageXOffset + innerWidth,
          bottom: pageYOffset + innerHeight,
          elementClientRect,
          elementBox,
          windowProps,
        };
      }

      return Promise.all([
        getBoundingClientRect(container),
        getElementBox(container),
      ]).then(([containerClientRect, containerBox]) => {
        const containerPosition = getElementPosition(
          containerClientRect,
          windowProps,
        );
        const { top, left } = containerPosition;
        const { offsetWidth, offsetHeight } = containerBox;
        return {
          left,
          top,
          right: left + offsetWidth,
          bottom: top + offsetHeight,
          elementClientRect,
          elementBox,
          windowProps,
        };
      });
    })
    .then(result => {
      if (!result) return false; // element doesn't exist or it isn't in the DOM tree.

      const {
        elementClientRect,
        elementBox,
        windowProps,
        top,
        left,
        bottom,
        right,
      } = result;
      const elementPosition = getElementPosition(
        elementClientRect,
        windowProps,
      );

      return (
        top <=
          elementPosition.top + elementBox.offsetHeight + customOffset.top &&
        bottom >= elementPosition.top - customOffset.bottom &&
        left <=
          elementPosition.left + elementBox.offsetWidth + customOffset.left &&
        right >= elementPosition.left - customOffset.right
      );
    });

export default inViewport;
