const fs=require('fs');const c=fs.readFileSync('public/index.html','utf8').replace(/^\uFEFF/,'');
const ids={};for(const m of c.matchAll(/id="([A-Za-z0-9_]+)"/g)){ids[m[1]]=(ids[m[1]]||0)+1}
const dup=Object.entries(ids).filter(([,v])=>v>1).map(([k,v])=>k+':'+v);
console.log('DUPLICATE ids:',dup.length?dup.join(', '):'(none)');
for(const k of ['chatText','chatBody','sendBtn','attachMenu','attachFile','chatThreads','threadsList','msgPanel'])console.log(k, ids[k]||0);
console.log('--- sendChatMsg def check ---');
const b=c.slice(c.indexOf('<script>')+8, c.indexOf('</script>'));
for(const n of ['esc','$ ','async function api','function sendChatMsg','function refreshChat','function loadThreads','function applyWallet','var state','function toggleSendBtn'])console.log(n,'defs', (b.match(new RegExp(n.replace(/\$/,'\\$').replace('(','\\(').replace(')','\\)'),'g'))||[]).length);
console.log('--- CSS still ok: send button style present? ', c.includes('.send-btn{'));
