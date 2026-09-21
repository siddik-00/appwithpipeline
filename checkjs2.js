const fs = require('fs');
const c = fs.readFileSync('public/index.html', 'utf8').replace(/^\uFEFF/, '');
let count = 0, out = [], n = 0;
while (true) {
  const s = c.indexOf('<script>', count);
  if (s < 0) break;
  const e = c.indexOf('</script>', s);
  const body = c.slice(s + 8, e);
  count = e + 9; n++;
  let msg;
  try { new Function(body); msg = 'PARSES OK'; }
  catch (err) { msg = 'SYNTAX ERROR: ' + err.message; }
  out.push('SCRIPT ' + n + ' len=' + body.length + ' hasPick=' + body.includes('function pickAttachment') + ' hasToggle=' + body.includes('toggleAttachMenu') + ' -> ' + msg);
}
console.log(out.join('\n'));