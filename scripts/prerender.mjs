import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { createServer } from 'vite';

const root = fileURLToPath(new URL('../', import.meta.url));
const server = await createServer({
  root,
  server: { middlewareMode: true },
  appType: 'custom',
});

try {
  const { default: App } = await server.ssrLoadModule('/src/App.jsx');
  const markup = renderToString(React.createElement(App));
  const output = new URL('../dist/index.html', import.meta.url);
  const html = await readFile(output, 'utf8');
  const placeholder = '<div id="root"></div>';
  if (!html.includes(placeholder)) throw new Error('Missing prerender root placeholder');
  await writeFile(output, html.replace(placeholder, () => `<div id="root">${markup}</div>`));
  console.log('Prerendered homepage with calculator and runner lookup.');
} finally {
  await server.close();
}
