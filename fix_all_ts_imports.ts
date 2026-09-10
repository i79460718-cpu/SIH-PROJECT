import * as fs from 'fs';
import * as path from 'path';

function walk(dir: string, callback: (path: string) => void) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walk(fullPath, callback);
    } else if (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx')) {
      callback(fullPath);
    }
  }
}

walk('artifacts/api-server', (filePath) => {
  let code = fs.readFileSync(filePath, 'utf8');
  let newCode = code.replace(/([\"\'])(.*?)\.ts\1/g, (match, quote, p1) => {
    return `${quote}${p1}${quote}`;
  });
  if (code !== newCode) {
    fs.writeFileSync(filePath, newCode);
    console.log('Fixed', filePath);
  }
});
