const fs = require('fs');
console.log('node_modules exists:', fs.existsSync('./node_modules'));
try {
  console.log('express:', require('express/package.json').version);
  console.log('mysql2:', require('mysql2/package.json').version);
  console.log('passport:', require('passport/package.json').version);
  console.log('helmet:', require('helmet/package.json').version);
  console.log('jsonwebtoken:', require('jsonwebtoken/package.json').version);
  console.log('\nAll dependencies installed successfully!');
} catch (e) {
  console.error('Missing dependency:', e.message);
}
