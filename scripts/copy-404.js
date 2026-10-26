import fs from 'node:fs';
import path from 'node:path';

try {
  const src = path.resolve('dist', 'index.html');
  const dest = path.resolve('dist', '404.html');
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dest);
    console.log('Successfully generated dist/404.html for GitHub Pages');
  }
} catch (err) {
  console.warn('Note: Could not copy 404.html:', err.message);
}
