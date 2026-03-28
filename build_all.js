import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const configurations = [
  { mode: 'manufacturer', outDir: 'dist-manufacturer' },
  { mode: 'retailer', outDir: 'dist-retailer' },
  { mode: 'admin', outDir: 'dist-admin' }
];

const vercelConfig = {
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/"
    }
  ]
};

console.log('Starting automated builds for Vercel deployment...\n');

for (const config of configurations) {
    console.log(`===========================================`);
    console.log(`Building production bundle for: ${config.mode.toUpperCase()}`);
    console.log(`===========================================`);
    
    try {
        // Run vite build with specific mode and outDir
        execSync(`npx vite build --mode ${config.mode} --outDir ${config.outDir} --emptyOutDir`, { stdio: 'inherit' });
        
        // Write vercel.json for SPA routing inside the build folder
        const vercelPath = path.join(config.outDir, 'vercel.json');
        fs.writeFileSync(vercelPath, JSON.stringify(vercelConfig, null, 2));
        console.log(`-> Added Vercel routing configuration to ${config.outDir}/vercel.json\n`);
    } catch (err) {
        console.error(`\n[!] Error building ${config.mode}. Aborting.\n`, err);
        process.exit(1);
    }
}

console.log('\n===========================================');
console.log('ALL BUILDS COMPLETE!');
console.log('You can now run deploy_to_vercel.bat to upload them.');
console.log('===========================================\n');
