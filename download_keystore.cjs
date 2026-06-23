const fs = require('fs');

async function download() {
  const response = await fetch("https://raw.githubusercontent.com/facebook/react-native/main/packages/react-native/template/android/app/debug.keystore");
  const buffer = await response.arrayBuffer();
  fs.writeFileSync("/app/applet/android/app/debug.keystore", Buffer.from(buffer));
  console.log("Download complete.");
}

download();
