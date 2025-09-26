// Simple script to fix JSON escaped quotes
import fs from 'fs';

const filePath = './vercel.json';
let content = fs.readFileSync(filePath, 'utf8');

// Fix the escaped quotes
content = content.replace(/\\"/g, '"');
content = content.replace(/\\\\/g, '\\');

// Write back the corrected content
fs.writeFileSync(filePath, content);
console.log('✅ Fixed escaped quotes in vercel.json');