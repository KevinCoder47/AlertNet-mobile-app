const fs = require('fs');
const path = require('path');

const filesToPatch = [
  'node_modules/react-native-maps/src/MapMarker.tsx',
  'node_modules/react-native-maps/src/MapCircle.tsx',
  'node_modules/react-native-maps/src/MapPolyline.tsx',
];

filesToPatch.forEach(filePath => {
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    // Comment out getNativeComponent property declaration
    content = content.replace(/(\s+)getNativeComponent[\s\S]*?;/g, '$1//getNativeComponent;');
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✓ Patched: ${filePath}`);
  } else {
    console.log(`✗ Not found: ${filePath}`);
  }
});

console.log('\nAll files patched! Now run: npx patch-package react-native-maps');