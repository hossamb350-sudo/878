const https = require('https');
const fs = require('fs');

const file = fs.createWriteStream("android/app/debug.keystore");
https.get("https://raw.githubusercontent.com/facebook/react-native/main/packages/react-native/template/android/app/debug.keystore", function(response) {
  response.pipe(file);
  file.on('finish', function() {
    file.close();
    console.log("Download complete.");
  });
});
