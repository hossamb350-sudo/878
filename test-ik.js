const https = require('https');
const options = {
  hostname: 'upload.imagekit.io',
  path: '/api/v1/files/upload',
  method: 'OPTIONS',
  headers: {
    'Origin': 'http://localhost:3000',
    'Access-Control-Request-Method': 'POST',
    'Access-Control-Request-Headers': 'authorization'
  }
};
const req = https.request(options, (res) => {
  console.log(`STATUS: ${res.statusCode}`);
  console.log(`HEADERS: ${JSON.stringify(res.headers)}`);
});
req.end();
