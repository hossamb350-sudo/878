const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const targetDir = path.join(__dirname, 'android/app');

// Generate x509 cert and key
execSync('openssl req -x509 -newkey rsa:2048 -keyout key.pem -out cert.pem -days 10000 -nodes -subj "/O=Android/CN=Android Debug"');

// Create PKCS12
execSync('openssl pkcs12 -export -out debug.p12 -inkey key.pem -in cert.pem -name "androiddebugkey" -passout pass:android');

// Get fingerprints
const sha1Output = execSync('openssl x509 -noout -fingerprint -sha1 -in cert.pem').toString();
const sha1 = sha1Output.replace('SHA1 Fingerprint=', '').replace(/:/g, '').trim().toLowerCase();

const sha256Output = execSync('openssl x509 -noout -fingerprint -sha256 -in cert.pem').toString();
const sha256 = sha256Output.replace('SHA256 Fingerprint=', '').replace(/:/g, '').trim().toLowerCase();

console.log('SHA1:', sha1);
console.log('SHA256:', sha256);

// Move debug.p12 to android/app
fs.copyFileSync('debug.p12', path.join(targetDir, 'debug.p12'));

// Clean up
fs.unlinkSync('key.pem');
fs.unlinkSync('cert.pem');
fs.unlinkSync('debug.p12');
