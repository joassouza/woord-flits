const fs=require('fs'),vm=require('vm'),assert=require('assert');const html=fs.readFileSync(require('path').join(__dirname,'..','index.html'),'utf8'),code=html.match(/<script>([\s\S]*)<\/script>/)[1];const storage={};let exportedBlob;
function launch(hash=""){let nodes={},now=0,next,state;function node(){return {value:'',style:{},children:[],events:{},hidden:false,disabled:false,checked:false,attributes:{},setAttribute(k,v){this.attributes[k]=v},click(){},focus(){},append(...a){this.children.push(...a)},replaceChildren(){this.children=[]},addEventListener(k,f){this.events[k]=f},checkValidity(){return true},reportValidity(){return true}}}for(const m of html.matchAll(/id="([^"]+)"/g))nodes[m[1]]=node();nodes['dc-size'].value='20';nodes['dc-seconds'].value='5';nodes['dc-day-name'].value='Dia 2';nodes['dutch-cards'].querySelector=s=>nodes[s.slice(1)];const browserWindow={location:{hash},events:{},addEventListener(k,f){this.events[k]=f}};const context={window:browserWindow,document:{getElementById:id=>nodes[id],createElement:node},localStorage:{setItem(k,v){storage[k]=v;if(k==='woord-flits-config-v4')state=JSON.parse(v)},getItem(k){return storage[k]||null},removeItem(k){delete storage[k]}},performance:{now:()=>now},setInterval(){return 1},clearInterval(){},setTimeout:f=>(next=f,1),clearTimeout(){},Math,Date,Blob,URL:{createObjectURL(blob){exportedBlob=blob;return 'blob:test'},revokeObjectURL(){}}};vm.runInNewContext(code,context);return {nodes,browserWindow,get state(){return state},get next(){return next}}}



const app=launch(),n=app.nodes;
const historyBefore=storage['woord-flits-history-v1'],dailyBefore=storage['woord-flits-daily-v1'];
n['dc-open-library'].onclick();assert(n['dc-main'].hidden);assert.equal(n['dc-library'].hidden,false);assert.equal(n['dc-library-words'].children[0].children[1].children.length,50);
const source=JSON.parse(storage['woord-flits-days-v1']).days;
for(const day of source){n['dc-library-day'].value=day.id;n['dc-library-day'].events.change();const cards=n['dc-library-words'].children[0].children[1].children;assert.equal(cards.length,day.words.length);day.words.forEach((w,i)=>{assert.equal(cards[i].children[1].textContent,w.sourceTerm||w.nl);assert.equal(cards[i].children[2].children[1].textContent,w.en.join(' / '));assert.equal(cards[i].children[2].children[3].textContent,w.pt.join(' / '));});}
n['dc-errors-only'].checked=true;n['dc-errors-only'].events.change();n['dc-library-day'].value='all';n['dc-library-day'].events.change();assert.equal(n['dc-library-words'].children.length,source.length);assert.equal(n['dc-library-words'].children.reduce((sum,s)=>sum+s.children[1].children.length,0),source.reduce((sum,d)=>sum+d.words.length,0));
assert.equal(storage['woord-flits-history-v1'],historyBefore);assert.equal(storage['woord-flits-daily-v1'],dailyBefore);
n['dc-close-library'].onclick();assert.equal(n['dc-main'].hidden,false);assert(n['dc-library'].hidden);
n['dc-day-name'].value='Meu dia';n['dc-day-words'].value='<b>teste</b> = example';n['dc-day-form'].onsubmit({preventDefault(){}});assert.equal(n['dc-library-day'].children.length,source.length+2);n['dc-open-library'].onclick();const custom=n['dc-library-words'].children[0].children[1].children[0];assert.equal(custom.children[1].textContent,'<b>teste</b>');assert.equal(custom.children[2].children[3].textContent,'Tradução não cadastrada');
console.log('OK: todos os registros por dia com EN/PT, todos os dias juntos, consulta independente do filtro de erros, histórico intacto, dia personalizado e texto seguro.');

for(const key of Object.keys(storage))delete storage[key];
const linked=launch('#palavras'),ln=linked.nodes;assert(ln['dc-main'].hidden);assert.equal(ln['dc-open-library'].attributes['aria-current'],'page');ln['dc-training-link'].onclick();assert.equal(linked.browserWindow.location.hash,'treino');assert.equal(ln['dc-main'].hidden,false);
ln['dc-start'].onclick();assert.equal(ln['dc-play'].hidden,false);ln['dc-open-library'].onclick();assert(ln['dc-main'].hidden);assert.equal(ln['dc-resume-panel'].hidden,false);assert.equal(linked.state.answers.length,0);
linked.browserWindow.location.hash='#treino';linked.browserWindow.events.hashchange();assert.equal(ln['dc-main'].hidden,false);assert.equal(ln['dc-training-link'].attributes['aria-current'],'page');ln['dc-resume'].onclick();assert.equal(ln['dc-play'].hidden,false);assert.equal(linked.state.answers.length,0);
assert(html.includes('<nav class="page-nav" aria-label="Navegação principal">'));assert(html.includes('href="#palavras" id="dc-open-library"'));assert(!html.includes('class="btn library-open"'));
console.log('OK: links no topo, abertura direta por hash, voltar/avançar e pausa de rodada com retomada sem respostas perdidas.');

const dayDirectory=require('path').join(__dirname,'..','data','days');
for(const file of fs.readdirSync(dayDirectory).filter(f=>f.endsWith('.json'))){const day=JSON.parse(fs.readFileSync(require('path').join(dayDirectory,file),'utf8'));assert.deepEqual(source.find(d=>d.id===day.id),day);}
const newest=source.filter(d=>d.kind!=='collection').at(-1);assert.equal(newest.id,'day-2026-11-05');assert.equal(newest.words.length,50);assert.equal(new Set(newest.words.map(w=>w.nl)).size,50);
for(const key of Object.keys(storage))delete storage[key];
storage['woord-flits-days-v1']=JSON.stringify({days:source.filter(d=>d.id!==newest.id),selectedDays:[source[0].id]});
storage['woord-flits-history-v1']=JSON.stringify({entries:{'en:huis':{word:{nl:'huis',en:['house']},wrong:4,correct:1}},importedLastRound:true});
for(const mode of ['en','nl','pt','nl-pt']){const game=launch(),gn=game.nodes;assert.equal(JSON.parse(storage['woord-flits-history-v1']).entries['en:huis'].wrong,4);assert.deepEqual(JSON.parse(storage['woord-flits-days-v1']).selectedDays,[newest.id]);gn['dc-errors-only'].checked=false;gn['dc-direction'].value=mode;gn['dc-size'].value='50';gn['dc-start'].onclick();assert.equal(game.state.batch.length,50);for(let i=0;i<50;i++){const w=game.state.batch[i];gn['dc-answer'].value=mode==='en'?w.en[0]:mode==='pt'?w.pt[0]:w.nl;gn['dc-form'].onsubmit({preventDefault(){}});assert(game.state.answers.at(-1).ok,mode+':'+w.nl);game.next();}}
console.log('OK: JSONs iguais ao vocabulário do app; novo dia de 50 palavras, migração preserva erros e 50 respostas corretas nos quatro sentidos.');


const collections=source.filter(d=>d.kind==='collection');
assert.deepEqual(collections.map(d=>d.words.length),[493,255,364]);
for(const collection of collections){
 const saved=JSON.parse(fs.readFileSync(require('path').join(__dirname,'..','data','collections',collection.level+'.json'),'utf8'));
 assert.deepEqual(collection,saved);
 collection.words.forEach((w,i)=>{assert.equal(w.sourceIndex,i+1);assert(w.sourceTerm);assert(w.en.length&&w.pt.length);});
 for(const mode of ['en','nl','pt','nl-pt']){
  for(const key of Object.keys(storage))delete storage[key];
  storage['woord-flits-days-v1']=JSON.stringify({days:source,selectedDays:[collection.id]});
  const game=launch(),gn=game.nodes;gn['dc-direction'].value=mode;gn['dc-size'].value=collection.words.length;gn['dc-start'].onclick();
  assert.equal(game.state.batch.length,new Set(collection.words.map(w=>w.nl.toLowerCase())).size);
  for(const w of game.state.batch)assert(w.en.length&&w.pt.length);
  const w=game.state.batch[0];gn['dc-answer'].value=mode==='en'?w.en[0]:mode==='pt'?w.pt[0]:(w.nlAliases?.[0]||w.nl);gn['dc-form'].onsubmit({preventDefault(){}});assert(game.state.answers[0].ok,collection.level+':'+mode);
 }
}
// Installing the archive must not select 1,112 new cards or create study results.
for(const key of Object.keys(storage))delete storage[key];
storage['woord-flits-days-v1']=JSON.stringify({days:source.filter(d=>d.kind!=='collection'),selectedDays:[newest.id]});
storage['woord-flits-history-v1']=JSON.stringify({entries:{'en:huis':{word:{nl:'huis',en:['house']},wrong:7,correct:2}},importedLastRound:true});
const archive=launch();assert.deepEqual(JSON.parse(storage['woord-flits-days-v1']).selectedDays,[newest.id]);assert.equal(archive.nodes['dc-day-name'].value,'Dia 7');assert.equal(JSON.parse(storage['woord-flits-history-v1']).entries['en:huis'].wrong,7);assert.equal(storage['woord-flits-daily-v1'],undefined);
for(const key of Object.keys(storage))delete storage[key];
const aliases=collections.flatMap(d=>d.words).filter(w=>w.nlAliases?.length);
for(const w of aliases)for(const alias of w.nlAliases){
 storage['woord-flits-days-v1']=JSON.stringify({days:[...source,{id:'alias-test',name:'Alias test',words:[w]}],selectedDays:['alias-test']});
 const game=launch(),gn=game.nodes;gn['dc-direction'].value='nl-pt';gn['dc-size'].value=1;gn['dc-start'].onclick();gn['dc-answer'].value=alias;gn['dc-form'].onsubmit({preventDefault(){}});assert(game.state.answers[0].ok,w.nl+':'+alias);
}
assert(collections.find(d=>d.level==='difficult').words.some(w=>w.nl==='kleren'&&w.pt.includes('roupas')));
console.log('OK: all 1,112 source cards match collection JSON; no training duplicates; four directions; Dutch alternatives accepted; saved selection, error history and study dates preserved.');

// Batch choices restrict the pool before shuffling and survive reload/JSON backup.
for(const collection of collections)for(let batch=0;batch<Math.ceil(collection.words.length/60);batch++){
 for(const key of Object.keys(storage))delete storage[key];
 storage['woord-flits-days-v1']=JSON.stringify({days:source,selectedDays:[collection.id]});
 let game=launch(),gn=game.nodes;
 const group=gn['dc-days'].children.find(row=>row.children[1]?.attributes?.['aria-label']==='Lote de '+collection.level);
 assert(group,'Batch selector for '+collection.level);
 const choice=group.children[1];choice.value=String(batch);choice.events.change();
 const expected=new Set(collection.words.slice(batch*60,batch*60+60).map(w=>w.nl.toLowerCase()));assert.equal(gn['dc-word-total'].textContent,expected.size);
 game=launch();gn=game.nodes;gn['dc-size'].value=1000;gn['dc-start'].onclick();assert.deepEqual(new Set(game.state.batch.map(w=>w.nl.toLowerCase())),expected);assert.equal(game.state.queue.length,0);
 gn['dc-new'].onclick();gn['dc-export'].onclick();
}
console.log('OK: all 21 source batches can be selected in training; pool limited before shuffle; saved batch survives reload.');

(async()=>{
 const saved=JSON.parse(await exportedBlob.text());assert.equal(saved.collectionBatches['course-difficult'],6);
 for(const key of Object.keys(storage))delete storage[key];const restored=launch(),json=JSON.stringify(saved);restored.nodes['dc-import'].files=[{size:json.length,text:async()=>json}];await restored.nodes['dc-import'].onchange();assert.equal(restored.nodes['dc-word-total'].textContent,4);restored.nodes['dc-size'].value=60;restored.nodes['dc-start'].onclick();assert.deepEqual(new Set(restored.state.batch.map(w=>w.nl)),new Set(['aantrekkelijk','opvoeding','tegenstander','verantwoordelijkheid']));
 console.log('OK: batch selection also survives JSON export/import, including the final short batch.');
})().catch(error=>{console.error(error);process.exitCode=1});
