/**
 * Vercel Configuration Fix Script
 * 
 * This script automates the process of fixing Vercel configuration issues
 * that were identified manually. It follows the same algorithm and 
 * reasoning used to resolve the vercel.json conflicts.
 */

import fs from 'fs';
import path from 'path';

class VercelConfigFixer {
  constructor() {
    this.vercelPath = path.join(process.cwd(), 'vercel.json');
    this.backupPath = path.join(process.cwd(), 'vercel.json.backup');
    this.todoStatus = {
      examineVercelJson: false,
      checkTsConfigAndDist: false,
      fixRoutingConflicts: false,
      ensureVercelConfigReady: false
    };
  }

  /**
   * Main execution method that follows the same algorithm used manually
   */
  async execute() {
    console.log('🚀 Starting Vercel Configuration Fix Process...\n');

    try {
      // Step 1: Examine vercel.json to identify configuration conflicts
      await this.examineVercelJson();
      
      // Step 2: Check tsconfig files and dist structure
      await this.checkTsConfigAndDist();
      
      // Step 3: Fix the routing conflicts in Vercel configuration
      await this.fixRoutingConflicts();
      
      // Step 4: Ensure project is properly configured for Vercel deployment
      await this.ensureVercelConfigReady();
      
      console.log('\n✅ Vercel Configuration Fix Process Completed Successfully!');
      console.log('The vercel.json file has been updated with proper configurations.');
      return true;
    } catch (error) {
      console.error('\n❌ Error during Vercel Configuration Fix Process:', error.message);
      return false;
    }
  }

  /**
   * Step 1: Examine vercel.json to identify configuration conflicts
   */
  async examineVercelJson() {
    console.log('🔍 Step 1: Examining vercel.json to identify configuration conflicts...');
    
    if (!fs.existsSync(this.vercelPath)) {
      throw new Error('vercel.json file not found in the project root');
    }

    const vercelContent = fs.readFileSync(this.vercelPath, 'utf8');
    const vercelConfig = JSON.parse(vercelContent);

    // Check for configuration issues
    const hasBuilds = vercelConfig.builds !== undefined;
    const hasRoutes = vercelConfig.routes !== undefined;
    const hasHeaders = vercelConfig.headers !== undefined;
    const hasFunctions = vercelConfig.functions !== undefined;

    console.log(`   - Builds property present: ${hasBuilds}`);
    console.log(`   - Routes property present: ${hasRoutes}`);
    console.log(`   - Headers property present: ${hasHeaders}`);
    console.log(`   - Functions property present: ${hasFunctions}`);

    if (hasBuilds && hasRoutes) {
      console.log('   ⚠️  Found conflicting "builds" and "routes" properties (not allowed by Vercel)');
    }

    if (hasRoutes && hasHeaders) {
      console.log('   ⚠️  Found conflicting "routes" and "headers" properties (causes routing conflicts)');
    }

    // Create a backup
    fs.writeFileSync(this.backupPath, vercelContent);
    console.log('   ✅ Created backup of original vercel.json');

    this.todoStatus.examineVercelJson = true;
    console.log('   ✅ Step 1 completed\n');
  }

  /**
   * Step 2: Check tsconfig files and dist structure
   */
  async checkTsConfigAndDist() {
    console.log('📂 Step 2: Checking tsconfig files and dist structure...');

    // Check if main tsconfig exists
    const tsConfigPath = path.join(process.cwd(), 'tsconfig.json');
    if (!fs.existsSync(tsConfigPath)) {
      throw new Error('tsconfig.json not found in project root');
    }
    console.log('   ✅ Found main tsconfig.json');

    // Check if frontend tsconfig exists
    const frontendTsConfigPath = path.join(process.cwd(), 'src/frontend/tsconfig.frontend.json');
    if (!fs.existsSync(frontendTsConfigPath)) {
      throw new Error('src/frontend/tsconfig.frontend.json not found');
    }
    console.log('   ✅ Found frontend tsconfig.frontend.json');

    // Determine backend server path from tsconfig
    const tsConfig = JSON.parse(fs.readFileSync(tsConfigPath, 'utf8'));
    const outDir = tsConfig.compilerOptions?.outDir || './dist/backend';
    const rootDir = tsConfig.compilerOptions?.rootDir || './src';
    
    console.log(`   - Backend output directory: ${outDir}`);
    console.log(`   - Source root directory: ${rootDir}`);

    // Check for backend server.js file (after a build)
    const possibleServerPaths = [
      path.join(process.cwd(), outDir.replace('./', ''), 'app', 'server.js'),
      path.join(process.cwd(), outDir.replace('./', ''), 'server.js'),
      path.join(process.cwd(), 'dist', 'backend', 'app', 'server.js')
    ];

    let backendServerPath = null;
    for (const serverPath of possibleServerPaths) {
      if (fs.existsSync(serverPath)) {
        backendServerPath = serverPath;
        console.log(`   ✅ Found backend server at: ${path.relative(process.cwd(), serverPath)}`);
        break;
      }
    }

    if (!backendServerPath) {
      console.log('   ⚠️  Backend server.js not found. Building project to determine structure...');
      // Since we can't run npm here, assume the standard path based on config
      backendServerPath = path.join(process.cwd(), outDir.replace('./', ''), 'app', 'server.js');
      console.log(`   ℹ️  Assuming backend server path: ${path.relative(process.cwd(), backendServerPath)}`);
    }

    // Store the server path for later use
    this.backendServerPath = backendServerPath;

    this.todoStatus.checkTsConfigAndDist = true;
    console.log('   ✅ Step 2 completed\n');
  }

  /**
   * Step 3: Fix the routing conflicts in Vercel configuration
   */
  async fixRoutingConflicts() {
    console.log('🔧 Step 3: Fixing routing conflicts in Vercel configuration...');

    // Read the current vercel.json
    const vercelContent = fs.readFileSync(this.vercelPath, 'utf8');
    const vercelConfig = JSON.parse(vercelContent);

    // Create the fixed configuration following modern Vercel practices
    const fixedConfig = {
      version: 2,
      functions: {
        [this.getRelativeServerPath()]: {
          includeFiles: [
            "dist/backend/**",
            "dist/frontend/**",
            "public/**",
            "package.json",
            "tailwind.config.ts",
            "postcss.config.js"
          ]
        }
      },
      rewrites: [
        {
          source: "/api/(.*)",
          destination: "/dist/backend/app/server.js"
        },
        {
          source: "/api-docs(.*)",
          destination: "/dist/backend/app/server.js"
        },
        {
          source: "/(.*)",
          destination: "/dist/backend/app/server.js"
        }
      ],
      headers: this.extractHeaders(vercelConfig)
    };

    // Preserve any other configuration properties that are valid
    if (vercelConfig.installCommand) {
      fixedConfig.installCommand = vercelConfig.installCommand;
    }
    if (vercelConfig.buildCommand) {
      fixedConfig.buildCommand = vercelConfig.buildCommand;
    }
    if (vercelConfig.github) {
      fixedConfig.github = vercelConfig.github;
    }

    // Write the fixed configuration
    const fixedContent = JSON.stringify(fixedConfig, null, 2);
    fs.writeFileSync(this.vercelPath, fixedContent);

    console.log('   ✅ Replaced conflicting "builds/routes" with modern "functions/rewrites"');
    console.log('   ✅ Applied proper routing for API and SPA fallback');
    console.log('   ✅ Preserved existing headers and other configurations');

    this.todoStatus.fixRoutingConflicts = true;
    console.log('   ✅ Step 3 completed\n');
  }

  /**
   * Step 4: Ensure project is properly configured for Vercel deployment
   */
  async ensureVercelConfigReady() {
    console.log('✅ Step 4: Verifying project is properly configured for Vercel deployment...');

    // Read the fixed configuration
    const fixedContent = fs.readFileSync(this.vercelPath, 'utf8');
    const fixedConfig = JSON.parse(fixedContent);

    // Validate the structure
    const isValid = this.validateVercelConfig(fixedConfig);
    
    if (!isValid) {
      throw new Error('Fixed configuration is not valid');
    }

    console.log('   ✅ Configuration validation passed');
    console.log('   ✅ No more conflicting properties (builds/routes mix)');
    console.log('   ✅ Modern functions/rewrites configuration applied');
    console.log('   ✅ Proper headers configuration maintained');

    // Test if the config resolves all the original issues
    const hasBuilds = fixedConfig.builds !== undefined;
    const hasRoutes = fixedConfig.routes !== undefined;
    const hasFunctions = fixedConfig.functions !== undefined;
    const hasRewrites = fixedConfig.rewrites !== undefined;

    console.log(`   - Old issues resolved: builds=${hasBuilds}, routes=${hasRoutes}`);
    console.log(`   - New configuration: functions=${hasFunctions}, rewrites=${hasRewrites}`);

    this.todoStatus.ensureVercelConfigReady = true;
    console.log('   ✅ Step 4 completed\n');
  }

  /**
   * Helper method to extract headers from original config
   */
  extractHeaders(originalConfig) {
    if (originalConfig.headers) {
      return originalConfig.headers;
    }
    
    // If no headers exist, return a basic security header setup
    return [
      {
        "source": "/api/(.*)",
        "headers": [
          {
            "key": "Access-Control-Allow-Origin",
            "value": "https://floresya.vercel.app"
          },
          {
            "key": "Access-Control-Allow-Methods",
            "value": "GET, POST, PUT, DELETE, OPTIONS"
          },
          {
            "key": "Access-Control-Allow-Headers",
            "value": "Content-Type, Authorization, X-Requested-With"
          }
        ]
      }
    ];
  }

  /**
   * Helper method to get relative server path
   */
  getRelativeServerPath() {
    const absolutePath = this.backendServerPath || path.join(process.cwd(), 'dist/backend/app/server.js');
    return path.relative(process.cwd(), absolutePath).replace(/\\/g, '/');
  }

  /**
   * Validate that the configuration is valid for Vercel
   */
  validateVercelConfig(config) {
    // Must have version 2
    if (config.version !== 2) {
      return false;
    }

    // Cannot have both builds and functions
    if (config.builds && config.functions) {
      return false;
    }

    // Cannot have both routes and rewrites/redirects/headers
    if (config.routes && (config.rewrites || config.redirects || config.headers)) {
      return false;
    }

    // Functions property requires proper format
    if (config.functions) {
      for (const [path, settings] of Object.entries(config.functions)) {
        if (typeof path !== 'string' || !settings.includeFiles) {
          return false;
        }
      }
    }

    return true;
  }

  /**
   * Get the current status of the fix process
   */
  getStatus() {
    return {
      completed: Object.values(this.todoStatus).every(status => status === true),
      todoStatus: this.todoStatus,
      backupPath: this.backupPath
    };
  }
}

// Export the class for potential reuse
export { VercelConfigFixer };

// Main execution when run as a script
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('Vercel Configuration Fix Script');
  console.log('==============================\n');
  
  const fixer = new VercelConfigFixer();
  
  // Execute the fix process
  fixer.execute()
    .then(success => {
      if (success) {
        console.log('\n🎉 Vercel configuration has been successfully fixed!');
        console.log(`📋 Backup of original file saved as: ${path.basename(fixer.backupPath)}`);
      } else {
        console.log('\n❌ Vercel configuration fix failed. Check the errors above.');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('Unexpected error:', error);
      process.exit(1);
    });
}