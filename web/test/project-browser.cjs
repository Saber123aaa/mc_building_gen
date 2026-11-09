// PLAYWRIGHT_MODULE may point at an existing Playwright installation.
const assert=require('assert'),fs=require('fs'),path=require('path'),{pathToFileURL}=require('url');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const output=path.resolve(process.env.REGRESSION_OUT||'out/project-regression');fs.mkdirSync(output,{recursive:true});
const results=[], errors=[];
const save=()=>fs.writeFileSync(output+'/browser-results.json',JSON.stringify({results,errors},null,2));
const source=pathToFileURL(path.resolve('viewer/index.html')).href;
(async()=>{
 const browser=await chromium.launch({...(process.env.BROWSER_EXE?{executablePath:process.env.BROWSER_EXE}:{}),headless:true});
 try {
  const page=await browser.newPage({viewport:{width:1450,height:980},acceptDownloads:true});
  page.on('pageerror',e=>errors.push(e.message));
  async function fresh(worker){await page.goto(source);await page.waitForFunction(()=>window.MCGen&&typeof ensureTown==='function'&&model);await page.evaluate(worker=>{if(!worker)Object.defineProperty(GW,'ok',{get:()=>false});window.__pending=0;const call=GW.call.bind(GW);GW.call=(...a)=>{window.__pending++;return call(...a).finally(()=>window.__pending--);};setMode('layout');$('g_tsynth').value='gentle';$('g_tsynth').dispatchEvent(new Event('change',{bubbles:true}));},worker);}
  async function wait(text){await page.waitForFunction(text=>TOWN&&model===TOWN.model&&TOWN_GEN_PENDING===0&&window.__pending===0&&$('t_status').textContent.includes(text),text,{timeout:90000});}
  async function sig(){return page.evaluate(async()=>{const ids=new Set(model.data),sorted=[...ids].map(id=>model.palette[id]).sort(), remap=model.palette.map(st=>sorted.indexOf(st)), canonical=Uint32Array.from(model.data,id=>remap[id]);const h=await crypto.subtle.digest('SHA-256',canonical.buffer);return {size:[model.W,model.H,model.L],palette:sorted,hash:Array.from(new Uint8Array(h),v=>v.toString(16).padStart(2,'0')).join(''),items:TOWN.scene.items,roads:picks.roads,zones:picks.zones,geo:model.geo||null};});}
  async function roundTrip(name,legacy=false){
   const before=await sig(), filename=path.join(output,name+'.json');
   if(legacy){const project=await page.evaluate(()=>projectJSON());delete project.layoutMode;fs.writeFileSync(filename,JSON.stringify(project));}
   else {const event=page.waitForEvent('download');await page.locator('#proj_save').click();await (await event).saveAs(filename);}
   await page.locator('#proj_file').setInputFiles(filename);await wait('已打开工程 '+path.basename(filename));
   const after=await sig();assert.deepStrictEqual(after,before,name+' model/items/roads/zones/offset changed');
   // Check actual export data after restoring, rather than only the visible model.
   const exported=await page.evaluate(()=>{const m=decodeModel(parseNBT(encodeSchem(model).buffer));let mismatch=0;for(let i=0;i<m.data.length;i++)if(m.palette[m.data[i]]!==MCGen.verState(model.palette[model.data[i]],GVER))mismatch++;return{size:[m.W,m.H,m.L],mismatch};});
   assert.strictEqual(exported.mismatch,0,name+' export mismatch');assert.deepStrictEqual(exported.size,before.size);
   results.push({name,legacy,layoutMode:await page.evaluate(()=>TOWN.layoutMode),items:after.items.length,exported});save();console.log('PASS',name);
  }
  for(const worker of [true,false]) {
   const suffix=worker?'worker':'sync';
   for(const kind of (process.env.PROJECT_FOCUSED ? ['radial-green'] : ['manual-empty','manual-house','manual-imported','automatic','automatic-region','automatic-empty','radial-green'])) {
    await fresh(worker);
    if(kind.startsWith('manual')) {
     await page.evaluate(kind=>{if(kind==='manual-imported'){const data=new Uint32Array(80*30*72);for(let z=0;z<72;z++)for(let x=0;x<80;x++)data[x+z*80]=1;const m={W:80,H:30,L:72,palette:['minecraft:air','minecraft:grass_block[snowy=false]'],data,geo:{offset:[-12,3,7],we:[2,-1,4]},tname:'imported fixture'};TER.list.push(m);TER.src='import';document.querySelector('input[name="tsrc"][value="import"]').checked=true;selectImported(TER.list.length-1);}ensureTown();if(kind!=='manual-empty'){TOWN.scene.items.push({id:1,type:'house',manual:true,cx:56,cz:36,q:0,spec:{palette:'oak_cottage',width:9,depth:7,floors:1,floor_height:4,seed:3,annexes:[],ground:false}});TOWN.scene.nextId=2;}recompose('fixture ready');},kind);await wait('fixture ready');
    } else if(kind==='radial-green') {
     await page.evaluate(()=>{const m=baseModel();runDistrict({kind:'district',id:1,x0:5,z0:5,x1:m.W-6,z1:m.L-6,style:'radial',density:'sparse',landmark:'plaza',house:'small',seed:17,green:{swatch:'meadow',recipe:MCGen.greenRecipe(MCGen.GREEN_SWATCHES.meadow.recipe)}});});
     await wait('完成');
    } else {
     await page.evaluate(kind=>{if(kind==='automatic-region'){picks.region=[[5,0,5],[106,0,66]];$('t_useregion').checked=true;}runTown();},kind);await wait('完成');
     if(kind==='automatic-empty') {await page.evaluate(()=>{TOWN.suppress=[...TOWN.boxes.values()].map(b=>[b[0][0],b[0][2],b[1][0],b[1][2]]);TOWN.scene.items=[];recompose('empty automatic fixture');});await wait('empty automatic fixture');assert.strictEqual(await page.evaluate(()=>TOWN.scene.items.length),0);}
    }
    await roundTrip(kind+'-'+suffix);
    await roundTrip(kind+'-'+suffix+'-legacy',true);
   }
   // Reopen the same project and then exercise edit, undo, redo and collision rollback.
   const well=await page.evaluate(()=>TOWN.scene.items.find(it=>it.type==='well'));
   assert(well);await page.evaluate(id=>{SEL={kind:'town',id};renderSel();moveSel(1,0);},well.id);await wait('移动了');
   assert.strictEqual(await page.evaluate(id=>TOWN.scene.items.find(it=>it.id===id).x,well.id),well.x+1);
   const afterMove=await sig();await page.evaluate(()=>undoHist());await wait('撤销');
   assert.strictEqual(await page.evaluate(id=>TOWN.scene.items.find(it=>it.id===id).x,well.id),well.x);
   await page.evaluate(()=>redoHist());await wait('撤销');assert.deepStrictEqual(await sig(),afterMove,'well redo');
   await roundTrip('plaza-moved-'+suffix);
   // Move to a road cell outside the plaza: collision guard must revert the model.
   const target=await page.evaluate(()=>{const rd=picks.roads[0];return rd.pts[0];});
   await page.evaluate(({id,target})=>{SEL={kind:'town',id};const it=selItem();moveSel(target[0]-it.x,target[2]-it.z);},{id:well.id,target});await wait('已取消这次操作');
   assert.deepStrictEqual(await sig(),afterMove,'road collision rollback');
   // The full recompose and incremental paths must produce identical models.
   await page.evaluate(()=>recompose('full rebuild'));await wait('full rebuild');assert.deepStrictEqual(await sig(),afterMove,'full rebuild');
   await page.screenshot({path:output+'/plaza-'+suffix+'.png'});
   const download=page.waitForEvent('download');await page.locator('#exp').click();const schematic=output+'/plaza-'+suffix+'.schem';await(await download).saveAs(schematic);
   const bytes=require('zlib').gunzipSync(fs.readFileSync(schematic));
   assert.strictEqual(await page.evaluate(b64=>{const m=decodeModel(parseNBT(b64ToBuf(b64)));let mismatch=0;for(let i=0;i<m.data.length;i++)if(m.palette[m.data[i]]!==model.palette[model.data[i]])mismatch++;return mismatch;},bytes.toString('base64')),0,'downloaded schematic');
   results.push({name:'plaza-edit-undo-redo-collision-full-'+suffix,passed:true});save();
  }
  assert.deepStrictEqual(errors,[],'page errors');save();console.log('DONE browser',results.length);
 } finally {await browser.close();}
})().catch(e=>{errors.push(e.stack);save();console.error(e);process.exitCode=1;});
