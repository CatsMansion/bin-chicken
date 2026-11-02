import fs from 'fs';
const raw = JSON.parse(fs.readFileSync('osm_raw.json','utf8'));
const lat0 = -33.8695, lon0 = 151.1920;
const MX = 111320*Math.cos(lat0*Math.PI/180), MZ = 110540;
const P = (lat,lon)=>[ (lon-lon0)*MX, -(lat-lat0)*MZ ];
const stats = {building:0, water:0, highway:0, park:0};
let minx=1e9,maxx=-1e9,minz=1e9,maxz=-1e9;
const big = [];
const buildings=[], water=[], roads=[], parks=[];
for (const el of raw.elements){
  const tags = el.tags||{};
  if (!el.geometry) continue;
  const pts = el.geometry.map(g=>P(g.lat,g.lon));
  for(const [x,z] of pts){ minx=Math.min(minx,x);maxx=Math.max(maxx,x);minz=Math.min(minz,z);maxz=Math.max(maxz,z); }
  if (tags.building){
    stats.building++;
    let h = 3.2*parseFloat(tags['building:levels']||0) || 0;
    if(!h){ const b=tags.building; h = (b==='house')?6:(b==='apartments'||b==='residential')?15:(b==='commercial'||b==='retail')?7:(b==='industrial'||b==='warehouse')?9:(b==='garage'||b==='shed')?3.2:7; }
    h = Math.min(h, 60);
    buildings.push({p:pts, h:+h.toFixed(1), b:tags.building});
    // area
    let a=0; for(let i=0;i<pts.length;i++){const j=(i+1)%pts.length; a+=pts[i][0]*pts[j][1]-pts[j][0]*pts[i][1];}
    a=Math.abs(a/2);
    if(a>1200) big.push({area:Math.round(a), h, name:tags.name||tags.building||'', x:+(pts.reduce((s,p)=>s+p[0],0)/pts.length).toFixed(0), z:+(pts.reduce((s,p)=>s+p[1],0)/pts.length).toFixed(0)});
  } else if (tags.natural==='water'){
    stats.water++; water.push(pts);
  } else if (tags.highway){
    stats.highway++;
    const w = ({footway:2.2,path:2,steps:2,service:5,pedestrian:6,residential:8,unclassified:7,tertiary:9,secondary:11,primary:13,trunk:14,motorway:16})[tags.highway]||6;
    roads.push({p:pts, w, k:tags.highway});
  } else if (tags.leisure==='park'||tags.landuse==='grass'||tags.landuse==='recreation_ground'){
    stats.park++; parks.push(pts);
  }
}
console.log(stats, 'bbox', [minx,minz].map(v=>v.toFixed(0)), [maxx,maxz].map(v=>v.toFixed(0)));
console.log('water polygons', water.map(w=>w.length));
big.sort((a,b)=>b.area-a.area);
console.table(big.slice(0,14));
fs.writeFileSync('mapdata.json', JSON.stringify({lat0,lon0,center:[lon0,lat0],buildings,water,roads,parks}));
console.log('bytes', fs.statSync('mapdata.json').size);
