// Baseline wall check + gearFlatScale sweep. HTK per area entry for:
//   (a) NO-prestige maxed COMMON and maxed UNCOMMON gear  -> deve TRAVAR ~G2-G4
//   (b) WITH expected prestige (N convergences of passives+legacy) -> serrote jogável
global.window = global;
const fs=require('fs'), path=require('path'), vm=require('vm');
const LOAD=['util.js','data.js','gear.js','state.js','economy.js','rates.js','enemyFactory.js','income.js','progression.js','combat.js','convergence.js','awaken.js','passives.js'];
for(const f of LOAD){const p=path.join(__dirname,'..','src',f);vm.runInThisContext(fs.readFileSync(p,'utf8'),{filename:p});}
const G=global.G; const b=G.data.balance;
if(process.env.EB) b.enemyBuckets=JSON.parse(process.env.EB);
if(process.env.GB) b.goldBuckets=JSON.parse(process.env.GB);
if(process.env.SCALE) b.gearPowerScale=+process.env.SCALE;

function measure(L,rar,lv){
  G.state.reset(); G.state.data.level=L;
  if(rar){ for(const slot of G.data.slots){ const it=G.gear.buildPiece(slot.id,rar); it.level=lv; G.state.data.equipped[slot.id]=it; } }
  G.state.invalidateStats(); const s=G.state.stats();
  const dmg=s.atk*(1+(s.crit/100)*(s.critMult-1)); const hp=G.data.mobHpParam(L);
  return {htk:hp/dmg, hp, atk:s.atk};
}
console.log(`WALL CHECK — gearPowerScale=${b.gearPowerScale==null?'1 (off)':b.gearPowerScale}`);
console.log('area\tlevel\tmobHP\t\tnakedHTK\tcommHTK\tuncHTK');
let wallArea=null;
for(let i=0;i<18;i++){
  const L=G.data.areas[i].levelRange[0];
  const n=measure(L,null), c=measure(L,'common',500), u=measure(L,'uncommon',3000);
  console.log([i+1,L,n.hp.toExponential(2),n.htk.toFixed(0),c.htk.toFixed(1),u.htk.toFixed(2)].join('\t'));
  // "wall" = maxed COMMON HTK crosses ~40 (dozens of hits, stuck without promotion/prestige)
  if(wallArea==null && c.htk>40) wallArea=i+1;
}
console.log(`\n=> baseline (maxed COMMON, sem promover/prestige) TRAVA na área ${wallArea||'>18 (não trava)'} (HTK>40). Alvo: G2-G4 (área 4-12).`);
console.log('HP(6000)=',G.data.mobHpParam(6000).toExponential(2));
