import { render } from 'preact';
import './styles/tokens.css';
import './styles/fonts.css';
import './styles/global.css';
import { App } from './App.tsx';

const root = document.getElementById('app');
if (!root) throw new Error('#app bulunamadı');

// index.html carries a static copy of the loading state; drop it so Preact owns the subtree.
root.replaceChildren();
render(<App />, root);
