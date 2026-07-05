// Sweep gearPowerScale: for each, measure (a) baseline no-prestige wall area, (b) does WITH-prestige
//   campaign clear + clear time. Runs the real modules; sets balance dials in-memory per candidate.
global.window = global;
const fs=require('fs'), path=require('path'), vm=require('vm');
const LOAD=['util.js','data.js','gear.js','state.js','economy.js','rates.js','enemyFactory.js','income.js','progression.js','combat.js','convergence.js','awaken.js','passives.js'];
for(const f of LOAD){const p=path.join(__dirname,'..','src',f);vm.runInThisContext(fs.readFileSync(p,'utf8'),{filename:p});}
const G=global.G;
function mulberry32(seed){let a=seed>>>0;return function(){a|=0;a=(a+0x6D2B79F5)|0;let t=Math.imul(a^(a>>>15),1|a);t=(t+Math.imul(t^(t>>>7),61|t))^t;return((t^(t>>>14))>>>0)/4294967296;};}
const DT=0.1;

function baselineWallArea(){
  // no prestige: player levels via kills, buys gear greedily (common; can promote if material). Where does TTD<TTK (stuck)?
  Math.random=mulberry32(1); G.state.reset(); G.state.invalidateStats();
  Object.assign(G.combat,{enemies:[],enemy:null,atkTimer:0,respawnTimer:0,pendingHits:[],spawnCount:0,_lastAreaIndex:-1,_bossKills:0,_okhraManifest:false,_tideTimer:0,_tideRisen:false});
  let t=0,nextP=0,stuckArea=null,lastLevel=0,stuckT=0;
  const maxT=300*3600;
  while(t<maxT){
    G.combat.tick(DT); t+=DT;
    if(t>=nextP){ nextP=t+1; const d=G.state.data;
      // move to best area by gate
      let best=0; for(let i=0;i<=(d.maxAreaUnlocked||0)&&i<G.data.areas.length;i++) if(G.progression.levelGateFor(i)<=d.level) best=i;
      if(best!==d.areaIndex){d.areaIndex=best;G.combat.enemies=[];G.combat.enemy=null;G.combat.pendingHits=[];G.combat.respawnTimer=0;}
      // buy gear greedy + promote
      for(let i=0;i<500;i++){let ch=null,c=Infinity;for(const s of G.data.slots){const it=d.equipped[s.id];if(G.gear.isMaxed(it))continue;const cc=G.gear.cost(it);if(cc<c){c=cc;ch=it;}}if(!ch||d.lumens<c)break;G.gear.levelUp(ch);}
      for(const s of G.data.slots){const it=d.equipped[s.id];if(G.gear.canPromote(it))G.gear.promote(it);}
      // stuck detection: level hasn't risen in 20h of sim
      if(d.level>lastLevel){lastLevel=d.level;stuckT=t;}
      else if(t-stuckT>20*3600){stuckArea=d.areaIndex+1;break;}
      if(d.mapOneCleared){stuckArea='CLEARED area18';break;}
      if(d.level>=6000){stuckArea='reached6000 area'+(d.areaIndex+1);break;}
    }
  }
  return {area:stuckArea,level:G.state.data.level};
}

const scale=+process.argv[2]||G.data.balance.gearPowerScale||1;
G.data.balance.gearPowerScale=scale;
const w=baselineWallArea();
console.log(`scale ${scale}: baseline (no prestige) -> ${w.area} (nível ${w.level})`);
