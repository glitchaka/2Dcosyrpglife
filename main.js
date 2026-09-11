(()=>{
'use strict';

const canvas=document.getElementById('game');
const ctx=canvas.getContext('2d');
ctx.imageSmoothingEnabled=false;
const zoneEl=document.getElementById('zone');
const sourceEl=document.getElementById('source');
const hintEl=document.getElementById('hint');

const SCENES={
  town:{
    name:'Puerto · mundo exterior',
    source:'Kenney Tiny Town · 16×16 · CC0',
    url:'https://raw.githubusercontent.com/GeorgeQLe/assets-2d-city/main/assets/kenney/tiny-town/Sample.png',
    spawn:[0.51,0.58],
    exits:[{x:.50,y:.92,r:.08,to:'dungeon',spawn:[.50,.83],label:'E · entrar a la mazmorra'}]
  },
  dungeon:{
    name:'Mazmorra',
    source:'Kenney Tiny Dungeon · 16×16 · CC0',
    url:'https://raw.githubusercontent.com/yurukusa/spell-cascade/15046980488631690b1c46bf348fadee18a1e19e/assets/sprites/kenney/tiny-dungeon/Sample.png',
    spawn:[0.50,0.83],
    exits:[{x:.50,y:.91,r:.09,to:'town',spawn:[.51,.82],label:'E · volver al exterior'}]
  }
};

const loaded={};
const keys=new Set();
let sceneId='town';
let scene=null;
let worldW=1,worldH=1;
let scale=4;
let last=performance.now();
let interactLatch=false;
let loading=true;

const player={x:0,y:0,speed:58,dir:'down'};

function loadImage(url){
  return new Promise((resolve,reject)=>{
    const img=new Image();
    img.crossOrigin='anonymous';
    img.onload=()=>resolve(img);
    img.onerror=()=>reject(new Error('No se pudo cargar el asset remoto'));
    img.src=url;
  });
}

async function loadAll(){
  const ids=Object.keys(SCENES);
  await Promise.all(ids.map(async id=>{loaded[id]=await loadImage(SCENES[id].url)}));
  enterScene('town',SCENES.town.spawn);
  loading=false;
  hintEl.textContent='Recorre el mapa. En el borde inferior usa E para cambiar entre exterior y mazmorra.';
}

function enterScene(id,spawn){
  sceneId=id;
  scene=SCENES[id];
  const img=loaded[id];
  worldW=img.naturalWidth;
  worldH=img.naturalHeight;
  const p=spawn||scene.spawn;
  player.x=Math.round(p[0]*worldW);
  player.y=Math.round(p[1]*worldH);
  zoneEl.textContent=scene.name;
  sourceEl.textContent=scene.source;
}

addEventListener('keydown',e=>{
  const k=e.key.toLowerCase();
  keys.add(k);
  if(k==='e'&&!e.repeat)interactLatch=true;
  if(['arrowup','arrowdown','arrowleft','arrowright',' '].includes(k))e.preventDefault();
});
addEventListener('keyup',e=>keys.delete(e.key.toLowerCase()));

function resize(){
  const dpr=Math.min(2,devicePixelRatio||1);
  canvas.width=Math.floor(innerWidth*dpr);
  canvas.height=Math.floor(innerHeight*dpr);
  canvas.style.width=innerWidth+'px';
  canvas.style.height=innerHeight+'px';
  ctx.setTransform(dpr,0,0,dpr,0,0);
  ctx.imageSmoothingEnabled=false;
  scale=Math.max(2,Math.min(6,Math.floor(Math.min(innerWidth/320,innerHeight/180)*4)));
}
addEventListener('resize',resize);
resize();

function nearestExit(){
  if(!scene)return null;
  let best=null,bestD=Infinity;
  for(const exit of scene.exits){
    const ex=exit.x*worldW,ey=exit.y*worldH;
    const d=Math.hypot(player.x-ex,player.y-ey)/Math.max(worldW,worldH);
    if(d<exit.r&&d<bestD){bestD=d;best=exit;}
  }
  return best;
}

function interact(){
  const exit=nearestExit();
  if(!exit)return;
  enterScene(exit.to,exit.spawn);
}

function update(dt){
  if(loading||!scene)return;
  let dx=0,dy=0;
  if(keys.has('a')||keys.has('arrowleft'))dx--;
  if(keys.has('d')||keys.has('arrowright'))dx++;
  if(keys.has('w')||keys.has('arrowup'))dy--;
  if(keys.has('s')||keys.has('arrowdown'))dy++;
  if(dx||dy){
    const len=Math.hypot(dx,dy);dx/=len;dy/=len;
    const run=keys.has('shift')?1.65:1;
    player.x+=dx*player.speed*run*dt;
    player.y+=dy*player.speed*run*dt;
    player.x=Math.max(5,Math.min(worldW-5,player.x));
    player.y=Math.max(5,Math.min(worldH-5,player.y));
    if(Math.abs(dx)>Math.abs(dy))player.dir=dx<0?'left':'right';else player.dir=dy<0?'up':'down';
  }
  if(interactLatch){interact();interactLatch=false;}
  const exit=nearestExit();
  hintEl.textContent=exit?exit.label:'WASD / Flechas para recorrer · Shift para correr';
}

function drawPlayer(screenX,screenY){
  // Deliberately a neutral traversal marker, not a competing art asset.
  ctx.save();
  ctx.translate(Math.round(screenX),Math.round(screenY));
  ctx.fillStyle='rgba(0,0,0,.38)';
  ctx.beginPath();ctx.ellipse(0,4,5,2,0,0,Math.PI*2);ctx.fill();
  ctx.strokeStyle='#fff4b0';ctx.lineWidth=2;
  ctx.beginPath();ctx.arc(0,0,5,0,Math.PI*2);ctx.stroke();
  ctx.fillStyle='#f2c94c';ctx.fillRect(-1,-1,3,3);
  ctx.restore();
}

function render(){
  const dpr=Math.min(2,devicePixelRatio||1);
  ctx.setTransform(dpr,0,0,dpr,0,0);
  ctx.imageSmoothingEnabled=false;
  ctx.fillStyle='#090b0e';ctx.fillRect(0,0,innerWidth,innerHeight);
  if(loading||!scene){
    ctx.fillStyle='#e8edf0';ctx.font='14px system-ui';ctx.fillText('Cargando Kenney…',24,40);return;
  }
  const img=loaded[sceneId];
  const maxScale=Math.max(2,Math.min(6,Math.floor(Math.min(innerWidth/240,innerHeight/144)*3)));
  const s=maxScale;
  const viewW=innerWidth/s,viewH=innerHeight/s;
  let camX=player.x-viewW/2,camY=player.y-viewH/2;
  camX=Math.max(0,Math.min(Math.max(0,worldW-viewW),camX));
  camY=Math.max(0,Math.min(Math.max(0,worldH-viewH),camY));
  ctx.save();
  ctx.scale(s,s);
  ctx.translate(-Math.floor(camX),-Math.floor(camY));
  ctx.drawImage(img,0,0);
  ctx.restore();
  const px=(player.x-camX)*s,py=(player.y-camY)*s;
  drawPlayer(px,py);

  const exit=nearestExit();
  if(exit){
    ctx.save();
    ctx.globalAlpha=.75+.25*Math.sin(performance.now()/130);
    ctx.strokeStyle='#fff4b0';ctx.lineWidth=2;
    ctx.strokeRect(Math.round(innerWidth/2-9),Math.round(innerHeight/2-12),18,18);
    ctx.restore();
  }
}

function frame(now){
  const dt=Math.min(.035,(now-last)/1000);last=now;
  update(dt);render();requestAnimationFrame(frame);
}

loadAll().catch(err=>{
  loading=false;
  hintEl.textContent=err.message;
  console.error(err);
});
requestAnimationFrame(frame);
})();
