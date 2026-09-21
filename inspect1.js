const fs = require('fs');
const c = fs.readFileSync('public/index.html', 'utf8').replace(/^\uFEFF/, '');
const i = c.indexOf('<script>');
const j = c.indexOf('</script>', i);
const body = c.slice(i + 8, j);
const names = ['sendChatMsg','sendTextMsg','sendAttachmentMsg','toggleAttachMenu','chooseAttachment','onPickAttachment','cancelAttachment','bubbleHtml','refreshChat','loadThreads','applyWallet','api','esc','chatCost','toast','attachMenu','attachFile'];
for (const n of names) {
  const re = new RegExp('function\\s+' + n + '(?=\\s*\\()', 'g');
  console.log(n.padEnd(20), (body.match(re) || []).length, 'def |', (body.match(new RegExp('(?<![\\w.])' + n + '\\s*(?:\\()', 'g')) || []).length, 'usages');
}
const errors = [];
try { new Function(body); console.log('JS PARSE: OK'); } catch (e) { console.log('JS PARSE FAIL:', e.message); }
// composer markup: check onclick names referenced vs defined
const names2 = [...new Set([...(body.match(/onclick="(\w+)\(/g) || []), ...(body.match(/onchange="(\w+)\(/g) || [])].map((x) => x.match(/[\w]+\(/)[0].slice(0, -1)))];
for (const nn of names2) {
  const has = new RegExp('function\\s+' + nn + '(?=\\s*\\()', 'g').test(body);
  if (!has) console.log('HTML calls function NOT DEFINED IN SCRIPT:', nn);
}
console.log('KINDS check: choose attachment validation text present:', body.includes("Only PDF files"), body.includes('application/pdf'));