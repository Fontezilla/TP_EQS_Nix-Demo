// Estilos globais primeiro, para os das páginas e componentes (importados no App) os poderem sobrepor
import '@fontsource-variable/bricolage-grotesque/standard.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import './styles/main.scss';
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import { CartProvider } from './context/CartContext.jsx';
import { SocketProvider } from './context/SocketContext.jsx';
import { startLoadingScreen } from './utils/loader.js';
import 'bootstrap/dist/js/bootstrap.bundle.min.js'; // menu colapsável, dropdowns, etc.

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <SocketProvider>
        <CartProvider>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </CartProvider>
      </SocketProvider>
    </AuthProvider>
  </React.StrictMode>
);

startLoadingScreen();
