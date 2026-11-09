// Native Baroque entry points and meaningful parameter changes. No npm packages.
const assert=require('assert'),crypto=require('crypto'),M=require('../mcgen.js');
const hash=S=>crypto.createHash('sha256').update([...S.blocks].map(([k,v])=>k+'='+v).sort().join('\n')).digest('hex');
const r=M.cathedral({style:'baroque'}),m=r.S.toModel(),base=hash(r.S);
assert.deepStrictEqual([m.W,m.H,m.L],[139,99,121]);assert.strictEqual(r.S.blocks.size,220246);assert.strictEqual(r.placement.total,0);assert.strictEqual(r.spec.front,'west (-X)');
assert.strictEqual(hash(M.PROPS.cathedral.make({style:'baroque'}).S),base);assert.strictEqual(hash(M.cathedral(r.spec).S),base);
for(const spec of [{seed:9},{extra_bays:1},{extra_bays:3},{interior:false},{roof:'slate'},{walls:'ivory'}]){
 const n=M.cathedral({style:'baroque',...spec});assert.strictEqual(n.placement.total,0);assert.notStrictEqual(hash(n.S),base,JSON.stringify(spec));assert.strictEqual(n.S.toModel().W,139+14*(spec.extra_bays||0));
}
assert.strictEqual(M.cathedral({style:'baroque',extra_bays:99}).spec.extra_bays,3);
assert.strictEqual(M.cathedral({...r.spec,roof:'slate'}).spec.roof,'slate');
console.log('Baroque: default, registration, determinism, 6 parameter variants and clamp passed.');

assert.strictEqual(hash(M.cathedral({style:'baroque',detail:'simple'}).S),base);
assert.ok(!('detail' in r.spec));
