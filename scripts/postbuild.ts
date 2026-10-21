import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const distDir = path.join(rootDir, 'dist');
const docsDir = path.join(rootDir, 'docs');

function copyFolderSync(from: string, to: string) {
  if (!fs.existsSync(to)) {
    fs.mkdirSync(to, { recursive: true });
  }
  fs.readdirSync(from).forEach((element) => {
    const stat = fs.lstatSync(path.join(from, element));
    if (stat.isFile()) {
      fs.copyFileSync(path.join(from, element), path.join(to, element));
    } else if (stat.isDirectory()) {
      copyFolderSync(path.join(from, element), path.join(to, element));
    }
  });
}

function runPostBuild() {
  console.log('⚡ Running postbuild script for GitHub Pages...');

  if (!fs.existsSync(distDir)) {
    console.error('❌ dist directory not found. Please run vite build first.');
    process.exit(1);
  }

  // 1. Create .nojekyll in dist/
  fs.writeFileSync(path.join(distDir, '.nojekyll'), '');
  console.log('✅ Created dist/.nojekyll');

  // 2. Create 404.html in dist/ (copy of index.html for SPA routing)
  const distIndex = path.join(distDir, 'index.html');
  if (fs.existsSync(distIndex)) {
    fs.copyFileSync(distIndex, path.join(distDir, '404.html'));
    console.log('✅ Created dist/404.html for GitHub Pages SPA routing');
  }

  // 3. Recreate docs/ folder
  if (fs.existsSync(docsDir)) {
    fs.rmSync(docsDir, { recursive: true, force: true });
  }
  fs.mkdirSync(docsDir, { recursive: true });

  // 4. Copy all dist files into docs/
  copyFolderSync(distDir, docsDir);
  console.log('✅ Successfully copied production bundle to docs/ folder for GitHub Pages "Deploy from a branch -> /docs"');

  // 5. Ensure docs/.nojekyll and docs/404.html exist
  fs.writeFileSync(path.join(docsDir, '.nojekyll'), '');
  if (fs.existsSync(distIndex)) {
    fs.copyFileSync(distIndex, path.join(docsDir, '404.html'));
  }
  console.log('✅ Verified docs/.nojekyll and docs/404.html');

  console.log('🎉 GitHub Pages deployment files prepared successfully in both dist/ and docs/!');
}

runPostBuild();
