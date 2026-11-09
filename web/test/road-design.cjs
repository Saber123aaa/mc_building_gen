const assert=require('assert'),crypto=require('crypto'),M=require('../mcgen.js'),C=require('./road-design-cases.cjs');
const hash=S=>crypto.createHash('sha256').update([...S.blocks].sort().map(([k,v])=>k+'='+v).join('\n')).digest('hex');
function metrics(r){
  const {T,roadSet}=r,walk=new Map();let jumps=0,maxJump=0,blocked=0;
  for(const [key,y]of roadSet){const[x,,z]=key.split(',').map(Number),above=T.S.get(x,y+1,z),slab=above&&/_slab\[.*type=bottom/.test(above);
    if(!above||M.isAir(above)||slab)walk.set(x+','+z,2*(y+1)+(slab?1:0));else blocked++;
    for(const[a,b]of[[1,0],[0,1]]){const v=roadSet.get(M.key3(x+a,0,z+b));if(v!=null){maxJump=Math.max(maxJump,Math.abs(v-y));if(Math.abs(v-y)>1)jumps++;}}
  }
  const links=[];
  for(const road of r.roads){
    const endpoints=[road.cells[0],road.cells.at(-1)];if(!endpoints[0]){links.push(false);continue;}
    const nearest=([x,z])=>{let best=null,bd=Infinity;for(const k of walk.keys()){const[a,b]=k.split(',').map(Number),d=Math.hypot(x-a,z-b);if(d<bd){bd=d;best=k}}return best};
    const start=nearest(endpoints[0]),end=nearest(endpoints[1]),seen=new Set([start]),q=[start];
    for(let i=0;i<q.length;i++){const[x,z]=q[i].split(',').map(Number);for(const[a,b]of[[1,0],[-1,0],[0,1],[0,-1]]){const k=(x+a)+','+(z+b);if(!seen.has(k)&&walk.has(k)&&Math.abs(walk.get(k)-walk.get(q[i]))<=1){seen.add(k);q.push(k)}}}
    links.push(seen.has(end));
  }
  return {jumps,maxJump,blocked,walkWithoutJump:links,roadCells:roadSet.size,earth:T.summary(),steps:r.roads.map(r=>r.steps),reports:r.report};
}
if(require.main===module){
  const results=[];
  for(const c of C.cases){const r=C.generate(M,c),m=metrics(r);assert(r.roads.every(x=>!x.failed),c.id+' skipped');assert.equal(m.jumps,0,c.id+' has a two-block road lip');
    for(const road of r.roads){assert(road.levels.every(Number.isFinite),c.id);for(let i=1;i<road.levels.length;i++)assert(Math.abs(road.levels[i]-road.levels[i-1])<=1,c.id+' grade');for(const s of road.spans||[])assert.equal(new Set(road.levels.slice(s.a,s.b+1)).size,1,c.id+' tilted deck');}
    for(const k of r.S.blocks.keys()){const[x,,z]=k.split(',').map(Number);assert(r.T.inside(x,z),c.id+' wrote outside region');}
    assert(m.walkWithoutJump.every(Boolean),c.id+' has no continuous half-step walking route');
    results.push({id:c.id,...m});
  }
  const a=C.generate(M,C.cases[0]),b=C.generate(M,C.cases[0]);assert.equal(hash(a.S),hash(b.S));
  const T=C.terrain(M,{terrain:'flat'}),before=hash(T.S);
  for(const path of [[],[[3,3]],[[3,3],[3,3]],[[NaN,4],[Infinity,8]],[[200,200],[300,300]]]){const r=M.street(T,{path});assert(r.failed);assert.equal(hash(T.S),before);}
  // Impossible inherited junction levels must not silently be dropped or overwrite existing roads.
  const RS=new Map([[M.key3(20,0,20),5],[M.key3(23,0,20),25]]),bad=M.street(T,{path:[[20,20],[23,20]],roadSet:RS});assert(bad.failed);assert.equal(hash(T.S),before);
  for(const curve of ['straight','smooth','fillet']){const t=C.terrain(M,{terrain:'flat'}),r=M.street(t,{path:[[5,20],[40,20],[5,20]],curve});assert(r.cells.every(p=>p.every(Number.isFinite)));}
  let matrix=0;
  const shapes=[[[5,28],[74,28]],[[8,7],[70,48]],[[8,8],[42,8],[42,46]],[[8,10],[24,10],[24,42],[72,42]]];
  for(const width of [3,5,7])for(const curve of ['straight','smooth','fillet'])for(const t of ['flat','slope8','slope16','river'])for(const p of shapes){
    const c={terrain:t,width,curve,paths:[p]},r=C.generate(M,c),m=metrics(r);assert(!r.roads[0].failed,JSON.stringify(c));assert.equal(m.jumps,0,JSON.stringify(c));assert(m.walkWithoutJump.every(Boolean),'walking '+JSON.stringify(c));matrix++;
  }
  console.log(JSON.stringify({visualCases:results.length,matrixCases:matrix,invalidCases:6,hairpins:3,determinism:true,results}));
}
module.exports={metrics};
