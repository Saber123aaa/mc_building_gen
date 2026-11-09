// Run after build_viewer.py. MCGEN_BASELINE optionally compares unchanged geometry.
const assert = require('assert'), path = require('path'), M = require('../mcgen.js');
M.initData(require('../mcgen_data.json'));
const B = process.env.MCGEN_BASELINE ? require(path.resolve(process.env.MCGEN_BASELINE, 'web/mcgen.js')) : null;
if (B) B.initData(require(path.resolve(process.env.MCGEN_BASELINE, 'web/mcgen_data.json')));
const equal = (a, b, label) => { assert.strictEqual(a.blocks.size, b.blocks.size, label); for (const [k,v] of a.blocks) assert.strictEqual(b.blocks.get(k),v,label+' '+k); };
const cases = Object.keys(M.CATHEDRAL_STYLES).map(style => ({style}));
for (const style of ['french','german','italian','spanish','english','romanesque'])
  for (const facade of ['detailed','single','screen','simple']) cases.push({style,facade,seed:31});
for (const spec of cases) {
  const a = M.cathedral(spec), again = M.cathedral(a.spec);
  equal(a.S, again.S, 'returned spec '+JSON.stringify(spec));
  if (B) equal(a.S, B.cathedral(spec).S, 'unchanged geometry '+JSON.stringify(spec));
}

const base = G => new G.Terrain(G.synthTerrain({W:112,L:72,base:12,amp:0,flat:true,seed:7,trees:0}));
function make(G, automatic) {
  return G.town(base(G), automatic ? {seed:17,square:true,palette:'medieval_timber',budget:{cut:3,fill:3}} : {
    roads:[{kind:'main',width:5,path:[[5,15],[105,15]]}],
    zones:[{kind:'plaza',x0:45,x1:65,z0:25,z1:45}],seed:17,palette:'medieval_timber',budget:{cut:3,fill:3}
  });
}
let plazaEdits = 0;
for (const automatic of [true,false]) {
  const r=make(M,automatic), scene=r.scene, well=scene.items.find(it=>it.type==='well');
  assert(well,'well fixture');
  if(B) equal(M.composeTown(scene).T.S, B.composeTown(make(B,automatic).scene).T.S, 'unchanged town');
  let c=M.composeTown(scene);
  assert(!c.clashes.includes(well.id),'well may stand on plaza');
  for(const patch of [{x:well.x+1},{q:1},{x:well.x-1,q:0}]) {
    Object.assign(well,patch);const edit=M.retouchTown(c.state,scene,[well.id]), full=M.composeTown(scene);
    assert(!edit.clashes.includes(well.id),'well may move/rotate on plaza');
    equal(edit.T.S, full.T.S,'incremental versus full');
    assert.strictEqual(edit.check.total,0);plazaEdits++;
  }
  // A second well at the same position remains a real collision, even on a plaza.
  const other={...well,id:scene.nextId++};scene.items.push(other);
  assert(M.composeTown(scene).clashes.includes(other.id),'well versus well collision');
  scene.items.pop();
  const house={id:scene.nextId++,type:'house',cx:well.x,cz:well.z,q:0,manual:true,spec:{palette:'oak_cottage',width:9,depth:7,floors:1,floor_height:4,seed:3,annexes:[],ground:false}};
  scene.items.push(house);
  const overlap=M.composeTown(scene);
  assert(overlap.clashes.includes(house.id),'house cannot occupy plaza');
  assert(overlap.clashes.includes(well.id),'well cannot intersect house on plaza');
}
const scene=make(M,false).scene, well=scene.items.find(it=>it.type==='well');
well.x=30;well.z=15;
assert(M.composeTown(scene).clashes.includes(well.id),'well cannot occupy street');
console.log(JSON.stringify({facadeCases:cases.length,baselineGeometryComparisons:B?cases.length+2:0,plazaEdits,protectedCollisions:7}));
