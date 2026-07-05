#!/usr/bin/env node
// tools/phase2.js — harness dedicado do FIT DA FASE 2 (desafio constante / serrote de HTK).
// Roda os módulos REAIS (como sim.js), simula a campanha greedy com prestige, e mede POR ÁREA:
//   - tempo LÍQUIDO da 1ª passagem (entrada da área -> entrada da próxima), provando escalada de tempo
//   - HTK de ENTRADA (mob fresco no 1º frame da 1ª passagem) e de SAÍDA (última leitura antes de avançar)
//   - estado do GEAR na entrada: raridade + nível médio (provando gear map-long, maxa ~área 17/18)
// Aceita SIM_OVERRIDE (mesmo formato do sim.js campaign) pra iterar dials.
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm');
const argv = process.argv.slice(2);
function arg(n, d){ const i=argv.indexOf('--'+n); return (i===-1||i===argv.length-1)?d:argv[i+1]; }
const SEED = +arg('seed', 1), DT = +arg('dt', 0.1);
function mulberry32(seed){let a=seed>>>0;return function(){a|=0;a=(a+0x6D2B79F5)|0;let t=Math.imul(a^(a>>>15),1|a);t=(t+Math.imul(t^(t>>>7),61|t))^t;return((t^(t>>>14))>>>0)/4294967296;};}
global.window = global;
const LOAD = ['util.js','data.js','gear.js','state.js','economy.js','rates.js','enemyFactory.js','income.js','progression.js','combat.js','convergence.js','awaken.js','passives.js'];
for (const f of LOAD) { const p=path.join(__dirname,'..','src',f); vm.runInThisContext(fs.readFileSync(p,'utf8'),{filename:p}); }
const G = global.G;

// ---- apply SIM_OVERRIDE ----
if (process.env.SIM_OVERRIDE) {
  const ov = JSON.parse(process.env.SIM_OVERRIDE);
  if (ov.balance) for (const k in ov.balance) G.data.balance[k] = ov.balance[k];
  if (ov.uncCap != null) { const r=G.data.rarities.find(r=>r.id==='uncommon'); if(r) r.cap=ov.uncCap; }
  if (ov.commonCap != null) { const r=G.data.rarities.find(r=>r.id==='common'); if(r) r.cap=ov.commonCap; }
  if (ov.drop) for (const p in ov.drop){ const parts=p.split('.'); let o=G.economy.dropTable; for(let i=0;i<parts.length-1;i++) o=o[parts[i]]; o[parts[parts.length-1]]=ov.drop[p]; }
  if (ov.awakenMat != null) G.data.awakens[0].requirements.materials.firstLight = ov.awakenMat;
  if (ov.offering != null) G.data.awakens[0].requirements.lumens = ov.offering;
}

function fmtT(sec){ if(sec<90)return sec.toFixed(0)+'s'; const m=sec/60; if(m<90)return m.toFixed(1)+'m'; const h=Math.floor(m/60),mm=Math.round(m%60); return h+'h'+String(mm).padStart(2,'0')+'m'; }
const fmtN = n=>G.util.fmt(n);
function pad(v,w){v=String(v);return v.length>=w?v:v+' '.repeat(w-v.length);}
function row(c,w){return c.map((x,i)=>pad(x,w[i])).join(' ');}

function gearState(){
  const d=G.state.data; let lv=0, n=0; const rc={common:0,uncommon:0};
  for(const slot of G.data.slots){ const it=d.equipped[slot.id]; lv+=it.level||1; n++; rc[it.rarity]=(rc[it.rarity]||0)+1; }
  const rar = rc.uncommon===6?'Unc×6':rc.uncommon>0?`U${rc.uncommon}/C${rc.common}`:'Com×6';
  return { avgLv:(lv/n), rar };
}
function dmgHit(){ const s=G.state.stats(); return s.atk*(1+(s.crit/100)*(s.critMult-1)); }
function htkNow(idx){ const lvl=G.enemyFactory.mobLevelFor(idx); return G.data.mobHpParam(lvl)/dmgHit(); }
// TTK (âncora primária = ~1s no cruise): hits×intervalo. É o tempo pra derrubar 1 mob comum.
function ttkNow(idx){ const lvl=G.enemyFactory.mobLevelFor(idx); const hits=Math.ceil(G.data.mobHpParam(lvl)/dmgHit()); return hits*G.state.attackInterval(); }

// ---- policy (mirror of sim.js policyTick, trimmed) ----
function bestAreaFor(level){ const d=G.state.data; let best=0; for(let i=0;i<=(d.maxAreaUnlocked||0)&&i<G.data.areas.length;i++) if(G.progression.levelGateFor(i)<=level) best=i; return best; }

const firstPass = {};  // areaIdx -> entry state at the FRONTIER (first time this area index is reached as a NEW max)
let frontierMax = -1;  // highest area index ever reached (the push frontier)

function policyTick(sim){
  const d=G.state.data;
  const best=bestAreaFor(d.level);
  if(best!==d.areaIndex){ d.areaIndex=best; G.combat.enemies=[];G.combat.enemy=null;G.combat.pendingHits=[];G.combat.respawnTimer=0; }
  const run=(d.convergences||0)+1;
  // FRONTIER entry: the FIRST time the player pushes into each new-max area (o desafio de entrada real,
  //   com o prestige acumulado até ali). É o serrote que o design quer — entra desafiado no limite.
  if(best>frontierMax){
    frontierMax=best;
    const gs=gearState();
    const s=G.state.stats(); const bd=s._breakdown.atk||[];
    // decompose atk sources at this frontier entry
    let flatBase=0,flatLevel=0,flatGear=0,flatPass=0,pct=0,mult=1;
    for(const e of bd){ if(e.type==='pct') pct+=e.amount; else if(e.type==='mult') mult*=e.amount; else { if(e.source==='Character Level')flatLevel+=e.amount; else if(e.source==='Equipment')flatGear+=e.amount; else if(e.source==='Passives')flatPass+=e.amount; else flatBase+=e.amount; } }
    firstPass[best]={ tEnter:sim.t, level:d.level, ttkEntry:ttkNow(best), ttkExit:ttkNow(best), htkEntry:htkNow(best), htkExit:htkNow(best), critRaw:s.critRaw, gearRar:gs.rar, gearLv:gs.avgLv, run,
      convs:(d.convergences||0), atk:s.atk, flatLevel, flatGear, flatPass, pct, mult };
  }
  // update exit TTK/HTK for the current frontier area (last reading while still parked here at the frontier)
  if(d.areaIndex===frontierMax && firstPass[d.areaIndex]!==undefined){ const s2=G.state.stats(); firstPass[d.areaIndex].ttkExit=ttkNow(d.areaIndex); firstPass[d.areaIndex].htkExit=htkNow(d.areaIndex); firstPass[d.areaIndex].critRawExit=s2.critRaw; firstPass[d.areaIndex].tExit=sim.t; }
  if(sim.maxCritRaw==null||G.state.stats().critRaw>sim.maxCritRaw) sim.maxCritRaw=G.state.stats().critRaw;

  // spend lumens on gear (greedy cheapest)
  for(let i=0;i<500;i++){ let ch=null,cost=Infinity; for(const slot of G.data.slots){const it=d.equipped[slot.id]; if(G.gear.isMaxed(it))continue; const c=G.gear.cost(it); if(c<cost){cost=c;ch=it;}} if(!ch||d.lumens<cost)break; G.gear.levelUp(ch); }
  // promote
  for(const slot of G.data.slots){ const it=d.equipped[slot.id]; if(G.gear.canPromote(it)) G.gear.promote(it); }
  // awaken
  if(G.awaken.canAwaken('first_light')){ G.awaken.awaken('first_light'); sim.firstLightAt=sim.t; }
  // converge
  if(G.convergence.canConverge() && d.level>=G.convergence.currentGate()){ G.convergence.converge(); sim.convs=(sim.convs||0)+1; }
  // buy passives
  if((d.convergences||0)>=1){ for(let i=0;i<200;i++){ let ch=-1,cost=Infinity; for(let nn=0;nn<15;nn++){ if(!G.passives.canBuy(nn))continue; const c=G.passives.nextCost(nn); if(c<cost){cost=c;ch=nn;} } if(ch===-1)break; G.passives.buy(ch); } }
}

// ---- run ----
Math.random = mulberry32(SEED);
G.state.reset(); G.state.invalidateStats();
Object.assign(G.combat,{enemies:[],enemy:null,atkTimer:0,respawnTimer:0,pendingHits:[],spawnCount:0,_lastAreaIndex:-1,_bossKills:0,_okhraManifest:false,_tideTimer:0,_tideRisen:false});
Object.assign(G.rates,{_clock:0,_gains:[]});
const sim={ t:0, firstLightAt:null, convs:0 };
const maxT = (+arg('max-hours', 60))*3600;   // cap de segurança em horas de SIM (não wall-clock)
const wallStart = Date.now(), wallCapMs = (+arg('wall', 90))*1000;   // guarda de wall-clock
let nextPolicy=0;
let clearT=null, wallStop=false;
while(sim.t<maxT){
  G.combat.tick(DT); sim.t+=DT;
  if(sim.t>=nextPolicy){ policyTick(sim); nextPolicy=sim.t+1; if(Date.now()-wallStart>wallCapMs){wallStop=true;break;} }
  if(G.state.data.mapOneCleared){ clearT=sim.t; break; }
}
const d=G.state.data;

// ---- report ----
console.log(`\n═══ FASE 2 REPORT — seed ${SEED} ${process.env.SIM_OVERRIDE?'· [OVERRIDE]':''} ═══`);
if(process.env.SIM_OVERRIDE) console.log('  '+process.env.SIM_OVERRIDE.slice(0,300));
// RÉGUA PRIMÁRIA = HTK (golpes-pra-matar). Alvo: entrada = SPIKE (~8-9 hits, crescendo no late),
//   saída = cruise ~2 hits (o melt). TTK é DERIVADO (HTK × cadência), sem piso duro (melt <1s permitido).
console.log('\n── 1ª PASSAGEM (RÉGUA = HTK): entrada(spike)→saída(~2) · TTK derivado · gear · tempo ──');
const W=[5,4,8,8,7,9,9,9,9,9,7];
console.log(row(['área','grp','entra','tLíq','nível','HTKent','HTKsaí','TTKent','TTKsaí','gear','avgLv'],W));
const gs=G.data.balance.groupSize;
for(let i=0;i<18;i++){
  const f=firstPass[i];
  if(!f){ console.log(row([i+1,'G'+(Math.floor(i/gs)+1),'—','—','—','—','—','—','—','—','—'],W)); continue; }
  const next=firstPass[i+1];
  const tNet = next? (next.tEnter-f.tEnter) : (clearT? clearT-f.tEnter : sim.t-f.tEnter);
  console.log(row([i+1,'G'+(Math.floor(i/gs)+1),fmtT(f.tEnter),fmtT(tNet),f.level,
    f.htkEntry.toFixed(1),(f.htkExit!=null?f.htkExit.toFixed(1):'—'),
    f.ttkEntry.toFixed(2)+'s',f.ttkExit.toFixed(2)+'s',f.gearRar,f.gearLv.toFixed(0)],W));
}
console.log(`  crit-overflow (crit>100 ⇒ multi-golpe do gênero): critRaw MÁX no mapa = ${(sim.maxCritRaw||0).toFixed(1)}% → ${(sim.maxCritRaw||0)>100?'PASSA de 100 (registrar)':'não chega a 100 no Mapa 1 (candidato futuro)'}`);
// SOLVER: back-out do dmgHit do jogador na entrada do frontier via o htkEntry gravado (dmg = mobHP_baked/htk).
//   HP-alvo pra HTK entrada 8 = dmg×8. Emite os pares (level, HP-alvo) pra fitar as curvas de HP.
if(process.env.SOLVE){
  console.log('\n── SOLVER: HP-alvo por frontier (HTK entrada = 8) ──');
  const pairs=[];
  for(let i=0;i<18;i++){ const f=firstPass[i]; if(!f)continue;
    const lvl=G.data.areas[i].levelRange[0];
    const dmg=(f.htkEntry>0? G.data.mobHpParam(lvl)/f.htkEntry : null);
    if(dmg==null)continue;
    const hpTarget=dmg*8;
    pairs.push([lvl,hpTarget]);
    console.log(`área ${i+1} L${lvl}: dmgHit=${fmtN(dmg)} · HP-alvo(HTK8)=${fmtN(hpTarget)}`);
  }
  console.log('SOLVE_PAIRS='+JSON.stringify(pairs));
}
console.log('\n── decomposição do ATK na entrada do frontier (por que TTK trivial?) ──');
const WD=[5,7,10,10,10,8,8];
console.log(row(['área','convs','flatLevel','flatGear','flatPass','pct%','mult'],WD));
for(let i=0;i<18;i++){ const f=firstPass[i]; if(!f)continue;
  console.log(row([i+1,f.convs,fmtN(f.flatLevel),fmtN(f.flatGear),fmtN(f.flatPass),f.pct.toFixed(0),f.mult.toFixed(2)],WD));
}
console.log(`\n  clear Mapa 1: ${clearT?fmtT(clearT):'NÃO clarou ('+fmtT(sim.t)+(wallStop?' wall-stop':'')+')'} · First Light ${sim.firstLightAt?fmtT(sim.firstLightAt):'—'} · convs ${sim.convs} · nível final ${d.level} · kills ${fmtN(d.totalKills)} · área ${d.areaIndex+1}`);
const gsf=gearState();
console.log(`  gear final: ${gsf.rar} avgLv ${gsf.avgLv.toFixed(0)} · awaken mat ${fmtN(G.economy.getAwaken('firstLight'))} · lumens ${fmtN(d.lumens)}`);
