import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';
import { resolve } from 'path';
import fs from 'fs';

// Dynamically generate inputs for all HTML pages in the project
const pagesDir = resolve(__dirname, 'pages');
const pages = fs.readdirSync(pagesDir).filter(f => f.endsWith('.html'));
const input = {
  main: resolve(__dirname, 'index.html'),
  login: resolve(__dirname, 'login.html')
};
pages.forEach(page => {
  input[page.replace('.html', '')] = resolve(pagesDir, page);
});

export default defineConfig({
  plugins: [
    tailwindcss(),
  ],
  build: {
    rollupOptions: {
      input
    }
  }
});
