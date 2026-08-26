import React from 'react';
import { SYMBOL_SRC } from '../utils/brand';
import './FullPageLoader.css';

export default function FullPageLoader({ label = 'Carregando...' }) {
  return (
    <div className="fp-loader">
      <img src={SYMBOL_SRC} alt="" className="fp-loader-mark" />
      <div className="fp-loader-bar">
        <span />
      </div>
      <p>{label}</p>
    </div>
  );
}
