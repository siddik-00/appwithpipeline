const fs=require('fs');const c=fs.readFileSync('public/index.html','utf8').replace(/^\uFEFF/,'');
const i=c.indexOf('id="chatText"');if(i<0){console.log('chatText MISSING');process.exit(0)}
console.log('=== composer INPUT + send btn region ===');console.log(c.slice(i-260,i+300));
console.log('\n=== sendChatMsg ===');
const k=c.indexOf('function sendChatMsg');
console.log(c.slice(k,k+430));
