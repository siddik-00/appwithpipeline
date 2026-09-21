const fs=require('fs');const c=fs.readFileSync('public/index.html','utf8').replace(/^\uFEFF/,'');
const i=c.indexOf('attach-btn');const j=c.indexOf('attachMenu');
console.log('=== composer html (attach-btn -> attachMenu-end) ===');
console.log(c.slice(i-80, Math.min(c.length,i+900)));
console.log('\n=== send button block ===');
const s=c.indexOf('sendChatMsg()"');
console.log(c.slice(s-160,s+90));
