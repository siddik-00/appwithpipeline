const fs = require('fs');
const c = fs.readFileSync('public/index.html', 'utf8').replace(/^\uFEFF/, '');
let count = 0;
const out = [];
while (true) {
  const s = c.indexOf('<script>', count);
  if (s < 0) break;
  const e = c.indexOf('</script>', s);
  const body = c.slice(s + 8, e);
  count = e + 9;
  out.push('SCRIPT #' + out.length + ' len=' + body.length + ' has-fn-sendChatMsg=' + body.includes('function sendChatMsg'));
  try {
    new Function(body);
    out.push('  -> parses OK');
  } catch (err) {
    out.push('  -> SYNTAX ERROR: ' + err.message);
  }
}
console.log(out.join('\n'));
