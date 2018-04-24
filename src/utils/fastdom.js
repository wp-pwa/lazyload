import fastdom from 'fastdom/';
import fdPromised from 'fastdom/extensions/fastdom-promised';

const fastdomPromised = fastdom.extend(fdPromised);

export const getBoundingClientRect = element =>
  fastdomPromised.measure(() => element.getBoundingClientRect());

export const getElementBox = element => fastdomPromised.measure(() => {
  const { offsetWidth, offsetHeight, offsetParent } = element;
  return { offsetWidth, offsetHeight, offsetParent };
});

export const getWindowProps = () => fastdomPromised.measure(() => {
  const { pageXOffset, pageYOffset, innerWidth, innerHeight } = window;
  return { pageXOffset, pageYOffset, innerWidth, innerHeight };
});

export const getOverflowValues = element => fastdomPromised.measure(() => {
  const { overflow, overflowX, overflowY } = window.getComputedStyle(element);
  return { overflow, overflowX, overflowY };
});
