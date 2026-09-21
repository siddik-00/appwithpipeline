const fs=require('fs');const c=fs.readFileSync('public/index.html','utf8').replace(/^\uFEFF/,'');
// composer html: find chatText input and sendBtn
for(const id of ['id="chatText"','id="chatText" value=','id="sendBtn"','onclick="sendChatMsg()"']){
  const i=c.indexOf(id); console.log('\n>>> "'+id+'" at',i, i>=0? 'present':'MISSING');
}
const i=c.indexOf('class="composer'); console.log('\n=== composer div region ===');
console.log(c.slice(i, i+1400));
