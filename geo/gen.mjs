import fs from 'fs';
const d = JSON.parse(fs.readFileSync('mapdata.json','utf8'));
const AX=-140, AZ=575;            // 竞技场中心
const R=620;
const shoreA=[-145,498], shoreB=[-230,568];
const nLand=[0.636,0.772], u=[-0.772,0.636];
const off=(p,k)=>[p[0]+nLand[0]*k, p[1]+nLand[1]*k];
const P0=off(shoreA,-12), P1=off(shoreB,-12);
const S0=[P1[0]-u[0]*600, P1[1]-u[1]*600];
const S3=[P0[0]+u[0]*600, P0[1]+u[1]*600];
const far=[S3[0]-nLand[0]*900,S3[1]-nLand[1]*900];
const far2=[S0[0]-nLand[0]*900,S0[1]-nLand[1]*900];
const water=[S0,P1,P0,S3,far,far2];
function inWater(x,z){ // 与水面判定一致：nLand 方向为正=陆地
  const s=(x-P0[0])*nLand[0]+(z-P0[1])*nLand[1];
  return s<-2;
}
let dropped=0;
const B=[];
for(const b of d.buildings){
  const xs=b.p.map(p=>p[0]), zs=b.p.map(p=>p[1]);
  const mx=xs.reduce((a,c)=>a+c,0)/xs.length, mz=zs.reduce((a,c)=>a+c,0)/zs.length;
  if(Math.hypot(mx-AX,mz-AZ)>R) continue;
  if(inWater(mx,mz)){ dropped++; continue; }
  const flat=[]; for(const p of b.p){ flat.push(+p[0].toFixed(1), +p[1].toFixed(1)); }
  B.push([flat, +b.h.toFixed(1)]);
}
const R2=[];
for(const r of d.roads){
  let near=false;
  const flat=[];
  for(const p of r.p){ flat.push(+p[0].toFixed(1), +p[1].toFixed(1)); if(Math.hypot(p[0]-AX,p[1]-AZ)<R) near=true; }
  if(near && flat.length>=4) R2.push([flat, r.w]);
}
const W=[water.map(p=>[+p[0].toFixed(1),+p[1].toFixed(1)])];
const out={ax:AX, az:AZ, water:W, b:B, r:R2,
  shore:{a:off(shoreA,-15), b:off(shoreB,-15), n:nLand}};
fs.writeFileSync('mapdata.min.json', JSON.stringify(out));
console.log('buildings',B.length,'dropped(in water)',dropped,'roads',R2.length,'bytes',fs.statSync('mapdata.min.json').size);
