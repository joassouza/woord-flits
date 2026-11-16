const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert');
const root=path.join(__dirname,'..');
const html=fs.readFileSync(path.join(root,'cartas.html'),'utf8'),code=html.match(/<script>([\s\S]*?)<\/script>/)[1];
const decks=Object.fromEntries(['easy','medium','difficult'].map(level=>[level,JSON.parse(fs.readFileSync(path.join(root,'data','collections',level+'.json'),'utf8'))]));
const key='woord-flits-study-v1';
async function launch(storage={},failure=false,malformed=false){
 const nodes={};let reloads=0;
 function node(){return {children:[],style:{},attributes:{},hidden:false,disabled:false,value:'',textContent:'',append(...items){this.children.push(...items)},replaceChildren(){this.children=[]},setAttribute(k,v){this.attributes[k]=v},focus(){this.focused=true}};}
 for(const match of html.matchAll(/id="([^"]+)"/g))nodes[match[1]]=node();
 const context={document:{getElementById:id=>nodes[id],createElement:node},window:{location:{reload(){reloads++}}},localStorage:{getItem:k=>storage[k]??null,setItem(k,v){storage[k]=v}},fetch:async url=>{assert(/^data\/collections\/(easy|medium|difficult)\.json$/.test(url));const level=url.match(/\/([^/]+)\.json$/)[1];return {ok:!failure,json:async()=>malformed?{level,words:[{nl:'x',en:[]}]}:decks[level]};}};
 await vm.runInNewContext(code,context);
 return {nodes,storage,get reloads(){return reloads},get state(){return JSON.parse(storage[key])}};
}
(async()=>{
 const old={'woord-flits-history-v1':'existing error counts','woord-flits-daily-v1':'existing daily records','woord-flits-days-v1':'existing days','woord-flits-config-v4':'existing timed session'};
 const storage={...old};let app=await launch(storage),n=app.nodes;
 assert.equal(n['study-loading'].hidden,true);assert.equal(n['study-setup'].hidden,false);assert.equal(n['study-batch'].children.length,9);
 assert(html.includes('<a href="cartas.html" aria-current="page">Virar cartas</a>'));
 assert(fs.readFileSync(path.join(root,'index.html'),'utf8').includes('<a href="cartas.html">Virar cartas</a>'));
 for(const [level,data] of Object.entries(decks)){
  for(let batch=0;batch<Math.ceil(data.words.length/60);batch++){
   n['study-level'].value=level;n['study-level'].onchange();n['study-batch'].value=String(batch);n['study-batch'].onchange();
   assert.equal(n['study-batch'].children.length,Math.ceil(data.words.length/60));
   n['study-start'].onclick();assert.equal(n['study-game'].hidden,false);assert.equal(n['study-setup'].hidden,true);
   const cards=n['study-cards'].children,expected=data.words.slice(batch*60,batch*60+60);assert.equal(cards.length,expected.length);
   expected.forEach((w,i)=>{
    const faces=cards[i].children[0].children;assert.equal(faces[0].children[1].textContent,w.sourceTerm||w.nl);assert.equal(faces[1].children[1].textContent,w.en.filter(v=>!w.en.includes('to '+v)).join(' / '));
    assert.equal(cards[i].type,'button');assert.equal(cards[i].attributes['aria-pressed'],'false');assert.equal(faces[1].attributes['aria-hidden'],'true');
    cards[i].onclick();assert.equal(cards[i].attributes['aria-pressed'],'true');assert.equal(faces[0].attributes['aria-hidden'],'true');assert.equal(app.state.seen.length,i+1);
   });
   assert.equal(n['study-complete'].hidden,false);assert.equal(app.state.batchIndex,batch);assert.equal(app.state.level,level);assert.equal(app.state.active,true);
   cards[0].onclick();assert.equal(cards[0].attributes['aria-pressed'],'false');assert.equal(app.state.seen.length,expected.length);
   // Reopening restores the exact batch and card faces, including short final batches.
   app=await launch(storage);n=app.nodes;assert.equal(n['study-cards'].children.length,expected.length);assert.equal(n['study-cards'].children[0].attributes['aria-pressed'],'false');if(expected.length>1)assert.equal(n['study-cards'].children[1].attributes['aria-pressed'],'true');
   // Even an unexpected change event cannot change an active game's level or batch.
   n['study-level'].value=level==='easy'?'medium':'easy';n['study-level'].onchange();n['study-batch'].value='0';n['study-batch'].onchange();assert.equal(app.state.level,level);assert.equal(app.state.batchIndex,batch);
   n['study-new'].onclick();assert.equal(app.state.active,false);assert.equal(n['study-setup'].hidden,false);assert.equal(n['study-game'].hidden,true);assert.equal(app.state.batchIndex,(batch+1)%Math.ceil(data.words.length/60));assert.deepEqual(app.state.seen,[]);
  }
 }
 for(const [k,v] of Object.entries(old))assert.equal(storage[k],v);
 for(const saved of ['broken JSON',JSON.stringify({active:true,level:'__proto__',batchIndex:0,flipped:[],seen:[]}),JSON.stringify({active:true,level:'easy',batchIndex:99,flipped:[],seen:[]}),JSON.stringify({active:true,level:'difficult',batchIndex:6,flipped:[59],seen:[59]})]){const bad=await launch({[key]:saved});assert.equal(bad.nodes['study-setup'].hidden,false);assert.equal(bad.nodes['study-level'].value,'easy');}
 for(const options of [[true,false],[false,true]]){const failed=await launch({...old},...options);assert.equal(failed.nodes['study-error'].hidden,false);assert.equal(failed.nodes['study-loading'].hidden,true);failed.nodes['study-reload'].onclick();assert.equal(failed.reloads,1);for(const [k,v] of Object.entries(old))assert.equal(failed.storage[k],v);}
 console.log('PASS: all 21 batches match source/PDF order; 60-card cap and partial batches; flip both ways; fixed batch after completion; new-game selection; reload/resume; invalid saved state and loading failures; existing history untouched; top navigation.');
})().catch(error=>{console.error(error);process.exitCode=1});
