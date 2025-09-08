import React from 'react';
import Header from './Header';

const Layout = ({ children }) => {
  return (
    <>
      <Header />
      <main className="container mx-auto px-6 py-8">{children}</main>
    </>
  );
};

export default Layout;
