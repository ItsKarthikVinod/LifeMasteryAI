import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css'
import 'animate.css';
import { AuthProvider } from './contexts/authContext';


const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
 
    <AuthProvider>

        <App />
    </AuthProvider>
    
  
  
);

