const M=require('../mcgen.js'),assert=require('assert');
const S=new M.Structure();for(let x=0;x<256;x++)for(let z=0;z<256;z++)S.set(x,0,z,'minecraft:grass_block[snowy=false]');
const scene=M.emptyScene(new M.Terrain(S)),it={id:1,type:'cathedral',style:'baroque',cx:128,cz:128,q:0,manual:true,seed:1};scene.items.push(it);
const a=M.composeTown(scene);assert.strictEqual(a.check.total,0);assert.deepStrictEqual(a.clashes,[]);const before=a.boxes.get(1).map(p=>p.slice());
it.extra_bays=1;const b=M.retouchTown(a.state,scene,[1]);assert.strictEqual(b.check.total,0);assert.deepStrictEqual(b.clashes,[]);const after=b.boxes.get(1);assert.strictEqual(after[1][0]-after[0][0],before[1][0]-before[0][0]+14);
it.q=1;const c=M.retouchTown(a.state,scene,[1]);assert.strictEqual(c.check.total,0);assert.deepStrictEqual(c.clashes,[]);
console.log('Large Baroque town placement, length edit and rotation passed.');
