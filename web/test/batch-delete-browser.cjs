const fs=require('fs'),path=require('path'),assert=require('assert'),zlib=require('zlib'),{pathToFileURL}=require('url');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const out=path.resolve(process.env.REGRESSION_OUT||'out/batch-delete');fs.mkdirSync(out,{recursive:true});
const results=[],errors=[],save=()=>fs.writeFileSync(out+'/results.json',JSON.stringify({results,errors},null,2));
(async()=>{const browser=await chromium.launch({...(process.env.BROWSER_EXE?{executablePath:process.env.BROWSER_EXE}:{}),headless:true});try{
 const page=await browser.newPage({acceptDownloads:true});page.on('pageerror',e=>errors.push(e.message));
 const wait=async text=>page.waitForFunction(text=>TOWN&&model===TOWN.model&&TOWN_GEN_PENDING===0&&window.__pending===0&&$('t_status').textContent.includes(text),text,{timeout:90000});
 const snapshot=async()=>page.evaluate(async()=>{const used=[...new Set(model.data)].map(i=>model.palette[i]).sort(),remap=model.palette.map(s=>used.indexOf(s)),canonical=Uint32Array.from(model.data,i=>remap[i]),h=await crypto.subtle.digest('SHA-256',canonical.buffer),green=greenSave();if(green)for(const l of green.layers)if(l.clear)l.recipe=null;return{size:[model.W,model.H,model.L],palette:used,hash:[...new Uint8Array(h)].join(','),items:JSON.parse(JSON.stringify(TOWN.scene.items)),roads:JSON.stringify(picks.roads),zones:JSON.stringify(picks.zones),green:JSON.stringify(green),geo:model.geo||null};});
 for(const worker of [true,false])for(const kind of ['generated-all','generated-houses','region-all','manual-keep-tree','manual-delete-tree','manual-clear','radial-green']){
  await page.goto(pathToFileURL(path.resolve('viewer/index.html')).href);await page.waitForFunction(()=>window.MCGen&&typeof deleteSel==='function'&&model);
  await page.evaluate(({worker,kind})=>{
   if(!worker)Object.defineProperty(GW,'ok',{get:()=>false});window.__pending=0;window.__calls={full:0,local:0};const call=GW.call.bind(GW);GW.call=(...a)=>{window.__pending++;return call(...a).finally(()=>window.__pending--);};const full=recompose,local=retouch;recompose=(...a)=>{window.__calls.full++;return full(...a);};retouch=(...a)=>{window.__calls.local++;return local(...a);};
   setMode('layout');$('g_tsynth').value='gentle';$('g_tsynth').dispatchEvent(new Event('change',{bubbles:true}));
   if(kind.startsWith('manual')){
    const S=new MCGen.Structure();for(let x=0;x<40;x++)for(let z=0;z<32;z++)S.set(x,0,z,'minecraft:grass_block[snowy=false]');S.set(8,1,8,'minecraft:oak_log[axis=y]');S.set(8,2,8,'minecraft:oak_leaves[persistent=false,distance=1,waterlogged=false]');S.box=[[0,0,0],[39,12,31]];
    const m=S.toModel();m.geo={offset:[-8,0,3],we:[1,0,-2]};m.tname='tree policy fixture';TER.list.push(m);TER.src='import';document.querySelector('input[name="tsrc"][value="import"]').checked=true;selectImported(TER.list.length-1);
    if(kind==='manual-clear'){const tiles={'0,0':new Uint8Array(256)};tiles['0,0'][8+8*16]=255;picks.green={layers:[{id:1,name:'explicit clearing',clear:true,visible:true,seed:1,tiles}],active:1,nextId:2};}
    ensureTown();TOWN.scene.items=[{id:1,type:'struct',manual:true,cx:8,cz:8,q:0,data:[['0,0,0','minecraft:stone'],['0,1,0','minecraft:gold_block']]},{id:2,type:'struct',manual:true,cx:16,cz:8,q:0,lift:2,data:[['0,0,0','minecraft:stone'],['0,1,0','minecraft:diamond_block']]},{id:3,type:'tree',species:'birch',size:'s',seed:9,x:30,z:22,q:0,manual:true}];TOWN.scene.nextId=4;
    recompose('fixture ready');
   }else if(kind==='radial-green'){const m=baseModel();runDistrict({kind:'district',id:1,x0:5,z0:5,x1:m.W-6,z1:m.L-6,style:'radial',density:'sparse',landmark:'plaza',house:'small',seed:17,green:{swatch:'meadow',recipe:MCGen.greenRecipe(MCGen.GREEN_SWATCHES.meadow.recipe)}});}
   else{if(kind==='region-all'){picks.region=[[5,0,5],[106,0,66]];$('t_useregion').checked=true;}runTown();}
  },{worker,kind});await wait(kind.startsWith('manual')?'fixture ready':'完成');
  const before=await snapshot(),selection=await page.evaluate(kind=>{const its=TOWN.scene.items;return(kind==='generated-houses'?its.filter(i=>i.type==='house').slice(0,2):kind==='radial-green'?its.filter(i=>i.type==='house').slice(0,2):kind==='manual-delete-tree'?its.filter(i=>i.id===1||i.id===3):kind.startsWith('manual')?its.filter(i=>i.id===1||i.id===2):its).map(i=>i.id);},kind);
  assert(selection.length>1);const started=Date.now();await page.evaluate(ids=>{SEL={kind:'town',id:ids.at(-1),ids};deleteSel();},selection);await wait('删除了');const deleteMs=Date.now()-started,after=await snapshot();
  assert.deepStrictEqual(after.items,before.items.filter(i=>!selection.includes(i.id)),'unselected parameters');for(const key of ['roads','zones','green','geo'])assert.deepStrictEqual(after[key],before[key],'unchanged '+key);
  if(kind.startsWith('manual')){
   const groundTree=await page.evaluate(()=>model.palette[model.data[8+8*model.W+model.W*model.L]]);
   assert.strictEqual(groundTree,kind==='manual-clear'?'minecraft:air':'minecraft:oak_log[axis=y]');
   assert(!after.palette.includes('minecraft:gold_block'),'deleted structure remains');
   if(kind==='manual-delete-tree')assert(!after.palette.includes('minecraft:birch_log[axis=y]'),'selected planted tree remains');
  }
  await page.evaluate(()=>recompose('oracle rebuild'));await wait('oracle rebuild');assert.deepStrictEqual(await snapshot(),after,'deletion versus full rebuild');
  for(let n=0;n<2;n++){await page.evaluate(()=>undoHist());await wait('撤销');assert.deepStrictEqual(await snapshot(),before,'batch undo');await page.evaluate(()=>redoHist());await wait('撤销');assert.deepStrictEqual(await snapshot(),after,'batch redo');}
  const counters=await page.evaluate(()=>window.__calls);assert.strictEqual(counters.local,0,'batch history must not use incremental restore');
  const project=path.join(out,kind+'-'+worker+'.json'),d1=page.waitForEvent('download');await page.locator('#proj_save').click();await(await d1).saveAs(project);await page.locator('#proj_file').setInputFiles(project);await wait('已打开工程 '+path.basename(project));assert.deepStrictEqual(await snapshot(),after,'project reopen');
  const schematic=path.join(out,kind+'-'+worker+'.schem'),d2=page.waitForEvent('download');await page.locator('#exp').click();await(await d2).saveAs(schematic);const bytes=zlib.gunzipSync(fs.readFileSync(schematic));const mismatch=await page.evaluate(raw=>{const a=decodeModel(parseNBT(b64ToBuf(raw)));let n=0;for(let i=0;i<a.data.length;i++)if(a.palette[a.data[i]]!==model.palette[model.data[i]])n++;return n;},bytes.toString('base64'));assert.strictEqual(mismatch,0,'native export');
  results.push({worker,kind,deleted:selection.length,retained:after.items.length,deleteMs,canonicalModel:true,undoRedoCycles:2,projectRoundTrip:true,nativeExport:true,treePolicy:true,unselectedParametersPreserved:true});save();console.log('PASS',worker,kind,'deleted',selection.length,'ms',deleteMs);
 }
 assert.deepStrictEqual(errors,[]);save();console.log('DONE',results.length);
}finally{await browser.close();}})().catch(e=>{errors.push(e.stack);save();console.error(e);process.exitCode=1;});
