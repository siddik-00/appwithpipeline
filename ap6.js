const fs=require('fs');const c=fs.readFileSync('public/index.html','utf8').replace(/^\uFEFF/,'');
const s=c.indexOf('id="attachMenu"');const a=c.indexOf('class="attach-menu hidden"');
const seg=c.slice(s-40, a+1200);
// count wrap opens/closes in composer
const seg2=c.slice(s-60, s+ (c.indexOf('cancelAttachment()')>-1? 1400:1400));
const open=(seg.match(/class="attach-wrap"/g)||[]).length;
let opens=0,closes=0;for(const ch of seg){if(ch==="<"){}}
console.log('attach-wrap count in menu seg:',open);
console.log('chatText id once?',(c.match(/id="chatText"/g)||[]).length);
console.log('sendBtn id once?',(c.match(/id="sendBtn"/g)||[]).length);
console.log('=== EXACT composer textarea+send+menu region ===');
const i=c.indexOf('<span class="attach-wrap">');console.log(c.slice(i, i+900));
