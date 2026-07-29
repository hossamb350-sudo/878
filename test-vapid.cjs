const webPush = require('web-push');
const VAPID_PUBLIC_KEY = "BEw8fkpN0JQ-HB7b1mxhuicMWZUqvB5nCnLRYv6VjIoMxCTJQVsYGqP2-CnhPpUm0pkgz6LQZ7Ut1jsvQn4Q9ow";
const VAPID_PRIVATE_KEY = "btEWHmdPbPg_jgywYnb6z4NujfcN5TeJQDY8JbDTAOQ";
webPush.setVapidDetails("mailto:test@example.com", VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
console.log("Success");
