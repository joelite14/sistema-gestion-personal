import './index.css';
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext'; // 👈 Importar
import App from './App.tsx';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <ThemeProvider>  {/* 👈 Envolver aquí */}
        <App />
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>,
);