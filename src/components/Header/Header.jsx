// src/components/Header/Header.jsx
import React from 'react';
import styles from './Header.module.css';
import BIAL_Logo from '../../../public/kempegowda-logo.png'; // Adjust path if logo is elsewhere

function Header() {
  return (
    <header className={styles.header}>
      <div className={styles.logoContainer}>
        <img src={BIAL_Logo} alt="Kempegowda Bangalore International Airport Logo" className={styles.logo} />
        <h1 className={styles.title}>BIAL Regulatory Assistant</h1>
      </div>
    </header>
  );
}

export default Header;