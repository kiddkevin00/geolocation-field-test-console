// @flow
import React from 'react';

import { AppBar, Navigation, Link } from 'react-toolbox';

import Styles from '../assets/styles/app.css';
import logo from '../assets/images/icon.png';

const HeaderView = () =>
  <AppBar title='Background Geolocation Console' leftIcon='menu'>
    <Navigation type='horizontal'>
      <Link href='#' label='' >
        <img className={Styles.logo} src={logo} />
      </Link>
    </Navigation>
  </AppBar>;
export default HeaderView;
