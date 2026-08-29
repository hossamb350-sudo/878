const sharp = require('sharp');
sharp('public/tape.png')
  .resize(96, 96)
  .toFile('android/app/src/main/res/drawable/tape.png')
  .then(() => console.log('Resized successfully'))
  .catch(err => console.error(err));
