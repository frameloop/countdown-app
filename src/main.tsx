import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css'; // Asegúrate de que Tailwind CSS se importe aquí
import App from './App';

// Renderizar la aplicación
const rootElement = document.getElementById('root');
if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
} else {
  console.error('No se encontró el elemento root');
}