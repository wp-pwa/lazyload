/* eslint-disable react/prop-types */
import React from 'react';
import { storiesOf } from '@storybook/react';
import { action } from '@storybook/addon-actions';
import LazyLoad from '../src/';

const Container = ({ children }) => (
  <div
    style={{
      background: 'lightgoldenrodyellow',
      width: '500vw',
      height: '200vh',
      display: 'flex',
      justifyContent: 'space-between',
    }}
  >
    {children}
  </div>
);

const RedBox = () => <div style={{ width: '100px', height: '100px', background: 'red' }} />;

const TopLeft = ({ children }) => <div style={{ alignSelf: 'flex-start' }}>{children}</div>;
const Center = ({ children }) => <div style={{ alignSelf: 'center' }}>{children}</div>;
const BottomRight = ({ children }) => <div style={{ alignSelf: 'flex-end' }}>{children}</div>;

storiesOf('LazyLoad', module).add('Empty', () => <div />);

storiesOf('LazyLoad', module).add('Three (top-left, center, bottom-right)', () => (
  <Container>
    <TopLeft>
      <LazyLoad onContentVisible={action('visible! top-left')}>
        <RedBox />
      </LazyLoad>
    </TopLeft>
    <Center>
      <LazyLoad onContentVisible={action('visible! center')}>
        <RedBox />
      </LazyLoad>
    </Center>
    <BottomRight>
      <LazyLoad onContentVisible={action('visible! bottom-right')}>
        <RedBox />
      </LazyLoad>
    </BottomRight>
  </Container>
));
