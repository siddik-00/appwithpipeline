const fs=require('fs');const c=fs.readFileSync('public/index.html','utf8').replace(/^\uFEFF/,'');
const k=c.indexOf('function sendChatMsg');const k2=c.indexOf('function refreshChat',k);
console.log('=== sendChatMsg FULL ===');
console.log(c.slice(k,k2));
