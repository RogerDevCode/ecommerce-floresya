#!/usr/bin/env node
/**
 * Comprehensive MIME Type Validation Test - Strategic Plan Implementation
 * Tests all identified problematic JavaScript files for MIME type issues
 */

import http from 'http';

const BASE_URL = 'http://localhost:3000';

// Test files with correct SSOT structure
const testFiles = [
  // All frontend files are now in dist/frontend/ after post-build script
  '/dist/frontend/main.js',
  '/dist/frontend/authManager.js',
  '/dist/frontend/auth.js', // Symlink to authManager.js
  '/dist/frontend/utils/logger.js',
  '/dist/frontend/services/apiClient.js',
  '/dist/frontend/services/api.js', // Symlink to apiClient.js
  '/dist/frontend/scroll-effects-fix.js',
  '/dist/frontend/adminPanel.js',
  '/dist/frontend/product-detail.js',
  '/dist/frontend/users-admin.js',
];

function testMimeType(path) {
  return new Promise((resolve, reject) => {
    const url = `${BASE_URL}${path}`;
    const req = http.request(url, { method: 'HEAD' }, (res) => {
      const contentType = res.headers['content-type'] || 'no-content-type';
      const status = res.statusCode;

      resolve({
        path,
        status,
        contentType,
        isValid: status === 200 && (
          contentType.includes('application/javascript') ||
          contentType.includes('text/javascript')
        ),
        hasNosniff: res.headers['x-content-type-options'] === 'nosniff',
        fullHeaders: res.headers
      });
    });

    req.on('error', (err) => {
      reject({ path, error: err.message });
    });

    req.setTimeout(5000, () => {
      req.destroy();
      reject({ path, error: 'timeout' });
    });

    req.end();
  });
}

async function runComprehensiveTest() {
  console.log('🔍 Comprehensive MIME Type Validation Test - Strategic Plan');
  console.log('================================================\n');

  const results = [];
  const errors = [];

  for (const file of testFiles) {
    try {
      console.log(`Testing: ${file}`);
      const result = await testMimeType(file);
      results.push(result);

      // Detailed analysis as per strategic plan
      if (!result.isValid) {
        console.log(`❌ FAILED: ${file}`);
        console.log(`   Status: ${result.status}`);
        console.log(`   MIME: ${result.contentType}`);

        // Strategic plan analysis
        if (result.status === 404) {
          console.log(`   🔍 DIAGNOSIS: File not found - path resolution issue`);
        } else if (result.contentType.includes('text/html')) {
          console.log(`   🔍 DIAGNOSIS: HTML content served - 404 page or wrong handler`);
        } else if (result.contentType.includes('nosniff')) {
          console.log(`   🔍 DIAGNOSIS: MIME sniffing disabled with incorrect type`);
        }
      } else {
        console.log(`✅ PASSED: ${file}`);
        console.log(`   Status: ${result.status}`);
        console.log(`   MIME: ${result.contentType}`);
      }
      console.log('');

    } catch (error) {
      console.log(`💥 ERROR: ${file} - ${error.error || error.message}`);
      errors.push(error);
    }
  }

  // Summary Report as per strategic plan
  console.log('\n📊 COMPREHENSIVE TEST RESULTS');
  console.log('==============================');

  const validFiles = results.filter(r => r.isValid);
  const invalidFiles = results.filter(r => !r.isValid);

  console.log(`✅ Valid MIME types: ${validFiles.length}/${results.length}`);
  console.log(`❌ Invalid MIME types: ${invalidFiles.length}/${results.length}`);
  console.log(`💥 Request errors: ${errors.length}`);

  if (invalidFiles.length > 0) {
    console.log('\n🚨 PROBLEMATIC FILES:');
    invalidFiles.forEach(file => {
      console.log(`   ${file.path} - Status: ${file.status}, MIME: ${file.contentType}`);
    });
  }

  if (errors.length > 0) {
    console.log('\n💥 ERROR FILES:');
    errors.forEach(err => {
      console.log(`   ${err.path} - ${err.error}`);
    });
  }

  // Strategic plan validation
  const allValid = invalidFiles.length === 0 && errors.length === 0;
  if (allValid) {
    console.log('\n🎉 STRATEGIC PLAN VALIDATION: ALL FILES PASS');
    console.log('✅ No MIME type issues detected');
    console.log('✅ No 404 errors found');
    console.log('✅ No corrupted content detected');
  } else {
    console.log('\n⚠️  STRATEGIC PLAN VALIDATION: ISSUES DETECTED');
    console.log('❌ Manual intervention required');
  }

  return { validFiles, invalidFiles, errors, allValid };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runComprehensiveTest()
    .then(result => {
      process.exit(result.allValid ? 0 : 1);
    })
    .catch(err => {
      console.error('Test execution failed:', err);
      process.exit(1);
    });
}

export { runComprehensiveTest };