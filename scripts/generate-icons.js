#!/usr/bin/env node

/**
 * Generate PNG icons from SVG
 * Simple script to create favicon and apple-icon
 */

const fs = require('fs');
const { createCanvas, loadImage } = require('canvas');

// Read the SVG and render to canvas
async function generateIcons() {
  console.log('📦 Generating icons...\n');

  // Create 32x32 favicon
  console.log('Creating icon.png (32x32)...');
  const canvas32 = createCanvas(32, 32);
  const ctx32 = canvas32.getContext('2d');
  
  // Black background
  ctx32.fillStyle = '#000000';
  ctx32.fillRect(0, 0, 32, 32);
  
  // White icon
  ctx32.strokeStyle = '#ffffff';
  ctx32.lineWidth = 2;
  ctx32.lineCap = 'round';
  ctx32.lineJoin = 'round';
  
  // Draw SquareKanban icon (scaled to fit 32x32)
  const scale = 32 / 24;
  ctx32.save();
  ctx32.scale(scale, scale);
  
  // Outer rect
  ctx32.beginPath();
  ctx32.roundRect(3, 3, 18, 18, 2);
  ctx32.stroke();
  
  // Three columns
  ctx32.beginPath();
  ctx32.moveTo(8, 7);
  ctx32.lineTo(8, 14);
  ctx32.stroke();
  
  ctx32.beginPath();
  ctx32.moveTo(12, 7);
  ctx32.lineTo(12, 11);
  ctx32.stroke();
  
  ctx32.beginPath();
  ctx32.moveTo(16, 7);
  ctx32.lineTo(16, 16);
  ctx32.stroke();
  
  ctx32.restore();
  
  // Save
  const buffer32 = canvas32.toBuffer('image/png');
  fs.writeFileSync('public/icon.png', buffer32);
  console.log('✓ icon.png created\n');

  // Create 180x180 apple icon
  console.log('Creating apple-icon.png (180x180)...');
  const canvas180 = createCanvas(180, 180);
  const ctx180 = canvas180.getContext('2d');
  
  // Black background
  ctx180.fillStyle = '#000000';
  ctx180.fillRect(0, 0, 180, 180);
  
  // White icon (centered and scaled)
  ctx180.strokeStyle = '#ffffff';
  ctx180.lineWidth = 8;
  ctx180.lineCap = 'round';
  ctx180.lineJoin = 'round';
  
  const scale180 = 120 / 24;
  const offset = (180 - 120) / 2;
  ctx180.save();
  ctx180.translate(offset, offset);
  ctx180.scale(scale180, scale180);
  
  // Outer rect
  ctx180.beginPath();
  ctx180.roundRect(3, 3, 18, 18, 2);
  ctx180.stroke();
  
  // Three columns
  ctx180.beginPath();
  ctx180.moveTo(8, 7);
  ctx180.lineTo(8, 14);
  ctx180.stroke();
  
  ctx180.beginPath();
  ctx180.moveTo(12, 7);
  ctx180.lineTo(12, 11);
  ctx180.stroke();
  
  ctx180.beginPath();
  ctx180.moveTo(16, 7);
  ctx180.lineTo(16, 16);
  ctx180.stroke();
  
  ctx180.restore();
  
  // Save
  const buffer180 = canvas180.toBuffer('image/png');
  fs.writeFileSync('public/apple-icon.png', buffer180);
  console.log('✓ apple-icon.png created\n');

  console.log('✅ All icons generated successfully!');
}

// Check if canvas is available
try {
  require.resolve('canvas');
  generateIcons().catch(err => {
    console.error('❌ Error generating icons:', err);
    console.log('\n⚠️  Skipping icon generation. Install canvas with: pnpm add -D canvas');
  });
} catch (e) {
  console.log('⚠️  canvas package not found. Skipping icon generation.');
  console.log('   To generate icons, run: pnpm add -D canvas');
  console.log('   For now, using SVG fallback.');
}
