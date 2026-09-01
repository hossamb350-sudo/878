import { URL } from 'url';
const reqUrl = '/quran?lesson=123&series=456';
const url = new URL(reqUrl, 'http://localhost');
console.log(url.pathname, url.searchParams.get('lesson'));
