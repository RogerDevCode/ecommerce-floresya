#!/usr/bin/env node

/**
 * Pre-deployment check script for FloresYa
 * Verifies that all required configurations are in place
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Running pre-deployment checks for FloresYa...\n');

const checks = [
    {
        name: 'vercel.json exists',
        check: () => fs.existsSync('vercel.json'),
        fix: 'Create vercel.json configuration file'
    },
    {
        name: '.vercelignore exists', 
        check: () => fs.existsSync('.vercelignore'),
        fix: 'Create .vercelignore file'
    },
    {
        name: 'package.json has correct scripts',
        check: () => {
            const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
            return pkg.scripts && pkg.scripts.start && pkg.scripts.build;
        },
        fix: 'Add build and start scripts to package.json'
    },
    {
        name: 'Frontend directory exists',
        check: () => fs.existsSync('frontend') && fs.existsSync('frontend/index.html'),
        fix: 'Ensure frontend directory and index.html exist'
    },
    {
        name: 'Backend server exists',
        check: () => fs.existsSync('backend/src/server.js'),
        fix: 'Ensure backend/src/server.js exists'
    },
    {
        name: 'Environment example exists',
        check: () => fs.existsSync('.env.production.example'),
        fix: 'Create .env.production.example template'
    }
];

let passed = 0;
let failed = 0;

checks.forEach(check => {
    const result = check.check();
    if (result) {
        console.log(`✅ ${check.name}`);
        passed++;
    } else {
        console.log(`❌ ${check.name}`);
        console.log(`   Fix: ${check.fix}\n`);
        failed++;
    }
});

console.log(`\n📊 Results: ${passed} passed, ${failed} failed\n`);

if (failed === 0) {
    console.log('🎉 All checks passed! Ready for deployment to Vercel.\n');
    console.log('Next steps:');
    console.log('1. Push code to GitHub');
    console.log('2. Import project in Vercel');
    console.log('3. Add environment variables');
    console.log('4. Deploy!');
} else {
    console.log('🚨 Please fix the issues above before deploying.');
    process.exit(1);
}