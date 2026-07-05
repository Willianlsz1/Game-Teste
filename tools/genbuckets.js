// Fit continuous HP buckets to the HTK=8-entry HP targets (smooth trend through the promotion/prestige cliffs).
// Player frontier dmg grows in leaps; we fit the smooth power-law trend so HTK spikes ~8 in MOST areas
// (local dips right after each promotion/convergence leap are unavoidable — reported).
const pairs=[[1,155.8],[81,15212],[172,319605],[277,634140],[397,955059],[535,2819303],[694,5479848],[877,6487196],[1087,7957630],[1329,4290628272],[1607,5626832039],[1927,5744578718],[2295,19001689594],[2718,18166026028],[3204,21502994103],[3763,7867592123381],[5145,7870620902405]];
const bounds=[200,600,1600,3200,Infinity];
function contBuckets(ys, v1){
  const y0=ys[0]; const x0=1/Math.pow(v1,1/y0);
  const bk=[{maxLevel:bounds[0],x:x0,y:y0}];
  for(let i=1;i<ys.length;i++){
    const Lb=bounds[i-1], prev=bk[i-1];
    const vAtLb=Math.pow(Lb/prev.x,prev.y);
    const yi=ys[i]; const xi=Lb/Math.pow(vAtLb,1/yi);
    bk.push({maxLevel:(bounds[i]===Infinity?Infinity:bounds[i]),x:xi,y:yi});
  }
  return bk;
}
function val(bk,L){ L=Math.max(1,L); let b=bk[bk.length-1]; for(const x of bk){if(L<x.maxLevel){b=x;break;}} return Math.pow(L/b.x,b.y); }
// HP: fit y ramp to hit the trend. Early gentle (area1 beatable), steep late (matches the big prestige dmg).
const hpYs=(process.env.HPYS?process.env.HPYS.split(',').map(Number):[1.55,2.05,2.55,3.10,3.35]);
const hpBk=contBuckets(hpYs,155.8/8*13/13); // anchor HP(1) ~ 13-19 region; use 13 to keep naked area1 sane
const hpBk2=contBuckets(hpYs,13);
// ATK gap 0.5, atk(1)=1.4
const atkYs=hpYs.map(y=>y-0.5);
const atkBk=contBuckets(atkYs,1.4);
// GOLD: track hp early, accel late; gold(1)=2.93
const goldYs=(process.env.GOLDYS?process.env.GOLDYS.split(',').map(Number):[1.55,2.10,2.65,3.20,3.50]);
const goldBk=contBuckets(goldYs,2.93);

console.log('fit check — HP curve vs HTK8-target (ratio = curve/target; ~1 good, big cliffs where prestige leaps):');
for(const [L,tgt] of pairs){ const hp=val(hpBk2,L); console.log(`L${L}: curveHP=${hp.toExponential(2)} target=${tgt.toExponential(2)} ratio=${(hp/tgt).toFixed(2)}`); }
console.log('\nHP(1)=',val(hpBk2,1).toFixed(1),'HP(6000)=',val(hpBk2,6000).toExponential(2));

const eb=hpBk2.map((h,i)=>({maxLevel:h.maxLevel===Infinity?999999:h.maxLevel,hpX:+h.x.toFixed(5),hpY:h.y,atkX:+atkBk[i].x.toFixed(5),atkY:+atkBk[i].y.toFixed(2)}));
const gb=goldBk.map(g=>({maxLevel:g.maxLevel===Infinity?999999:g.maxLevel,x:+g.x.toFixed(5),y:g.y}));
console.log('\nJSON EB='+JSON.stringify(eb));
console.log('JSON GB='+JSON.stringify(gb));
// pretty for data.js
console.log('\nenemyBuckets:');
for(const e of eb) console.log(`      { maxLevel: ${e.maxLevel===999999?'Infinity':e.maxLevel}, hpX: ${e.hpX}, hpY: ${e.hpY.toFixed(2)}, atkX: ${e.atkX}, atkY: ${e.atkY.toFixed(2)} },  // gap 0.50`);
console.log('goldBuckets:');
for(const g of gb) console.log(`      { maxLevel: ${g.maxLevel===999999?'Infinity':g.maxLevel}, x: ${g.x}, y: ${g.y.toFixed(2)} },`);
