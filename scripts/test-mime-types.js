import fs from 'fs';
import http from 'http';
import path from 'path';

const testFiles = [
  '/dist/frontend/utils/logger.js',
  '/dist/frontend/services/apiClient.js',
  '/dist/frontend/main.js',
  '/dist/frontend/authManager.js',
  '/dist/frontend/scroll-effects-fix.js'
];

function testMIMETypes() {
  console.log('🔍 Testing MIME types for JavaScript files...\n');

  const options = {
    hostname: 'localhost',
    port: 3000,
    method: 'HEAD'
  };

  let completed = 0;
  const total = testFiles.length;

  testFiles.forEach(filePath => {
    const req = http.request({...options, path: filePath}, (res) => {
      const contentType = res.headers['content-type'] || 'Not set';
      const statusCode = res.statusCode;

      console.log(`📄 ${filePath}:`);
      console.log(`   Status: ${statusCode}`);
      console.log(`   Content-Type: ${contentType}`);

      if (contentType === 'application/javascript') {
        console.log(`   ✅ CORRECT MIME type\n`);
      } else if (contentType.includes('text/html')) {
        console.log(`   ❌ WRONG MIME type (HTML instead of JS)\n`);
      } else {
        console.log(`   ⚠️  UNEXPECTED MIME type\n`);
      }

      completed++;
      if (completed === total) {
        console.log('🎯 MIME type testing completed!');
      }
    });

    req.on('error', (err) => {
      console.log(`❌ Error testing ${filePath}: ${err.message}\n`);
      completed++;
      if (completed === total) {
        console.log('🎯 MIME type testing completed!');
      }
    });

    req.end();
  });
}

// Check if server is running first
const healthCheck = http.request({hostname: 'localhost', port: 3000, path: '/', method: 'HEAD'}, (res) => {
  if (res.statusCode === 200) {
    testMIMETypes();
  } else {
    console.log('❌ Server is not running on localhost:3000');
    console.log('Please start the server first with: npm run dev');
  }
});

healthCheck.on('error', () => {
  console.log('❌ Server is not running on localhost:3000');
  console.log('Please start the server first with: npm run dev');
});

healthCheck.end();