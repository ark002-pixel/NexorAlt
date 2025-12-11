import { createRoot } from 'react-dom/client';
import React from 'react';
import App from './App';

console.log('Simple.tsx executing with App...');
const root = document.getElementById('root');
if (root) {
    try {
        createRoot(root).render(
            <App />
        );
        console.log('App render called');
    } catch (e) {
        console.error('Render error:', e);
        root.innerHTML = '<h1>RENDER ERROR</h1>';
    }
} else {
    console.error('Root not found');
}
