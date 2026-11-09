// Exercise the actual viewer commands with the real generator, without a DOM/GPU.
const assert=require('assert'),fs=require('fs'),vm=require('vm'),path=require('path'),M=require('../mcgen.js');
M.initData(require('../mcgen_data.json'));
const src=fs.readFileSync(path.resolve(__dirname,'../../viewer/template.html'),'utf8');
const section=(from,to)=>src.slice(src.indexOf(from),src.indexOf(to,src.indexOf(from)));
const commands=section('function townCommand(', 'function moveSel(')+section('function deleteSel()','// copies land')+section('function snapshot()','// 道路编辑的撤销')+section('function pushHist()','// ---- layout roads:');
const equal=(a,b,label)=>{assert.strictEqual(a.size,b.size,label);for(const[k,v]of a)assert.strictEqual(b.get(k),v,label+' '+k);};
function setup(scene,layers=[]){
 const ctx={JSON,Map,Set,HIST:[],REDO:[],SEL:null,TOWN_GEN_PENDING:0,TYPE_CN:{struct:'结构',tree:'树',house:'房屋'},calls:{full:0,local:0},curMode:()=> 'layout',townActive:()=>true,renderSel:()=>{},tStatus:()=>{}};
 const rebuild=()=>{const c=M.composeTown(ctx.TOWN.scene);ctx.TOWN.cstate=c.state;ctx.TOWN.boxes=c.boxes;ctx.TOWN.model=new Map(c.T.S.blocks);const g=M.greenOverlay(c.T,layers,null,null);M.greenWith(c.T.S,g.ov,()=>{ctx.TOWN.visible=new Map(c.T.S.blocks);});};
 ctx.TOWN={scene,suppress:[]};ctx.selItems=()=>ctx.TOWN.scene.items.filter(it=>(ctx.SEL?.ids||[ctx.SEL?.id]).includes(it.id));ctx.selItem=()=>ctx.TOWN.scene.items.find(it=>it.id===ctx.SEL?.id);
 ctx.recompose=()=>{ctx.calls.full++;rebuild();};ctx.retouch=ids=>{ctx.calls.local++;const r=M.retouchTown(ctx.TOWN.cstate,ctx.TOWN.scene,ids);ctx.TOWN.boxes=r.boxes;ctx.TOWN.model=new Map(r.T.S.blocks);};
 rebuild();vm.createContext(ctx);vm.runInContext(commands,ctx);return ctx;
}
const select=(c,ids)=>{c.SEL={kind:'town',id:ids.at(-1),ids};};
function manual(tree=false){const S=new M.Structure();for(let x=0;x<32;x++)for(let z=0;z<24;z++)S.set(x,0,z,'minecraft:grass_block[snowy=false]');S.box=[[0,0,0],[31,12,23]];if(tree){S.set(8,1,8,'minecraft:oak_log[axis=y]');S.set(8,2,8,'minecraft:oak_leaves[persistent=false,distance=1,waterlogged=false]');}const s=M.emptyScene(new M.Terrain(S),{cut:8,fill:8});s.items=[{id:1,type:'struct',manual:true,cx:8,cz:8,q:0,lift:0,data:[['0,0,0','minecraft:stone'],['0,1,0','minecraft:gold_block']]},{id:2,type:'struct',manual:true,cx:16,cz:8,q:0,lift:2,data:[['0,0,0','minecraft:stone'],['0,1,0','minecraft:diamond_block']]}];s.nextId=3;return s;}
(async()=>{let cases=0;
for(const trees of [false,true]){
 const T=new M.Terrain(M.synthTerrain({W:112,L:72,amp:6,seed:11,trees:trees?.008:0})),scene=M.town(T,{seed:7,square:true,palette:'auto',budget:{cut:3,fill:3},slant:true}).scene,c=setup(scene);
 const before=new Map(c.TOWN.model),items=JSON.stringify(scene.items);select(c,scene.items.map(it=>it.id));await c.deleteSel();
 assert.strictEqual(scene.items.length,0);equal(c.TOWN.model,M.composeTown(scene).T.S.blocks,'empty generated town');assert.strictEqual(c.calls.full,1);assert.strictEqual(c.calls.local,0);
 await c.undoHist();assert.strictEqual(JSON.stringify(scene.items),items);equal(c.TOWN.model,before,'undo generated town');
 await c.redoHist();equal(c.TOWN.model,M.composeTown(scene).T.S.blocks,'redo generated town');assert.strictEqual(c.calls.full,3);cases++;
}
for(const clear of [false,true]){
 const layers=[];if(clear){const tiles={'0,0':new Uint8Array(256)};tiles['0,0'][8+8*16]=255;layers.push({id:1,clear:true,visible:true,seed:1,tiles});}
 const c=setup(manual(true),layers);select(c,[1,2]);await c.deleteSel();assert.strictEqual(c.TOWN.model.get('8,1,8'),'minecraft:oak_log[axis=y]','saved ground tree restored');assert.strictEqual(c.TOWN.visible.has('8,1,8'),!clear,'explicit clearing overlay respected');assert(![...c.TOWN.model.values()].includes('minecraft:gold_block'),'building removed at former tree');cases++;
}
// Unselected placed trees and structures keep their complete parameter objects.
{
 const scene=manual(true);scene.items.push({id:3,type:'tree',species:'birch',size:'s',seed:9,x:26,z:16,q:0,manual:true});scene.nextId=4;
 const c=setup(scene),keep=JSON.stringify(scene.items[2]);select(c,[1,2]);await c.deleteSel();assert.strictEqual(JSON.stringify(scene.items[0]),keep);equal(c.TOWN.model,M.composeTown(scene).T.S.blocks,'surviving placed tree');cases++;
}
// Single deletion now follows the same canonical ground/tree/history rule.
{
 const c=setup(manual(false));select(c,[2]);await c.deleteSel();assert.strictEqual(c.calls.full,1);assert.strictEqual(c.calls.local,0);await c.undoHist();await c.redoHist();assert.strictEqual(c.calls.full,3);assert.strictEqual(c.calls.local,0);cases++;
}
// A later ordinary edit must not inherit the batch operation's history flag.
{
 const scene=manual(false);scene.items.push({id:3,type:'struct',manual:true,cx:26,cz:18,q:0,data:[['0,0,0','minecraft:stone'],['0,1,0','minecraft:iron_block']]});scene.nextId=4;
 const c=setup(scene);select(c,[1,2]);await c.deleteSel();c.pushHist();scene.items[0].cx++;c.retouch([3]);const moved=new Map(c.TOWN.model);
 await c.undoHist();await c.undoHist();assert.strictEqual(scene.items.length,3);await c.redoHist();await c.redoHist();equal(c.TOWN.model,moved,'mixed batch and ordinary edit history');assert.strictEqual(c.calls.full,3);assert.strictEqual(c.calls.local,3);cases++;
}
// Pending town generation must not lose items or create a phantom undo entry.
{
 const c=setup(manual(true));c.TOWN_GEN_PENDING=1;select(c,[1,2]);await c.deleteSel();assert.strictEqual(c.TOWN.scene.items.length,2);assert.strictEqual(c.HIST.length,0);assert.strictEqual(c.calls.full+c.calls.local,0);cases++;
}
console.log(JSON.stringify({batchDeleteCommandCases:cases,naturalTreeRestoration:true,explicitTreeClearPreserved:true,unselectedItemsPreserved:true,batchUndoRedoFullRebuild:true,singleDeleteUsesFullRebuild:true,pendingGenerationGuard:true}));

})().catch(e=>{console.error(e);process.exitCode=1;});
