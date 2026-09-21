const fs=require('fs');const c=fs.readFileSync('public/index.html','utf8').replace(/^\uFEFF/,'');
const s=c.indexOf('attach-wrap');console.log('=== RAW COMPOSER (attach-wrap to sendBtn) ===');console.log(c.slice(s, s+720));
const t=c.indexOf('function sendChatMsg');console.log('\n=== sendChatMsg head ===');console.log(c.slice(t, t+430));
