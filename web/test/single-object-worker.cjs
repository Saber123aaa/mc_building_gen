// Run the actual worker message handler with the real generator, without a GPU.
const assert=require('assert'),fs=require('fs'),path=require('path'),vm=require('vm'),M=require('../mcgen.js');M.initData(require('../mcgen_data.json'));
const src=fs.readFileSync(path.resolve(__dirname,'../../viewer/template.html'),'utf8'),worker=src.slice(src.indexOf('function genWorkerMain()'),src.indexOf('const GW ='));
const clone=x=>JSON.parse(JSON.stringify(x));
function fixture(tree=false){const S=new M.Structure();for(let x=0;x<48;x++)for(let z=0;z<32;z++)S.set(x,0,z,'minecraft:grass_block[snowy=false]');S.box=[[0,0,0],[47,15,31]];if(tree){S.set(8,1,8,'minecraft:oak_log[axis=y]');S.set(8,2,8,'minecraft:oak_leaves[persistent=false,distance=1,waterlogged=false]');}const items=[{id:1,type:'struct',manual:true,cx:8,cz:8,q:0,data:[['0,0,0','minecraft:stone'],['0,1,0','minecraft:gold_block']]},{id:2,type:'struct',manual:true,cx:32,cz:8,q:0,data:[['0,0,0','minecraft:stone'],['0,1,0','minecraft:diamond_block']]}];return{S,items};}
function handler(f,initialize=true,green=null){let last,id=0;const self={MCGen:M,postMessage:r=>{last=r;}};vm.runInNewContext(worker+'\ngenWorkerMain();',{self});const call=(fn,args)=>{self.onmessage({data:{id:++id,fn,args,gver:'1.21.5'}});assert(last.ok,last.err);return last.res;};call('townEmpty',{base:f.S.toModel(),budget:{cut:3,fill:3},ver:1,green});if(initialize)call('townCompose',{items:clone(f.items),nextId:3,guards:[],ver:1});return call;}
function expected(f,items,clear=false){const scene=M.emptyScene(new M.Terrain(f.S)),c=M.composeTown({...scene,items:clone(items)});if(clear){const tiles={'0,0':new Uint8Array(256)};tiles['0,0'][8+8*16]=255;const g=M.greenOverlay(c.T,[{id:1,clear:true,visible:true,tiles}],null,null);return M.greenWith(c.T.S,g.ov,()=>c.T.S.toModel());}return c.T.S.toModel();}
function equal(a,b){assert(a);assert.deepStrictEqual([a.W,a.H,a.L],[b.W,b.H,b.L]);for(let i=0;i<a.data.length;i++)assert.strictEqual(a.palette[a.data[i]],b.palette[b.data[i]],'block '+i);}
let cases=0;
for(const initialize of [true,false])for(const moving of [1,2]){
 const f=fixture(),call=handler(f,initialize),items=clone(f.items),it=items.find(i=>i.id===moving);it.cx=moving===1?32:8;it.level=null;
 const r=call('townRetouch',{items,nextId:3,ids:[moving],fallback:clone(f.items),guards:[moving],curH:16,ver:1,rebuildAfter:true});assert.strictEqual(r.reverted,true);equal(r.model,expected(f,f.items));cases++;
}
for(const clear of [false,true]){
 const f=fixture(true);let green=null;if(clear){const tiles={'0,0':new Uint8Array(256)};tiles['0,0'][8+8*16]=255;green={layers:[{id:1,clear:true,visible:true,tiles}]};}
 const call=handler(f,true,green),items=clone(f.items);items[0].cx=24;items[0].level=null;
 const r=call('townRetouch',{items,nextId:3,ids:[1],fallback:clone(f.items),guards:[1],curH:16,ver:1,rebuildAfter:true});assert.strictEqual(r.reverted,false);equal(r.model,expected(f,items,clear));
 const undo=call('townCompose',{items:clone(f.items),nextId:3,guards:[],ver:1});equal(undo.model,expected(f,f.items,clear));const redo=call('townCompose',{items,nextId:3,guards:[],ver:1});equal(redo.model,r.model);cases++;
}
// Calls without the optional flag retain the existing incremental response path.
{
 const f=fixture(),call=handler(f),items=clone(f.items);items[0].cx=12;
 const r=call('townRetouch',{items,nextId:3,ids:[1],fallback:clone(f.items),guards:[1],curH:16,ver:1});assert(r.sub);assert(!r.model);cases++;
}
console.log(JSON.stringify({workerCases:cases,collisionBothObjectOrders:true,missingStateInitialization:true,treeRestorationAndExplicitClear:true,canonicalUndoRedo:true,defaultIncrementalPathUnchanged:true}));
