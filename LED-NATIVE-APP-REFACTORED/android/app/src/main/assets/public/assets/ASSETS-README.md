# Assets Directory - Icons Required

## Required Icons

This app requires the following icon files in PNG format:

### PWA & Android Icons
- `icon-72x72.png` - 72x72 pixels
- `icon-96x96.png` - 96x96 pixels
- `icon-128x128.png` - 128x128 pixels
- `icon-144x144.png` - 144x144 pixels
- `icon-152x152.png` - 152x152 pixels
- `icon-192x192.png` - 192x192 pixels (Primary PWA icon)
- `icon-384x384.png` - 384x384 pixels
- `icon-512x512.png` - 512x512 pixels (Largest icon for high-res displays)

## How to Generate Icons

### Option 1: Use PWA Asset Generator (Recommended)
```bash
npm install -g pwa-asset-generator
pwa-asset-generator [source-image.png] ./www/assets --manifest ./www/manifest.json
```

### Option 2: Online Tools
- **Favicon Generator**: https://realfavicongenerator.net/
- **PWA Builder**: https://www.pwabuilder.com/imageGenerator
- **Icon Generator**: https://icon.kitchen/

### Option 3: Manual Creation with Image Editor
Use any image editor (Photoshop, GIMP, etc.) to resize your logo to each required size.

## Design Guidelines

- **Square format** (1:1 aspect ratio)
- **Transparent or solid background** (recommend dark: #0a0a0a)
- **Center your logo** with appropriate padding
- **Export as PNG** with transparency
- **Use high-quality source** (minimum 512x512px)

## Android Adaptive Icons

For Android, you should also create adaptive icons:
- `android/app/src/main/res/mipmap-*/ic_launcher.png`
- Use Android Studio's Image Asset Studio or online tools

## Quick Setup for Development

If you want to quickly test without icons:
1. Create a simple 512x512 PNG with your app name/logo
2. Use an online converter to generate all sizes
3. Place all generated files in this directory

## Current Status

⚠️ **Icons are currently missing**. Please add them before deploying to production.

For development/testing, the app will work without icons, but users will see:
- Default browser icons
- Broken image links in some contexts
- No app icon on home screen

## Integration

Icons are referenced in:
- `/www/manifest.json` - PWA manifest
- `/www/index.html` - Meta tags
- `capacitor.config.json` - Native app config
- Android resource directories

After adding icons, run:
```bash
npx cap sync android
```
