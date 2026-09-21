const fs=require('fs');const c=fs.readFileSync('public/index.html','utf8').replace(/^\uFEFF/,'');
const i=c.indexOf('attach-wrap');console.log('=== FULL COMPOSER HTML ===');console.log(c.slice(i-150, i+1300));
