const cases = [
  {id:'bridge-stone',group:'桥头',label:'直跨石桥 · 两岸等高',terrain:'river',paths:[[[5,28],[74,28]]],bridge:'stone',width:5},
  {id:'bridge-diagonal',group:'桥头',label:'45°斜跨 · 木栈桥',terrain:'river',paths:[[[10,4],[58,52]]],bridge:'timber',width:3},
  {id:'bridge-bend',group:'桥头',label:'桥头90°转弯 · 石拱桥',terrain:'river',paths:[[[8,7],[20,7],[20,28],[64,28],[64,48],[73,48]]],bridge:'arch',curve:'fillet',width:5},
  {id:'bridge-s',group:'桥头',label:'S形跨河 · 石墩木面',terrain:'river',paths:[[[8,10],[28,18],[48,39],[72,44]]],bridge:'mixed',curve:'smooth',width:5},
  {id:'bridge-high-bank',group:'桥头',label:'两岸相差8格 · 桥头引坡',terrain:'banks',paths:[[[5,28],[74,28]]],bridge:'arch',width:5},
  {id:'bridge-low-bank',group:'桥头',label:'低岸水面 · 3格窄路',terrain:'lowriver',paths:[[[5,28],[74,28]]],bridge:'timber',width:3},
  {id:'bridge-wide',group:'桥头',label:'7格主路 · 桥栏外移',terrain:'river',paths:[[[5,28],[74,28]]],bridge:'mixed',width:7},
  {id:'bridge-two',group:'桥头',label:'两条水道 · 短岛连接',terrain:'channels',paths:[[[5,28],[74,28]]],bridge:'stone',width:5},
  {id:'bridge-edge',group:'边界',label:'河道靠边 · 引道长度不足',terrain:'edgeRiver',paths:[[[0,28],[72,28]]],bridge:'arch',width:5},
  {id:'bridge-shore',group:'边界',label:'沿岸道路 · 边缘触水不误架桥',terrain:'river',paths:[[[31,5],[31,50]]],bridge:'stone',width:5},
  {id:'viaduct-valley',group:'桥头',label:'干谷高架 · 两端落地',terrain:'valley',paths:[[[5,28],[74,28]]],bridge:'arch',width:5,fill:{mode:'viaduct',limit:3}},
  {id:'junction-t',group:'路口',label:'T形交叉 · 5格接3格',terrain:'flat',paths:[[[5,28],[74,28]],[[40,6],[40,28]]],widths:[5,3]},
  {id:'junction-cross',group:'路口',label:'十字路口 · 起伏地形',terrain:'hills',paths:[[[5,28],[74,28]],[[40,5],[40,50]]],widths:[5,5]},
  {id:'junction-y',group:'路口',label:'Y形锐角 · 坡地汇合',terrain:'slope8',paths:[[[6,45],[40,28],[73,9]],[[40,28],[72,45]]],widths:[5,3]},
  {id:'junction-five',group:'路口',label:'五岔交汇 · 不同材料',terrain:'flat',paths:[[[5,28],[74,28]],[[20,5],[40,28],[60,50]],[[40,28],[65,7]]],widths:[7,5,3]},
  {id:'junction-steep',group:'路口',label:'陡坡十字 · 平台与引坡',terrain:'slope16',paths:[[[5,28],[74,28]],[[40,5],[40,50]]],widths:[5,3]},
  {id:'junction-edge',group:'边界',label:'贴边T形 · 裁切不越界',terrain:'slope8',paths:[[[2,2],[76,2]],[[40,2],[40,50]]],widths:[5,3]},
  {id:'junction-bridge',group:'路口',label:'桥头交叉 · 保留桥下空间',terrain:'river',paths:[[[5,28],[74,28]],[[29,5],[29,50]]],widths:[5,3],bridge:'stone'},
  {id:'ramp-noise',group:'坡道',label:'细碎起伏 · 减少上下反复',terrain:'noise',paths:[[[5,28],[74,28]]],width:5},
  {id:'ramp-4',group:'坡道',label:'缓坡 · 高差4格',terrain:'slope4',paths:[[[5,28],[74,28]]],width:5},
  {id:'ramp-8',group:'坡道',label:'斜向上坡 · 高差8格',terrain:'slope8',paths:[[[5,8],[74,48]]],width:5},
  {id:'ramp-16',group:'坡道',label:'长坡 · 地形高差16格',terrain:'slope16',paths:[[[5,28],[74,28]]],width:5},
  {id:'ramp-24',group:'坡道',label:'地形高差24格 · 分段爬升',terrain:'slope24',paths:[[[4,28],[75,28]]],width:5},
  {id:'ramp-90',group:'坡道',label:'90°折坡 · 转弯休息平台',terrain:'slope16',paths:[[[6,8],[40,8],[40,45],[74,45]]],width:5,curve:'fillet'},
  {id:'ramp-zigzag',group:'坡道',label:'连续多折 · 山坡折返',terrain:'slope24',paths:[[[5,8],[26,8],[26,43],[49,43],[49,13],[74,13]]],width:3,curve:'fillet'},
  {id:'ramp-acute',group:'坡道',label:'锐角折返 · 短边限半径',terrain:'slope8',paths:[[[7,12],[55,28],[20,30],[70,46]]],width:3,curve:'fillet'},
  {id:'ramp-cliff',group:'边界',label:'短距离陡坎 · 削坡挡墙',terrain:'cliff',paths:[[[20,28],[60,28]]],width:5,cut:{mode:'wall',limit:3}},
  {id:'ramp-negative',group:'边界',label:'负坐标地形 · 斜坡转弯',terrain:'slope8',paths:[[[5,8],[35,25],[70,45]]],width:5,origin:[-40,-28],curve:'smooth'},
  {id:'junction-on-bridge',group:'边界',label:'桥面T形接入 · 护栏开口',terrain:'river',paths:[[[5,28],[74,28]],[[40,5],[40,28]]],widths:[5,3],bridge:'stone'},
  {id:'bridge-no-bank',group:'边界',label:'全水面 · 缺岸提示与裁切',terrain:'water',paths:[[[5,28],[74,28]]],width:5,bridge:'timber'},
];
function terrain(M,c) {
  const W=80,L=56,[ox,oz]=c.origin||[0,0],S=new M.Structure();
  const height=(x,z)=>{
    if(c.terrain==='water')return 4;
    if(c.terrain.startsWith('slope'))return 6+Math.round(x/79*Number(c.terrain.slice(5)));
    if(c.terrain==='hills')return 12+Math.round(3*Math.sin(x/12)+2*Math.cos(z/9));
    if(c.terrain==='noise')return 12+Math.round(1.8*Math.sin(x*1.2)+.8*Math.cos(z*.8));
    if(c.terrain==='cliff')return x<40?5:27;
    if(c.terrain==='valley')return Math.round(18-14*Math.exp(-(((x-40)/12)**2)));
    if(c.terrain==='banks')return x<34?12:x>45?20:4;
    if(c.terrain==='lowriver')return x>=34&&x<=45?4:10;
    if(c.terrain==='river')return x>=34&&x<=45?4:12;
    if(c.terrain==='edgeRiver')return x>=2&&x<=15?4:12;
    if(c.terrain==='channels')return (x>=24&&x<=31)||(x>=37&&x<=45)?4:12;
    return 12;
  };
  for(let x=0;x<W;x++)for(let z=0;z<L;z++){
    const h=height(x,z),wet=['river','banks','lowriver','edgeRiver','channels','water'].includes(c.terrain)&&h===4;
    for(let y=0;y<=h;y++)S.set(x+ox,y,z+oz,'minecraft:'+(y===h?(wet?'gravel':'grass_block[snowy=false]'):y>h-3?'dirt':'stone'));
    if(wet)for(let y=h+1;y<=10;y++)S.set(x+ox,y,z+oz,'minecraft:water[level=0]');
  }
  S.box=[[ox,0,oz],[ox+W-1,52,oz+L-1]];return new M.Terrain(S);
}
function generate(M,c){
  const T=terrain(M,c),roads=[],foot=[],report=[],roadSet=new Map(),occupied=new Set(),placed=new Set(),[ox,oz]=c.origin||[0,0];
  const rds=c.paths.map((p,i)=>({path:p.map(([x,z])=>[x+ox,z+oz]),kind:i?'cobble':'main',width:c.widths?.[i]||c.width||5,bridge:c.bridge||'stone',curve:c.curve||'straight',radius:6,fill:c.fill,cut:c.cut,lamps:false}));
  for(let i=0;i<rds.length;i++){const r=M.street(T,{...rds[i],seed:17+i*31,lamps:false,trees:false,roadSet,occupied,placed});roads.push(r);foot.push(new Set(r.road.map(([x,z])=>x+','+z)));}
  if(rds.length>1){M.roundJunctions(T,rds,foot,roadSet,occupied,report,rds.map((_,i)=>i));M.raiseKerbs(T,rds,foot,roadSet,report);}
  for(const r of roads){r.cells.forEach(([x,z],i)=>{const y=roadSet.get(M.key3(x,0,z));if(y!=null)r.levels[i]=y;});r.steps=r.levels.reduce((n,y,i)=>n+(i&&y!==r.levels[i-1]?1:0),0);}
  M.stairShapes(T.S);M.fixConnections(T.S);
  return {T,S:T.S,roads,roadSet,report,rds};
}
module.exports={cases,terrain,generate};
