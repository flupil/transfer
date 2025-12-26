#!/usr/bin/env node

/**
 * Test gym branding locally
 * Usage: node scripts/test-branding.js <gym-slug>
 * Example: node scripts/test-branding.js powerfit
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function testBranding(gymSlug) {
  console.log(`\n🎨 Testing branding for: ${gymSlug}\n`);

  const gymPath = path.join(__dirname, '../gyms', gymSlug);
  const configPath = path.join(gymPath, 'gym-config.json');

  // Check if gym exists
  if (!fs.existsSync(configPath)) {
    console.error(`❌ Gym "${gymSlug}" not found!`);
    console.error(`   Expected config at: ${configPath}`);
    console.log('\nAvailable gyms:');
    const gymsDir = path.join(__dirname, '../gyms');
    const gyms = fs.readdirSync(gymsDir).filter(f => {
      const stat = fs.statSync(path.join(gymsDir, f));
      return stat.isDirectory() && f !== '_template';
    });
    gyms.forEach(g => console.log(`   - ${g}`));
    process.exit(1);
  }

  // Load gym config
  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

  console.log('📋 Gym Information:');
  console.log(`   Name:        ${config.branding.gymName}`);
  console.log(`   App:         ${config.branding.appName}`);
  console.log(`   Primary:     ${config.branding.colors.primary}`);
  console.log(`   Secondary:   ${config.branding.colors.secondary}`);
  console.log('');

  // Set environment variables
  console.log('🔧 Setting up environment...');
  const gymEnvPath = path.join(gymPath, '.env');
  const rootEnvPath = path.join(__dirname, '../.env');

  if (fs.existsSync(gymEnvPath)) {
    fs.copyFileSync(gymEnvPath, rootEnvPath);
    console.log('   ✓ Environment variables set');
  }

  // Copy assets to test location
  console.log('🎨 Copying assets...');
  const gymAssetsPath = path.join(gymPath, 'assets');
  const appAssetsPath = path.join(__dirname, '../assets/gym-branding');

  if (!fs.existsSync(appAssetsPath)) {
    fs.mkdirSync(appAssetsPath, { recursive: true });
  }

  // Delete old assets to force Metro cache refresh
  if (fs.existsSync(appAssetsPath)) {
    const existingAssets = fs.readdirSync(appAssetsPath);
    existingAssets.forEach(file => {
      const filePath = path.join(appAssetsPath, file);
      if (fs.statSync(filePath).isFile()) {
        fs.unlinkSync(filePath);
      }
    });
    console.log('   ✓ Old assets cleared');
  }

  if (fs.existsSync(gymAssetsPath)) {
    const assets = fs.readdirSync(gymAssetsPath);
    assets.forEach(asset => {
      if (asset.endsWith('.png') || asset.endsWith('.jpg')) {
        const source = path.join(gymAssetsPath, asset);
        const dest = path.join(appAssetsPath, asset);
        fs.copyFileSync(source, dest);
      }
    });
    console.log('   ✓ New assets copied');
  }

  // Update branding constants
  console.log('📝 Updating branding constants...');
  const constantsPath = path.join(__dirname, '../src/constants/gymBranding.ts');
  const constantsDir = path.dirname(constantsPath);

  if (!fs.existsSync(constantsDir)) {
    fs.mkdirSync(constantsDir, { recursive: true });
  }

  const content = `/**
 * Gym Branding Configuration
 * Auto-generated for testing: ${gymSlug}
 * DO NOT COMMIT - This file is for local testing only
 */

export const GYM_BRANDING = ${JSON.stringify(config.branding, null, 2)};

export const GYM_CONTACT = ${JSON.stringify(config.contact, null, 2)};

export const GYM_ID = '${config.gymId}';

export const GYM_SLUG = '${config.gymSlug}';

export const GYM_FEATURES = ${JSON.stringify(config.features, null, 2)};
`;

  fs.writeFileSync(constantsPath, content);
  console.log('   ✓ Branding constants updated');

  console.log('');
  console.log('━'.repeat(60));
  console.log('✅ Branding configured!');
  console.log('━'.repeat(60));
  console.log('');
  console.log('🚀 Starting development server...\n');
  console.log(`   The app will now use ${config.branding.gymName}'s branding`);
  console.log(`   Primary color: ${config.branding.colors.primary}`);
  console.log(`   Logo: ${config.branding.gymName} logo\n`);

  // Clear Metro cache and start expo
  console.log('🧹 Clearing Metro cache...');
  const expoDir = path.join(__dirname, '../.expo');
  if (fs.existsSync(expoDir)) {
    fs.rmSync(expoDir, { recursive: true, force: true });
    console.log('   ✓ Metro cache cleared\n');
  }

  // Start expo with --clear flag
  try {
    execSync('npx expo start --clear', {
      stdio: 'inherit',
      cwd: path.join(__dirname, '..')
    });
  } catch (error) {
    console.error('❌ Failed to start Expo');
    process.exit(1);
  }
}

// Main execution
const gymSlug = process.argv[2];

if (!gymSlug) {
  console.error('\n❌ Please provide a gym slug\n');
  console.log('Usage: node scripts/test-branding.js <gym-slug>');
  console.log('Example: node scripts/test-branding.js powerfit\n');

  // List available gyms
  const gymsDir = path.join(__dirname, '../gyms');
  if (fs.existsSync(gymsDir)) {
    const gyms = fs.readdirSync(gymsDir).filter(f => {
      const stat = fs.statSync(path.join(gymsDir, f));
      return stat.isDirectory() && f !== '_template';
    });

    if (gyms.length > 0) {
      console.log('Available gyms:');
      gyms.forEach(g => console.log(`   - ${g}`));
      console.log('');
    }
  }

  process.exit(1);
}

testBranding(gymSlug);
