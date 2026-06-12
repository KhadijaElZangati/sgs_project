import fs from 'fs';
import path from 'path';
const dirs = ['node_modules/react-is', 'node_modules/recharts/node_modules/react-is'];
for (const d of dirs) {
  const p = path.resolve(d);
  const exists = fs.existsSync(p);
  console.log(d + ':', exists ? 'EXISTS' : 'NOT FOUND');
  if (exists) {
    const pkgPath = path.join(p, 'package.json');
    if (fs.existsSync(pkgPath)) {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
      console.log('  version:', pkg.version);
    }
    const mainPath = path.join(p, 'index.js');
    if (fs.existsSync(mainPath)) {
      const content = fs.readFileSync(mainPath, 'utf8');
      const hasUnsafe = content.includes('isUnsafeProperty') || content.includes('reactIs_unsafeProperty');
      console.log('  has isUnsafeProperty:', hasUnsafe);
      console.log('  first 200 chars:', content.substring(0, 200));
    }
  }
}
