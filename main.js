(()=>{
'use strict';
const TILE=16;
const canvas=document.getElementById('game');
const ctx=canvas.getContext('2d',{alpha:false});
ctx.imageSmoothingEnabled=false;
const zoneEl=document.getElementById('zone');
const timeEl=document.getElementById('time');
const toastEl=document.getElementById('toast');

const ATLAS_INDEX={"tiles":{"cave_floor":{"x":0,"y":0,"w":16,"h":16},"cliff_e":{"x":16,"y":0,"w":16,"h":16},"cliff_n":{"x":32,"y":0,"w":16,"h":16},"cliff_s":{"x":48,"y":0,"w":16,"h":16},"cliff_w":{"x":64,"y":0,"w":16,"h":16},"cobble_1":{"x":80,"y":0,"w":16,"h":16},"cobble_2":{"x":96,"y":0,"w":16,"h":16},"cobble_3":{"x":112,"y":0,"w":16,"h":16},"dirt":{"x":0,"y":16,"w":16,"h":16},"grass_1":{"x":16,"y":16,"w":16,"h":16},"grass_2":{"x":32,"y":16,"w":16,"h":16},"grass_3":{"x":48,"y":16,"w":16,"h":16},"sand":{"x":64,"y":16,"w":16,"h":16},"water_0":{"x":80,"y":16,"w":16,"h":16},"water_1":{"x":96,"y":16,"w":16,"h":16},"water_2":{"x":112,"y":16,"w":16,"h":16},"water_3":{"x":0,"y":32,"w":16,"h":16},"wood_planks":{"x":16,"y":32,"w":16,"h":16}},"props":{"arch_cave":{"x":0,"y":0,"w":16,"h":16},"barrel":{"x":16,"y":0,"w":16,"h":16},"boat":{"x":32,"y":0,"w":16,"h":16},"bones":{"x":48,"y":0,"w":16,"h":16},"bridge":{"x":64,"y":0,"w":16,"h":16},"broken_column":{"x":80,"y":0,"w":16,"h":16},"bush":{"x":96,"y":0,"w":16,"h":16},"column":{"x":112,"y":0,"w":16,"h":16},"crate":{"x":0,"y":16,"w":16,"h":16},"crystal":{"x":16,"y":16,"w":16,"h":16},"door_blue":{"x":32,"y":16,"w":16,"h":16},"door_red":{"x":48,"y":16,"w":16,"h":16},"door_wood":{"x":64,"y":16,"w":16,"h":16},"flowers":{"x":80,"y":16,"w":16,"h":16},"house_wall":{"x":96,"y":16,"w":16,"h":16},"rock_cluster":{"x":112,"y":16,"w":16,"h":16},"roof_dark":{"x":0,"y":32,"w":16,"h":16},"ruin_wall":{"x":16,"y":32,"w":16,"h":16},"stairs_down":{"x":32,"y":32,"w":16,"h":16},"torch_0":{"x":48,"y":32,"w":16,"h":16},"torch_1":{"x":64,"y":32,"w":16,"h":16},"torch_2":{"x":80,"y":32,"w":16,"h":16},"tree_oak":{"x":96,"y":32,"w":16,"h":16},"tree_pine":{"x":112,"y":32,"w":16,"h":16}},"characters":{"mage":{"x":0,"y":0,"w":16,"h":16},"player_down":{"x":16,"y":0,"w":16,"h":16},"player_left":{"x":32,"y":0,"w":16,"h":16},"player_right":{"x":48,"y":0,"w":16,"h":16},"player_up":{"x":64,"y":0,"w":16,"h":16},"smith":{"x":80,"y":0,"w":16,"h":16},"villager":{"x":96,"y":0,"w":16,"h":16}}};
const atlases={};
function loadAll(){
 const jobs=['tiles','props','characters'].map(cat=>new Promise((res,rej)=>{const im=new Image();im.onload=()=>{atlases[cat]=im;res()};im.onerror=()=>rej(new Error(`No cargó assets/${cat}_atlas.png`));im.src=`assets/${cat}_atlas.png`;}));
 return Promise.all(jobs);
}
function assetRef(name){for(const cat of ['tiles','props','characters']){const r=ATLAS_INDEX[cat][name];if(r)return{cat,r}}return null}
function drawAsset(name,dx,dy,dw=TILE,dh=TILE){const a=assetRef(name);if(!a)return;ctx.drawImage(atlases[a.cat],a.r.x,a.r.y,a.r.w,a.r.h,dx,dy,dw,dh)}
function toast(s){toastEl.textContent=s;toastEl.classList.add('show');clearTimeout(toast.t);toast.t=setTimeout(()=>toastEl.classList.remove('show'),1800)}
function rnd(n){let x=Math.sin(n*999.123)*43758.5453;return x-Math.floor(x)}
function key(x,y,w){return y*w+x}

class MapData{
 constructor(name,w,h,base='grass_1'){this.name=name;this.w=w;this.h=h;this.tiles=new Array(w*h).fill(base);this.objects=[];this.warps=[];this.blocked=new Set();this.ambient='day'}
 get(x,y){return this.tiles[key(x,y,this.w)]}
 set(x,y,t){if(x>=0&&y>=0&&x<this.w&&y<this.h)this.tiles[key(x,y,this.w)]=t}
 fill(x,y,w,h,t){for(let yy=y;yy<y+h;yy++)for(let xx=x;xx<x+w;xx++)this.set(xx,yy,t)}
 obj(sprite,x,y,opt={}){const o={sprite,x,y,block:opt.block??false,layer:opt.layer??0,interact:opt.interact??null,glow:opt.glow??false,label:opt.label??'',anchorY:opt.anchorY??0};this.objects.push(o);if(o.block)this.blocked.add(`${x},${y}`);return o}
 warp(x,y,to,tx,ty,label='Entrar'){this.warps.push({x,y,to,tx,ty,label})}
 isBlocked(x,y){if(x<0||y<0||x>=this.w||y>=this.h)return true;const t=this.get(x,y);return t.startsWith('water')||this.blocked.has(`${x},${y}`)}
}

function makeWorld(){
 const m=new MapData('Costa de las Ruinas',96,72,'grass_2');
 for(let y=0;y<m.h;y++)for(let x=0;x<m.w;x++){const r=rnd(x*97+y*211); if(r<.16)m.set(x,y,'grass_1'); else if(r>.87)m.set(x,y,'grass_3')}
 for(let y=45;y<m.h;y++)for(let x=0;x<m.w;x++)m.set(x,y,'water_0');
 for(let x=0;x<m.w;x++){
   const coast=43+Math.round(Math.sin(x*.21)*2+Math.sin(x*.071)*3);
   for(let y=coast;y<coast+3;y++)m.set(x,y,'sand');
   for(let y=coast+3;y<m.h;y++)m.set(x,y,'water_0');
 }
 for(let y=2;y<44;y++){const cx=68+Math.round(Math.sin(y*.20)*2);for(let x=cx-2;x<=cx+2;x++)m.set(x,y,'water_0')}
 for(const by of [17,33])for(let x=64;x<=72;x++){m.set(x,by,'wood_planks');}
 m.fill(12,18,28,18,'cobble_1');
 m.fill(17,23,17,9,'cobble_3');
 for(let x=4;x<61;x++)for(let y=33;y<=35;y++)m.set(x,y,'dirt');
 for(let y=7;y<44;y++)for(let x=38;x<=40;x++)m.set(x,y,'dirt');
 for(let x=39;x<69;x++)for(let y=15;y<=17;y++)m.set(x,y,'dirt');
 m.fill(53,5,14,11,'cobble_2');
 m.fill(74,10,15,19,'cobble_2');
 m.fill(51,27,11,10,'cobble_1');
 m.fill(6,4,18,10,'grass_1');
 for(let x=5;x<=25;x++){m.obj('rock_cluster',x,3,{block:true});if(x%2===0)m.obj('bush',x,4)}
 for(let y=4;y<14;y++){m.obj('rock_cluster',5,y,{block:true});m.obj('rock_cluster',25,y,{block:true})}
 m.obj('arch_cave',15,7,{block:true,interact:'cave',label:'Entrada de la Cueva de Cristales'});
 m.warp(15,8,'cave',22,27,'Entrar a la cueva');
 function house(x,y,w,h,doorSprite='door_wood'){
  for(let yy=0;yy<h;yy++)for(let xx=0;xx<w;xx++)m.obj('house_wall',x+xx,y+yy,{block:true,layer:1});
  for(let xx=-1;xx<=w;xx++)m.obj('roof_dark',x+xx,y-1,{block:true,layer:2});
  const dx=x+(w>>1);m.obj(doorSprite,dx,y+h-1,{block:true,layer:3,label:'Puerta'});m.blocked.delete(`${dx},${y+h}`);return {doorX:dx,doorY:y+h};
 }
 const h1=house(15,13,6,4,'door_wood'); m.warp(h1.doorX,h1.doorY,'house',8,10,'Entrar en la casa');
 const h2=house(29,14,7,5,'door_red'); m.warp(h2.doorX,h2.doorY,'shop',7,10,'Entrar en la forja');
 const h3=house(6,22,6,4,'door_blue'); m.warp(h3.doorX,h3.doorY,'house',8,10,'Entrar en la casa');
 m.obj('barrel',23,20,{block:true});m.obj('crate',24,20,{block:true});m.obj('flowers',19,26);m.obj('flowers',34,27);m.obj('villager',22,27,{interact:'npc-villager',label:'Mara'});m.obj('smith',31,21,{interact:'npc-smith',label:'Scarlett'});
 for(let x=53;x<67;x++){m.obj('ruin_wall',x,5,{block:true}); if(x!==60)m.obj('ruin_wall',x,15,{block:true})}
 for(let y=6;y<15;y++){if(y!==10)m.obj('ruin_wall',53,y,{block:true});m.obj('ruin_wall',66,y,{block:true})}
 for(const [x,y] of [[56,8],[63,8],[56,13],[63,13]])m.obj('column',x,y,{block:true});
 m.obj('broken_column',59,11,{block:true});m.obj('mage',61,11,{interact:'npc-mage',label:'Lyra'});m.obj('crystal',62,12,{glow:true,block:true});m.obj('bones',57,13);
 for(let x=74;x<89;x++){if(x%3!==0)m.obj('ruin_wall',x,10,{block:true});if(x%4!==0)m.obj('ruin_wall',x,28,{block:true})}
 for(let y=11;y<28;y++){if(y!==20)m.obj('ruin_wall',74,y,{block:true});if(y%4!==0)m.obj('ruin_wall',88,y,{block:true})}
 for(const [x,y] of [[78,14],[84,14],[79,24],[85,24]])m.obj('column',x,y,{block:true});m.obj('stairs_down',81,19,{block:true,label:'Escalera sellada'});
 for(const [x,y] of [[54,8],[65,8],[75,13],[87,13],[75,25],[87,25]])m.obj('torch_0',x,y,{glow:true});
 for(let x=27;x<=35;x++)m.set(x,46,'wood_planks');for(let y=43;y<=53;y++)m.set(31,y,'wood_planks');m.obj('boat',26,53,{label:'Barco de travesía'});
 const safe=(x,y)=>!(x>10&&x<44&&y>10&&y<38)&&!(x>50&&x<91&&y>3&&y<39)&&!(x>3&&x<28&&y>2&&y<16)&&m.get(x,y).startsWith('grass');
 for(let i=0;i<260;i++){const x=2+(rnd(i*13)*90|0),y=2+(rnd(i*31+7)*39|0);if(!safe(x,y))continue;const r=rnd(i*19); if(r<.44)m.obj('tree_oak',x,y,{block:true}); else if(r<.76)m.obj('tree_pine',x,y,{block:true}); else if(r<.9)m.obj('bush',x,y); else m.obj('rock_cluster',x,y,{block:true});}
 for(let i=0;i<80;i++){const x=4+(rnd(i*73)*55|0),y=8+(rnd(i*91)*30|0);if(safe(x,y)&&!m.blocked.has(`${x},${y}`))m.obj('flowers',x,y)}
 return m;
}
function makeCave(){
 const m=new MapData('Cueva de Cristales',44,32,'cave_floor');m.ambient='cave';
 for(let x=0;x<m.w;x++){m.obj('rock_cluster',x,0,{block:true});m.obj('rock_cluster',x,m.h-1,{block:true})}
 for(let y=1;y<m.h-1;y++){m.obj('rock_cluster',0,y,{block:true});m.obj('rock_cluster',m.w-1,y,{block:true})}
 for(let y=1;y<m.h-1;y++){const cx=16+Math.round(Math.sin(y*.34)*3);for(let x=cx-1;x<=cx+1;x++)m.set(x,y,'water_0')}
 for(const y of [9,21])for(let x=12;x<=21;x++)m.set(x,y,'wood_planks');
 for(let i=0;i<95;i++){const x=2+(rnd(i*43)*40|0),y=2+(rnd(i*67+3)*27|0);if(m.get(x,y).startsWith('water')||y>25&&x>17&&x<27)continue;if(rnd(i*17)<.55)m.obj('rock_cluster',x,y,{block:true})}
 for(const [x,y] of [[6,6],[8,8],[34,7],[36,10],[6,22],[10,24],[32,22],[36,25],[23,5]])m.obj('crystal',x,y,{block:true,glow:true});
 for(const [x,y] of [[5,13],[10,14],[29,13],[36,16],[25,26]])m.obj('torch_0',x,y,{glow:true});
 m.obj('bones',35,23);m.obj('crate',7,19,{block:true});m.obj('barrel',8,19,{block:true});
 m.obj('stairs_down',22,28,{label:'Salida'});m.warp(22,28,'world',15,9,'Salir al exterior');
 return m;
}
function makeInterior(name='Casa de Puerto Gris',shop=false){
 const m=new MapData(name,16,12,'wood_planks');m.ambient='interior';
 for(let x=0;x<16;x++){m.obj('house_wall',x,0,{block:true});m.obj('house_wall',x,11,{block:true})}
 for(let y=1;y<11;y++){m.obj('house_wall',0,y,{block:true});m.obj('house_wall',15,y,{block:true})}
 for(let x=2;x<14;x+=4)m.obj('torch_0',x,1,{glow:true});
 if(shop){m.obj('barrel',3,4,{block:true});m.obj('crate',4,4,{block:true});m.obj('crate',11,4,{block:true});m.obj('smith',8,5,{interact:'npc-smith',label:'Scarlett'});m.obj('door_red',7,10,{label:'Salida'});}
 else{m.obj('barrel',12,3,{block:true});m.obj('crate',11,3,{block:true});m.obj('villager',8,5,{interact:'npc-villager',label:'Mara'});m.obj('flowers',4,4);m.obj('door_wood',7,10,{label:'Salida'});}
 m.warp(7,10,'world',18,18,'Salir al exterior');
 return m;
}
const maps={world:makeWorld(),cave:makeCave(),house:makeInterior('Casa de Puerto Gris'),shop:makeInterior('Forja de Scarlett',true)};
const player={map:'world',x:20*TILE,y:22*TILE,dir:'down',speed:72,radius:5};
const keys=new Set();let pressedE=false;
addEventListener('keydown',e=>{const k=e.key.toLowerCase();keys.add(k);if(k==='e'&&!e.repeat)pressedE=true;if(['arrowup','arrowdown','arrowleft','arrowright',' '].includes(k))e.preventDefault()});
addEventListener('keyup',e=>keys.delete(e.key.toLowerCase()));
function currentMap(){return maps[player.map]}
function solidAt(px,py){const tx=Math.floor(px/TILE),ty=Math.floor(py/TILE);return currentMap().isBlocked(tx,ty)}
function canMove(nx,ny){const r=player.radius;return !solidAt(nx-r,ny-r)&&!solidAt(nx+r,ny-r)&&!solidAt(nx-r,ny+r)&&!solidAt(nx+r,ny+r)}
function setMap(id,tx,ty,msg){player.map=id;player.x=(tx+.5)*TILE;player.y=(ty+.5)*TILE;zoneEl.textContent=maps[id].name;toast(msg||maps[id].name)}
function interact(){
 const m=currentMap();const tx=Math.floor(player.x/TILE),ty=Math.floor(player.y/TILE);const offs=player.dir==='up'?[0,-1]:player.dir==='down'?[0,1]:player.dir==='left'?[-1,0]:[1,0];const fx=tx+offs[0],fy=ty+offs[1];
 const warp=m.warps.find(w=>(w.x===tx&&w.y===ty)||(w.x===fx&&w.y===fy));if(warp){setMap(warp.to,warp.tx,warp.ty,warp.label);return}
 const o=m.objects.find(o=>(o.x===fx&&o.y===fy)||(o.x===tx&&o.y===ty));if(o?.interact){if(o.interact==='npc-villager')toast('Mara: «Todavía falta mucho por reconstruir.»');else if(o.interact==='npc-smith')toast('Scarlett: «Trae mineral y te haré algo que aguante.»');else if(o.interact==='npc-mage')toast('Lyra: «Los cristales reaccionan cuando cae la noche.»');return}
 if(o?.label){toast(o.label);return}toast('No hay nada que usar aquí.');
}
let logicalW=320,logicalH=180,scale=4;
function resize(){const dpr=Math.min(2,devicePixelRatio||1);scale=Math.max(2,Math.floor(Math.min(innerWidth/logicalW,innerHeight/logicalH)));canvas.width=Math.floor(innerWidth*dpr);canvas.height=Math.floor(innerHeight*dpr);canvas.style.width=innerWidth+'px';canvas.style.height=innerHeight+'px';ctx.setTransform(dpr,0,0,dpr,0,0);ctx.imageSmoothingEnabled=false;logicalW=Math.max(240,Math.floor(innerWidth/scale));logicalH=Math.max(144,Math.floor(innerHeight/scale));}
addEventListener('resize',resize);resize();
function drawGlow(sx,sy,r,color){const g=ctx.createRadialGradient(sx,sy,1,sx,sy,r);g.addColorStop(0,color);g.addColorStop(.45,'rgba(255,180,70,.09)');g.addColorStop(1,'rgba(255,180,70,0)');ctx.fillStyle=g;ctx.beginPath();ctx.arc(sx,sy,r,0,Math.PI*2);ctx.fill()}
function drawScene(now){
 const m=currentMap();ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,canvas.width,canvas.height);const dpr=Math.min(2,devicePixelRatio||1);ctx.setTransform(dpr,0,0,dpr,0,0);ctx.imageSmoothingEnabled=false;
 const pxScale=scale;const camX=player.x-innerWidth/(2*pxScale),camY=player.y-innerHeight/(2*pxScale);const minX=Math.max(0,Math.floor(camX/TILE)-2),minY=Math.max(0,Math.floor(camY/TILE)-2),maxX=Math.min(m.w-1,Math.ceil((camX+innerWidth/pxScale)/TILE)+2),maxY=Math.min(m.h-1,Math.ceil((camY+innerHeight/pxScale)/TILE)+3);
 ctx.save();ctx.scale(pxScale,pxScale);ctx.translate(-Math.floor(camX),-Math.floor(camY));
 const wf=((now/260)|0)%4;
 for(let y=minY;y<=maxY;y++)for(let x=minX;x<=maxX;x++){let t=m.get(x,y),name=t.startsWith('water')?'water_'+wf:t;if(!assetRef(name))name='grass_2';drawAsset(name,x*TILE,y*TILE,TILE,TILE);}
 const vis=m.objects.filter(o=>o.x>=minX-1&&o.x<=maxX+1&&o.y>=minY-2&&o.y<=maxY+1);
 const list=vis.map(o=>({type:'o',y:o.y*TILE+15,o}));list.push({type:'p',y:player.y+6});list.sort((a,b)=>a.y-b.y || (a.type==='p'?1:-1));
 for(const item of list){
   if(item.type==='p'){ctx.fillStyle='rgba(15,14,18,.22)';ctx.beginPath();ctx.ellipse(player.x,player.y+6,5,2,0,0,Math.PI*2);ctx.fill();drawAsset('player_'+player.dir,Math.round(player.x-8),Math.round(player.y-8),16,16);}
   else{const o=item.o;let name=o.sprite;if(name.startsWith('torch_'))name='torch_'+(((now/150)|0)%3);if(!assetRef(name))continue;ctx.fillStyle='rgba(14,12,16,.16)';if(o.block&&!name.startsWith('roof')){ctx.beginPath();ctx.ellipse(o.x*TILE+8,o.y*TILE+14,5,2,0,0,Math.PI*2);ctx.fill()}drawAsset(name,o.x*TILE,o.y*TILE-o.anchorY,TILE,TILE);}
 }
 if(m.ambient==='cave'||m.ambient==='interior'){
   ctx.fillStyle=m.ambient==='cave'?'rgba(4,7,13,.52)':'rgba(23,15,18,.22)';ctx.fillRect(camX,camY,innerWidth/pxScale,innerHeight/pxScale);
   ctx.globalCompositeOperation='lighter';for(const o of vis)if(o.glow){const sx=o.x*TILE+8,sy=o.y*TILE+7;if(o.sprite.startsWith('torch'))drawGlow(sx,sy,26,'rgba(255,183,76,.35)');else if(o.sprite==='crystal'){const g=ctx.createRadialGradient(sx,sy,1,sx,sy,24);g.addColorStop(0,'rgba(95,226,217,.34)');g.addColorStop(1,'rgba(95,226,217,0)');ctx.fillStyle=g;ctx.beginPath();ctx.arc(sx,sy,24,0,Math.PI*2);ctx.fill()}}
   ctx.globalCompositeOperation='source-over';
 }
 ctx.restore();
 const vg=ctx.createRadialGradient(innerWidth/2,innerHeight/2,Math.min(innerWidth,innerHeight)*.2,innerWidth/2,innerHeight/2,Math.max(innerWidth,innerHeight)*.62);vg.addColorStop(0,'rgba(0,0,0,0)');vg.addColorStop(1,'rgba(0,0,0,.22)');ctx.fillStyle=vg;ctx.fillRect(0,0,innerWidth,innerHeight);
}
let last=performance.now(),clock=8*60+10;
function update(now){
 const dt=Math.min(.035,(now-last)/1000);last=now;clock=(clock+dt*.9)%(24*60);const h=(clock/60|0),mi=(clock%60|0);timeEl.textContent=String(h).padStart(2,'0')+':'+String(mi).padStart(2,'0');
 let dx=0,dy=0;if(keys.has('a')||keys.has('arrowleft'))dx--;if(keys.has('d')||keys.has('arrowright'))dx++;if(keys.has('w')||keys.has('arrowup'))dy--;if(keys.has('s')||keys.has('arrowdown'))dy++;
 if(dx||dy){const len=Math.hypot(dx,dy);dx/=len;dy/=len;const sp=player.speed*(keys.has('shift')?1.55:1);if(Math.abs(dx)>Math.abs(dy))player.dir=dx<0?'left':'right';else player.dir=dy<0?'up':'down';const nx=player.x+dx*sp*dt,ny=player.y+dy*sp*dt;if(canMove(nx,player.y))player.x=nx;if(canMove(player.x,ny))player.y=ny;}
 if(pressedE){interact();pressedE=false}
 drawScene(now);requestAnimationFrame(update)
}
loadAll().then(()=>{zoneEl.textContent=currentMap().name;toast('Mundo listo. Recorre el puerto, las ruinas y la cueva.');requestAnimationFrame(update)}).catch(e=>{console.error(e);toast(e.message)});
})();
