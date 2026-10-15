'use strict';
/* =========================================================
   SÜPER AYI 3D — İngilizce Macerası
   three.js r128 + Web Speech + WebAudio — tamamen çevrimdışı
   ========================================================= */

/* ---------- yardımcılar ---------- */
const $=id=>document.getElementById(id);
const rnd=(a,b)=>a+Math.random()*(b-a);
const ri=(a,b)=>Math.floor(rnd(a,b+1));
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const pick=a=>a[Math.floor(Math.random()*a.length)];
const lerp=(a,b,t)=>a+(b-a)*t;
function lerpAngle(a,b,t){let d=(b-a)%(Math.PI*2);if(d>Math.PI)d-=Math.PI*2;if(d<-Math.PI)d+=Math.PI*2;return a+d*t;}
function shuffle(a){for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
const NTR=['','bir','iki','üç','dört','beş','altı','yedi','sekiz','dokuz','on'];
const NEN=['','one','two','three','four','five','six','seven','eight','nine','ten'];
function plural(en,n){if(n<=1)return en;if(en==='fish')return'fish';if(/[^aeiou]y$/.test(en))return en.slice(0,-1)+'ies';if(/(s|sh|ch|x|z)$/.test(en))return en+'es';return en+'s';}

/* ---------- kelime verisi ---------- */
const WORDS={
  animals:[
    {en:'cat',tr:'kedi',emoji:'🐱'},{en:'dog',tr:'köpek',emoji:'🐶'},{en:'bird',tr:'kuş',emoji:'🐦'},
    {en:'fish',tr:'balık',emoji:'🐟'},{en:'duck',tr:'ördek',emoji:'🦆'},{en:'frog',tr:'kurbağa',emoji:'🐸'},
    {en:'cow',tr:'inek',emoji:'🐮'},{en:'horse',tr:'at',emoji:'🐴'},{en:'pig',tr:'domuz',emoji:'🐷'},
    {en:'chicken',tr:'tavuk',emoji:'🐔'},{en:'rabbit',tr:'tavşan',emoji:'🐰'},{en:'lion',tr:'aslan',emoji:'🦁'}],
  fruits:[
    {en:'apple',tr:'elma',emoji:'🍎'},{en:'banana',tr:'muz',emoji:'🍌'},{en:'orange',tr:'portakal',emoji:'🍊'},
    {en:'grape',tr:'üzüm',emoji:'🍇'},{en:'strawberry',tr:'çilek',emoji:'🍓'},{en:'watermelon',tr:'karpuz',emoji:'🍉'},
    {en:'cherry',tr:'kiraz',emoji:'🍒'},{en:'pear',tr:'armut',emoji:'🍐'},{en:'lemon',tr:'limon',emoji:'🍋'},
    {en:'peach',tr:'şeftali',emoji:'🍑'},{en:'pineapple',tr:'ananas',emoji:'🍍'},{en:'kiwi',tr:'kivi',emoji:'🥝'}],
  colors:[
    {en:'red',tr:'kırmızı',hex:0xe53935},{en:'blue',tr:'mavi',hex:0x1e88e5},{en:'green',tr:'yeşil',hex:0x43a047},
    {en:'yellow',tr:'sarı',hex:0xfdd835},{en:'orange',tr:'turuncu',hex:0xfb8c00},{en:'purple',tr:'mor',hex:0x8e24aa},
    {en:'pink',tr:'pembe',hex:0xec407a},{en:'brown',tr:'kahverengi',hex:0x6d4c41},{en:'black',tr:'siyah',hex:0x212121},
    {en:'white',tr:'beyaz',hex:0xf5f5f5}],
  numbers:[
    {en:'one',tr:'bir',digit:'1'},{en:'two',tr:'iki',digit:'2'},{en:'three',tr:'üç',digit:'3'},
    {en:'four',tr:'dört',digit:'4'},{en:'five',tr:'beş',digit:'5'},{en:'six',tr:'altı',digit:'6'},
    {en:'seven',tr:'yedi',digit:'7'},{en:'eight',tr:'sekiz',digit:'8'},{en:'nine',tr:'dokuz',digit:'9'},{en:'ten',tr:'on',digit:'10'}],
};

/* ---------- bölgeler (SBA formülü: açık dünya + NPC görevleri) ---------- */
const ZONES=[
  {id:'forest',name:'ORMAN',enName:'FOREST',topic:'animals',cx:82,cz:82,patch:0x5fae4a,
   npc:{name:'TİLKİ',en:'Fox',kind:'fox',fur:0xe8833a,belly:0xffe9c8}},
  {id:'orchard',name:'MEYVE BAHÇESİ',enName:'ORCHARD',topic:'fruits',cx:-82,cz:82,patch:0x8bc34a,
   npc:{name:'TAVŞAN',en:'Rabbit',kind:'rabbit',fur:0xf2f2f2,belly:0xffffff}},
  {id:'colorhills',name:'RENK TEPELERİ',enName:'COLOR HILLS',topic:'colors',cx:82,cz:-82,patch:0xc58ad9,
   npc:{name:'ROBOT',en:'Robot',kind:'robot',fur:0x90a4ae,belly:0xd7dee2}},
  {id:'numbermeadow',name:'SAYI ÇAYIRI',enName:'NUMBER MEADOW',topic:'numbers',cx:-82,cz:-82,patch:0x64c2d8,
   npc:{name:'BAYKUŞ',en:'Owl',kind:'owl',fur:0x8d6e63,belly:0xd7c9b8}},
];
const HATS=[
  {id:'red',en:'RED',tr:'kırmızı',hex:0xe53935,css:'#e53935',price:5},
  {id:'blue',en:'BLUE',tr:'mavi',hex:0x1e88e5,css:'#1e88e5',price:5},
  {id:'green',en:'GREEN',tr:'yeşil',hex:0x43a047,css:'#43a047',price:5},
  {id:'yellow',en:'YELLOW',tr:'sarı',hex:0xfdd835,css:'#fdd835',price:5},
  {id:'purple',en:'PURPLE',tr:'mor',hex:0x8e24aa,css:'#8e24aa',price:8},
  {id:'pink',en:'PINK',tr:'pembe',hex:0xec407a,css:'#ec407a',price:8},
  {id:'orange',en:'ORANGE',tr:'turuncu',hex:0xfb8c00,css:'#fb8c00',price:8},
  {id:'crown',en:'CROWN',tr:'taç',hex:0xffc107,css:'#ffc107',price:15,crown:true},
];

/* ---------- kalıcı durum ---------- */
const LS='superayi3d_v1';
let S={name:'',lang:'tr',sfx:true,voice:true,hint:true,muted:false,coins:0,stars:0,
  words:{},hats:[],hat:null,missions:{},tut:false};
try{Object.assign(S,JSON.parse(localStorage.getItem(LS)||'{}'));}catch(e){}
function save(){try{localStorage.setItem(LS,JSON.stringify(S));}catch(e){}}

/* ---------- ses efektleri ---------- */
let AC=null;
function ensureAudio(){if(!AC){try{AC=new (window.AudioContext||window.webkitAudioContext)();}catch(e){}}
  if(AC&&AC.state==='suspended')AC.resume().catch(()=>{});}
addEventListener('pointerdown',ensureAudio);
function tone(f0,f1,dur,type,vol,delay){
  if(!S.sfx||S.muted||!AC)return;
  try{const t=AC.currentTime+(delay||0),o=AC.createOscillator(),g=AC.createGain();
    o.type=type||'sine';o.frequency.setValueAtTime(f0,t);
    if(f1&&f1!==f0)o.frequency.exponentialRampToValueAtTime(f1,t+dur);
    g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(vol||.14,t+.02);
    g.gain.exponentialRampToValueAtTime(.0001,t+dur);
    o.connect(g);g.connect(AC.destination);o.start(t);o.stop(t+dur+.05);}catch(e){}
}
const sfx={
  jump:()=>tone(320,540,.16,'square',.08), coin:()=>{tone(988,988,.07,'square',.1);tone(1319,1319,.12,'square',.1,.07);},
  collect:()=>{tone(660,660,.09,'sine',.18);tone(880,880,.12,'sine',.18,.09);},
  wrong:()=>tone(210,150,.16,'triangle',.12),
  star:()=>{tone(523,523,.1,'sine',.15);tone(659,659,.1,'sine',.15,.1);tone(784,784,.2,'sine',.15,.2);},
  pop:()=>tone(300,900,.18,'sine',.16), boing:()=>tone(150,430,.22,'sine',.16),
  click:()=>tone(520,520,.06,'sine',.08),
};

/* ---------- konuşma ---------- */
let voices=[];
function loadVo(){try{voices=speechSynthesis.getVoices()||[];}catch(e){}}
if('speechSynthesis' in window){loadVo();try{speechSynthesis.onvoiceschanged=loadVo;}catch(e){}}
function pickV(l2){const p=voices.filter(v=>v.lang&&v.lang.toLowerCase().startsWith(l2));
  return p.find(v=>/google/i.test(v.name))||p[0]||null;}
function speak(text,lang,queue){
  if(!S.voice||S.muted||!('speechSynthesis' in window))return;
  try{const u=new SpeechSynthesisUtterance(text);const lg=lang||(S.lang==='tr'?'tr-TR':'en-US');
    u.lang=lg;u.rate=lg.startsWith('en')?.85:.95;u.pitch=1.12;
    const v=pickV(lg.slice(0,2));if(v)u.voice=v;
    if(!queue)try{speechSynthesis.cancel();}catch(e){}
    speechSynthesis.speak(u);}catch(e){}
}
function sayWord(w){speak(w.en+'!','en-US');}
function sayTr(text){speak(text,'tr-TR');}

/* ---------- three.js sahne ---------- */
let renderer;
try{
  renderer=new THREE.WebGLRenderer({canvas:$('cv'),antialias:true});
}catch(e){ $('fail').classList.remove('hidden'); throw e; }
renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.75));
const scene=new THREE.Scene();
scene.background=new THREE.Color(0x8fd3f4);
scene.fog=new THREE.Fog(0x9fd9f2,60,210);
const camera=new THREE.PerspectiveCamera(58,1,.1,500);
function resize(){
  const w=innerWidth,h=innerHeight;
  renderer.setSize(w,h,false);
  camera.aspect=w/h;camera.updateProjectionMatrix();
  $('rotateHint').classList.toggle('hidden',!(h>w&&G.started));
}
addEventListener('resize',resize);

scene.add(new THREE.HemisphereLight(0xeaf6ff,0x8bc06a,.95));
const sun=new THREE.DirectionalLight(0xfff3d6,.8);sun.position.set(40,80,30);scene.add(sun);

/* ---------- texture / sprite yardımcıları ---------- */
function canvasTex(w,h,draw){
  const c=document.createElement('canvas');c.width=w;c.height=h;
  draw(c.getContext('2d'),w,h);
  const t=new THREE.CanvasTexture(c);t.minFilter=THREE.LinearFilter;return t;
}
function emojiSprite(ch,size){
  const t=canvasTex(128,128,(x)=>{x.font='96px "Segoe UI Emoji","Apple Color Emoji","Noto Color Emoji",sans-serif';
    x.textAlign='center';x.textBaseline='middle';x.fillText(ch,64,68);});
  const s=new THREE.Sprite(new THREE.SpriteMaterial({map:t,transparent:true}));
  s.scale.set(size,size,1);return s;
}
function textSprite(txt,opts){
  opts=opts||{};
  const t=canvasTex(256,96,(x)=>{
    x.font='bold 52px "Segoe UI",Arial,sans-serif';x.textAlign='center';x.textBaseline='middle';
    x.lineWidth=10;x.strokeStyle='rgba(62,39,35,.85)';x.strokeText(txt,128,50);
    x.fillStyle=opts.color||'#fff';x.fillText(txt,128,50);});
  const s=new THREE.Sprite(new THREE.SpriteMaterial({map:t,transparent:true}));
  s.scale.set(3.4,1.275,1);return s;
}
function digitSprite(d){
  const t=canvasTex(128,128,(x)=>{
    x.font='bold 88px "Segoe UI",Arial,sans-serif';x.textAlign='center';x.textBaseline='middle';
    x.lineWidth=12;x.strokeStyle='#4e342e';x.strokeText(d,64,68);x.fillStyle='#ffd54f';x.fillText(d,64,68);});
  const s=new THREE.Sprite(new THREE.SpriteMaterial({map:t,transparent:true}));
  s.scale.set(1.8,1.8,1);return s;
}
function markerSprite(kind){ // '!' veya '✓'
  const t=canvasTex(96,96,(x)=>{
    x.beginPath();x.arc(48,48,42,0,7);x.fillStyle=kind==='done'?'#43a047':'#ffca28';x.fill();
    x.lineWidth=5;x.strokeStyle='#fff';x.stroke();
    x.font='bold 58px Arial';x.textAlign='center';x.textBaseline='middle';
    x.fillStyle='#4e342e';x.fillText(kind==='done'?'✓':'!',48,52);});
  const s=new THREE.Sprite(new THREE.SpriteMaterial({map:t,transparent:true}));
  s.scale.set(1.6,1.6,1);return s;
}
function blobShadow(r){
  const t=canvasTex(64,64,(x)=>{const g=x.createRadialGradient(32,32,4,32,32,30);
    g.addColorStop(0,'rgba(0,0,0,.34)');g.addColorStop(1,'rgba(0,0,0,0)');x.fillStyle=g;x.fillRect(0,0,64,64);});
  const m=new THREE.Mesh(new THREE.PlaneGeometry(r*2,r*2),
    new THREE.MeshBasicMaterial({map:t,transparent:true,depthWrite:false}));
  m.rotation.x=-Math.PI/2;return m;
}

/* ---------- ayı modeli (3D ilkel şekillerden) ---------- */
function makeCritter(o){
  o=o||{};
  const fur=o.fur!==undefined?o.fur:0x8d6e63, belly=o.belly!==undefined?o.belly:0xd7c9b8;
  const kind=o.kind||'bear';
  const M=c=>new THREE.MeshLambertMaterial({color:c});
  const g=new THREE.Group();
  const parts={};
  const body=new THREE.Mesh(new THREE.SphereGeometry(.58,20,16),M(fur));
  body.scale.set(1,.92,.82);body.position.y=.85;g.add(body);parts.body=body;
  const tum=new THREE.Mesh(new THREE.SphereGeometry(.4,16,12),M(belly));
  tum.scale.set(.95,.85,.55);tum.position.set(0,.78,.28);g.add(tum);
  const headG=new THREE.Group();headG.position.set(0,1.62,.08);g.add(headG);parts.head=headG;
  const head=new THREE.Mesh(new THREE.SphereGeometry(.46,20,16),M(fur));headG.add(head);
  if(kind==='robot'){
    head.geometry=new THREE.BoxGeometry(.72,.62,.66);
    const ant=new THREE.Mesh(new THREE.CylinderGeometry(.03,.03,.5,8),M(0x78909c));
    ant.position.y=.55;headG.add(ant);
    const bulb=new THREE.Mesh(new THREE.SphereGeometry(.09,10,8),M(0xff5252));bulb.position.y=.82;headG.add(bulb);
  }
  const muz=new THREE.Mesh(new THREE.SphereGeometry(.2,14,10),M(belly));
  muz.scale.set(1.15,.8,kind==='fox'?1.5:.9);muz.position.set(0,-.1,.4);headG.add(muz);
  const nose=new THREE.Mesh(new THREE.SphereGeometry(.075,10,8),M(0x3e2723));
  nose.position.set(0,-.02,kind==='fox'?.72:.58);headG.add(nose);
  const eyeG=new THREE.SphereGeometry(kind==='owl'?.12:.075,10,8);
  [-1,1].forEach(s=>{
    const e=new THREE.Mesh(eyeG,M(0x212121));
    e.position.set(.17*s,kind==='owl'?.14:.12,.4);headG.add(e);
    if(kind==='owl'){const w=new THREE.Mesh(new THREE.SphereGeometry(.06,8,6),M(0xffffff));w.position.set(.17*s,.14,.44);headG.add(w);}
  });
  const earGeo=kind==='rabbit'?new THREE.SphereGeometry(.14,10,8):
    (kind==='fox'?new THREE.ConeGeometry(.14,.34,8):new THREE.SphereGeometry(.15,12,10));
  [-1,1].forEach(s=>{
    const e=new THREE.Mesh(earGeo,M(fur));
    if(kind==='rabbit'){e.scale.set(1,3.2,1);e.position.set(.2*s,.72,0);}
    else if(kind==='fox'){e.rotation.z=-.4*s;e.position.set(.28*s,.42,0);}
    else e.position.set(.3*s,.4,.02);
    headG.add(e);
    if(kind==='bear'){const inner=new THREE.Mesh(new THREE.SphereGeometry(.07,8,6),M(belly));
      inner.position.set(.3*s,.4,.1);headG.add(inner);}
  });
  const armGeo=new THREE.SphereGeometry(.16,10,8);armGeo.scale(1,1.7,1);
  parts.arms=[];
  [-1,1].forEach(s=>{
    const p=new THREE.Group();p.position.set(.58*s,1.22,.05);g.add(p);
    const m=new THREE.Mesh(armGeo,M(fur));m.position.y=-.22;p.add(m);
    if(kind==='robot')m.geometry=new THREE.BoxGeometry(.2,.5,.2);
    parts.arms.push(p);
  });
  const legGeo=new THREE.SphereGeometry(.18,10,8);legGeo.scale(1,1.5,1);
  parts.legs=[];
  [-1,1].forEach(s=>{
    const p=new THREE.Group();p.position.set(.24*s,.5,.02);g.add(p);
    const m=new THREE.Mesh(legGeo,M(fur));m.position.y=-.2;p.add(m);
    if(kind==='robot')m.geometry=new THREE.BoxGeometry(.22,.46,.24);
    parts.legs.push(p);
  });
  if(kind==='fox'){
    const tail=new THREE.Mesh(new THREE.SphereGeometry(.2,12,10),M(fur));
    tail.scale.set(1,1,2.4);tail.position.set(0,.85,-.62);g.add(tail);
    const tip=new THREE.Mesh(new THREE.SphereGeometry(.13,10,8),M(0xffffff));
    tip.position.set(0,.85,-1.05);g.add(tip);
  }
  if(kind==='owl'){
    [-1,1].forEach(s=>{const w=new THREE.Mesh(new THREE.SphereGeometry(.3,12,10),M(fur));
      w.scale.set(.5,1,1.3);w.position.set(.6*s,.9,0);g.add(w);});
  }
  const sh=blobShadow(1.15);sh.position.y=.02;g.add(sh);
  g.userData.parts=parts;
  return g;
}
function makeHatMesh(hat){
  const g=new THREE.Group();
  const M=c=>new THREE.MeshLambertMaterial({color:c});
  if(hat.crown){
    const b=new THREE.Mesh(new THREE.CylinderGeometry(.3,.34,.24,12),M(0xffc107));g.add(b);
    for(let i=0;i<5;i++){const p=new THREE.Mesh(new THREE.ConeGeometry(.07,.2,6),M(0xffca28));
      const a=i/5*Math.PI*2;p.position.set(Math.cos(a)*.28,.18,Math.sin(a)*.28);g.add(p);}
  }else{
    const c=new THREE.Mesh(new THREE.ConeGeometry(.3,.55,14),M(hat.hex));
    c.position.y=.22;g.add(c);
    const b=new THREE.Mesh(new THREE.SphereGeometry(.31,12,8),M(0xffffff));
    b.scale.set(1,.25,1);b.position.y=-.04;g.add(b);
  }
  return g;
}

/* ---------- oyun durumu ---------- */
const G={started:false,paused:false,lock:false,time:0,camYaw:0,
  items:[],coins:[],bubbles:[],peds:[],anims:[],usedWords:{},camMode:'orbit'};
const PL={x:0,z:14,y:0,vy:0,yaw:Math.PI,onG:true,jumps:0,coyote:0,speed:7,r:.6,squash:0};
const IN={x:0,y:0,jumpBuf:0,jumpHeld:false};

/* ---------- dünya inşası ---------- */
const obstacles=[]; // {x,z,r}
const platforms=[]; // {x,z,hw,hd,y}
const worldG=new THREE.Group();scene.add(worldG);
const matCache={};
const mat=c=>matCache[c]||(matCache[c]=new THREE.MeshLambertMaterial({color:c}));

function addTree(x,z,type){
  const g=new THREE.Group();
  const trunk=new THREE.Mesh(new THREE.CylinderGeometry(.28,.38,2.2,8),mat(0x8a5a33));
  trunk.position.y=1.1;g.add(trunk);
  if(type==='fruit'){
    const c=new THREE.Mesh(new THREE.SphereGeometry(1.5,14,12),mat(0x66bb6a));c.position.y=3;g.add(c);
    for(let i=0;i<4;i++){const f=new THREE.Mesh(new THREE.SphereGeometry(.28,10,8),mat(pick([0xef5350,0xffca28,0xff7043])));
      const a=rnd(0,6.28);f.position.set(Math.cos(a)*1.05,3+rnd(-.7,.7),Math.sin(a)*1.05);g.add(f);}
  }else if(type==='pine'){
    const c1=new THREE.Mesh(new THREE.ConeGeometry(1.5,2.4,10),mat(0x388e3c));c1.position.y=3;g.add(c1);
    const c2=new THREE.Mesh(new THREE.ConeGeometry(1.1,1.9,10),mat(0x43a047));c2.position.y=4.3;g.add(c2);
  }else{
    const c=new THREE.Mesh(new THREE.SphereGeometry(1.45,14,12),mat(0x4caf50));c.scale.y=1.15;c.position.y=3.1;g.add(c);
  }
  g.position.set(x,0,z);worldG.add(g);
  obstacles.push({x,z,r:1.05});
}
function addRock(x,z,s){
  const m=new THREE.Mesh(new THREE.SphereGeometry(s,8,6),mat(0x9e9e9e));
  m.scale.y=.7;m.position.set(x,s*.4,z);worldG.add(m);
  obstacles.push({x,z,r:s*.9});
}
function addPlatform(x,z,y,w,d){
  const m=new THREE.Mesh(new THREE.BoxGeometry(w,.5,d),mat(0xa9743f));
  m.position.set(x,y,z);worldG.add(m);
  const grass=new THREE.Mesh(new THREE.BoxGeometry(w,.14,d),mat(0x6abe4b));
  grass.position.set(x,y+.3,z);worldG.add(grass);
  platforms.push({x,z,hw:w/2,hd:d/2,y:y+.34});
}
function addBalloon(x,z,color){
  const st=new THREE.Mesh(new THREE.CylinderGeometry(.03,.03,3,6),mat(0xeeece0));
  st.position.set(x,1.5,z);worldG.add(st);
  const b=new THREE.Mesh(new THREE.SphereGeometry(.55,12,10),mat(color));
  b.scale.y=1.2;b.position.set(x,3.3,z);worldG.add(b);
}
function addSign(x,z,txt,rot){
  const post=new THREE.Mesh(new THREE.CylinderGeometry(.09,.09,1.8,8),mat(0x8a5a33));
  post.position.set(x,.9,z);worldG.add(post);
  const s=textSprite(txt,{color:'#fff'});s.scale.set(3,1.1,1);s.position.set(x,2.1,z);worldG.add(s);
  obstacles.push({x,z,r:.35});
}
function addFountain(){
  const g=new THREE.Group();
  const b1=new THREE.Mesh(new THREE.CylinderGeometry(4.4,4.8,.8,20),mat(0xafbdc4));b1.position.y=.4;g.add(b1);
  const w=new THREE.Mesh(new THREE.CylinderGeometry(3.9,3.9,.5,20),mat(0x4fc3f7));w.position.y=.75;g.add(w);
  const c=new THREE.Mesh(new THREE.CylinderGeometry(.5,.7,2,10),mat(0xafbdc4));c.position.y=1.7;g.add(c);
  const t=new THREE.Mesh(new THREE.SphereGeometry(.6,12,10),mat(0x81d4fa));t.position.y=2.9;g.add(t);
  g.position.set(0,0,0);worldG.add(g);
  obstacles.push({x:0,z:0,r:5.1});
}
let shopPos={x:16,z:-16};
function addShop(){
  const g=new THREE.Group();
  const base=new THREE.Mesh(new THREE.CylinderGeometry(3.4,3.6,.9,4),mat(0xd7ccc8));
  base.rotation.y=Math.PI/4;base.position.y=.45;g.add(base);
  const roof=new THREE.Mesh(new THREE.ConeGeometry(3.6,2.2,4),mat(0xff7043));
  roof.rotation.y=Math.PI/4;roof.position.y=2.2;g.add(roof);
  g.position.set(shopPos.x,0,shopPos.z);worldG.add(g);
  const s=emojiSprite('🎩',2.4);s.position.set(shopPos.x,4.4,shopPos.z);worldG.add(s);
  obstacles.push({x:shopPos.x,z:shopPos.z,r:3.4});
}
function buildWorld(){
  // zemin
  const ground=new THREE.Mesh(new THREE.CircleGeometry(175,48),mat(0x7cb356));
  ground.rotation.x=-Math.PI/2;worldG.add(ground);
  // bölge halıları + tabelalar
  ZONES.forEach(z=>{
    const p=new THREE.Mesh(new THREE.CircleGeometry(58,36),mat(z.patch));
    p.rotation.x=-Math.PI/2;p.position.set(z.cx,.03,z.cz);worldG.add(p);
    const dir=Math.atan2(-z.cz,-z.cx);
    addSign(z.cx+Math.cos(dir)*46,z.cz+Math.sin(dir)*46,z.name,dir);
  });
  // yollar
  ZONES.forEach(z=>{
    const len=Math.hypot(z.cx,z.cz);
    const path=new THREE.Mesh(new THREE.PlaneGeometry(5,len-40),mat(0xd9c89a));
    path.rotation.x=-Math.PI/2;
    path.rotation.z=Math.atan2(-z.cx,-z.cz);
    path.position.set(z.cx/2,.06,z.cz/2);worldG.add(path);
  });
  // çeşme + dükkan
  addFountain();addShop();
  // orman
  for(let i=0;i<24;i++){const a=rnd(0,6.28),d=rnd(14,54);
    const x=82+Math.cos(a)*d,z=82+Math.sin(a)*d;
    if(Math.hypot(x-82,z-82)>13)addTree(x,z,pick(['pine','round','pine']));}
  // bahçe (meyve ağaçları)
  for(let i=0;i<13;i++){const a=rnd(0,6.28),d=rnd(12,52);
    addTree(-82+Math.cos(a)*d,82+Math.sin(a)*d,'fruit');}
  // renk tepeleri
  for(let i=0;i<9;i++){const a=rnd(0,6.28),d=rnd(10,50);
    const h=rnd(2.5,6),c=new THREE.Mesh(new THREE.ConeGeometry(rnd(3,5.5),h,12),
      mat(pick([0xf48fb1,0xfff176,0x80deea,0xb39ddb,0xffcc80])));
    const x=82+Math.cos(a)*d,z=-82+Math.sin(a)*d;
    c.position.set(x,h/2,z);worldG.add(c);obstacles.push({x,z,r:2.6});}
  for(let i=0;i<12;i++){const a=rnd(0,6.28),d=rnd(6,50);
    addBalloon(82+Math.cos(a)*d,-82+Math.sin(a)*d,pick([0xef5350,0x42a5f5,0x66bb6a,0xab47bc,0xffee58]));}
  // sayı çayırı: rakam tabelaları + yıldız direkleri
  for(let i=0;i<10;i++){const a=i/10*Math.PI*2,d=rnd(20,48);
    addSign(-82+Math.cos(a)*d,-82+Math.sin(a)*d,String(i+1));}
  // kayalar
  for(let i=0;i<14;i++){const a=rnd(0,6.28),d=rnd(95,150);
    addRock(Math.cos(a)*d,Math.sin(a)*d,rnd(.8,2));}
  // kenar ağaçları
  for(let i=0;i<44;i++){const a=i/44*Math.PI*2;
    addTree(Math.cos(a)*168+rnd(-6,6),Math.sin(a)*168+rnd(-6,6),pick(['pine','round']));}
  // platformlar
  [[70,64,2.6],[95,95,3.4],[60,100,3],[-95,60,2.8],[-60,100,3.5],[-95,95,4.2],[64,-95,3],[100,-60,2.6],[-64,-64,3.4],[-100,-95,4]]
    .forEach(p=>addPlatform(p[0],p[1],p[2],rnd(4,6),rnd(3.4,4.6)));
  // bulutlar
  for(let i=0;i<12;i++){
    const s=canvasTex(128,64,(x)=>{x.fillStyle='rgba(255,255,255,.92)';
      [[36,40,22],[64,32,26],[92,42,20],[52,48,18],[80,48,16]].forEach(c=>{
        x.beginPath();x.arc(c[0],c[1],c[2],0,7);x.fill();});});
    const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:s,transparent:true}));
    sp.scale.set(22,9,1);sp.position.set(rnd(-160,160),rnd(26,44),rnd(-160,160));
    sp.userData.drift=rnd(.2,.6);worldG.add(sp);G.anims.push({o:sp,cloud:true});
  }
}

/* ---------- oyuncu (ayı) ---------- */
let bear,hatt=null;
function buildPlayer(){
  bear=makeCritter({kind:'bear',fur:0x8d6e63,belly:0xffcc80});
  bear.position.set(PL.x,0,PL.z);
  scene.add(bear);
  equipHat(S.hat,true);
}
function equipHat(id,silent){
  if(hatt){bear.remove(hatt);hatt=null;}
  S.hat=id;save();
  const hd=HATS.find(h=>h.id===id);
  if(hd){hatt=makeHatMesh(hd);hatt.position.set(0,.36,0);bear.userData.parts.head.add(hatt);}
  if(!silent&&hd){speak(`${hd.en} hat!`,'en-US');}
}
/* ---------- NPC'ler ---------- */
const npcs=[];
function buildNPCs(){
  ZONES.forEach(z=>{
    const dir=Math.atan2(-z.cz,-z.cx); // merkeze baksın
    const g=makeCritter({kind:z.npc.kind,fur:z.npc.fur,belly:z.npc.belly});
    const nx=z.cx+Math.cos(dir)*10,nz=z.cz+Math.sin(dir)*10;
    g.position.set(nx,0,nz);g.rotation.y=dir+Math.PI;
    scene.add(g);
    const mk=markerSprite('!');mk.position.set(0,3.1,0);g.add(mk);
    const npc={zone:z,g,mk,x:nx,z:nz,cool:0,parts:g.userData.parts};
    npcs.push(npc);obstacles.push({x:nx,z:nz,r:1.3});
  });
}
function updateNPCMarkers(){
  npcs.forEach(n=>{
    const done=(S.missions[n.zone.id]||0)>=MISSION_CNT;
    n.mk.visible=!done;
  });
}
const MISSION_CNT=6;

/* ---------- eşyalar ---------- */
function freeSpotInZone(z,minD,others){
  for(let t=0;t<40;t++){
    const a=rnd(0,6.28),d=rnd(6,50);
    const x=z.cx+Math.cos(a)*d,zz=z.cz+Math.sin(a)*d;
    if(obstacles.some(o=>Math.hypot(x-o.x,zz-o.z)<o.r+1.6))continue;
    if(others.some(o=>Math.hypot(x-o.x,zz-o.z)<minD))continue;
    return {x,z:zz};
  }
  // garantili yedek: NPC çevresinde halka
  const i=others.length;
  const a=i*2.4,d=8+(i%3)*4;
  return {x:z.cx+Math.cos(a)*d,z:z.cz+Math.sin(a)*d};
}
function makeWordVisual(topic,w){
  const g=new THREE.Group();
  if(topic==='colors'){
    const m=new THREE.Mesh(new THREE.SphereGeometry(.75,16,12),
      new THREE.MeshLambertMaterial({color:w.hex}));
    g.add(m);
  }else if(topic==='numbers'){
    g.add(emojiSprite('⭐',1.9));
  }else g.add(emojiSprite(w.emoji,2.1));
  const lbl=textSprite(w.en.toUpperCase());lbl.position.y=1.7;g.add(lbl);
  return g;
}
function spawnWordItem(zone,w,isTarget){
  const others=G.items.map(i=>({x:i.g.position.x,z:i.g.position.z}));
  const spot=freeSpotInZone(zone,7,others);
  const g=makeWordVisual(zone.topic,w);
  g.position.set(spot.x,1.25,spot.z);
  scene.add(g);
  let ring=null;
  if(isTarget&&S.hint){
    ring=new THREE.Mesh(new THREE.TorusGeometry(1.25,.09,8,28),
      new THREE.MeshBasicMaterial({color:0xffd600,transparent:true,opacity:.85}));
    ring.rotation.x=Math.PI/2;ring.position.set(spot.x,.1,spot.z);
    scene.add(ring);
  }
  const it={g,w,zone,isTarget,got:false,ring,baseY:1.25,ph:rnd(0,6.28)};
  G.items.push(it);
  return it;
}
/* GARANTİLİ görev eşyası: hedef sayısı her zaman yerleşir */
function spawnMissionItems(zone,target,count,distractors){
  for(let i=0;i<count;i++)spawnWordItem(zone,target,true);
  distractors.forEach(dw=>{
    const w=WORDS[zone.topic].find(x=>x.en===dw);
    if(w){spawnWordItem(zone,w,false);spawnWordItem(zone,w,false);}
  });
}
function clearItems(){G.items.forEach(it=>{scene.remove(it.g);if(it.ring)scene.remove(it.ring);});G.items=[];}

/* ---------- paralar & bal ---------- */
const coinGeo=new THREE.CylinderGeometry(.45,.45,.09,18);
const coinMat=new THREE.MeshLambertMaterial({color:0xffca28,emissive:0x795548});
function spawnCoin(x,z,mission){
  const m=new THREE.Mesh(coinGeo,mission?new THREE.MeshLambertMaterial({color:0xffb300,emissive:0x8d6e63}):coinMat);
  m.position.set(x,1,z);scene.add(m);
  G.coins.push({m,x,z,mission:!!mission,taken:false,respawn:0});
}
function seedWorldCoins(){
  ZONES.forEach(z=>{
    for(let i=0;i<8;i++){const s=freeSpotInZone(z,6,[]);spawnCoin(s.x,s.z);}
    // yol üstü paralar
    for(let i=0;i<5;i++){const t=(i+1)/6;spawnCoin(z.cx*t,z.cz*t);}
  });
  // bal kavanozları
  for(let i=0;i<6;i++){
    const z=pick(ZONES);const s=freeSpotInZone(z,20,[]);
    const sp=emojiSprite('🍯',1.7);sp.position.set(s.x,1.1,s.z);scene.add(sp);
    G.items.push({g:sp,w:{en:'honey',tr:'bal',emoji:'🍯'},zone:z,isTarget:false,honey:true,got:false,ring:null,baseY:1.1,ph:rnd(0,6.28)});
  }
}

/* ---------- kurtarma balonları (SBA: hapish arkadaşlar) ---------- */
function spawnBubble(zone,w){
  const s=freeSpotInZone(zone,26,[]);
  const g=new THREE.Group();
  const sph=new THREE.Mesh(new THREE.SphereGeometry(2.1,20,16),
    new THREE.MeshLambertMaterial({color:0xce93d8,transparent:true,opacity:.32}));
  g.add(sph);
  const friend=makeCritter({kind:'bear',fur:pick([0xffb74d,0x81c784,0x64b5f6,0xba68c8,0xf06292]),belly:0xfff3e0});
  friend.scale.set(.55,.55,.55);g.add(friend);
  g.position.set(s.x,2.6,s.z);scene.add(g);
  G.bubbles.push({g,w,zone,popped:false,friend,ph:rnd(0,6.28)});
}
function clearBubbles(){G.bubbles.forEach(b=>scene.remove(b.g));G.bubbles=[];}

/* ---------- göster-pedestalları (SHOWME) ---------- */
function spawnPedestals(zone,correct){
  clearPeds();
  const others=shuffle(WORDS[zone.topic].filter(w=>w!==correct)).slice(0,3);
  const list=shuffle([correct,...others]);
  const baseA=Math.atan2(-zone.cz,-zone.cx);
  list.forEach((w,i)=>{
    const a=baseA+Math.PI+(i-1.5)*.7;
    const x=zone.cx+Math.cos(a)*12,z=zone.cz+Math.sin(a)*12;
    const ped=new THREE.Mesh(new THREE.CylinderGeometry(1.05,1.25,.7,14),mat(0x9e9e9e));
    ped.position.set(x,.35,z);scene.add(ped);
    const vis=makeWordVisual(zone.topic,w);
    vis.position.set(x,1.9,z);scene.add(vis);
    obstacles.push({x,z,r:1.1,ped:true});
    G.peds.push({w,correct:w===correct,x,z,vis,ped});
  });
}
function clearPeds(){
  G.peds.forEach(p=>{scene.remove(p.vis);scene.remove(p.ped);
    const oi=obstacles.findIndex(o=>o.x===p.x&&o.z===p.z&&o.ped);if(oi>=0)obstacles.splice(oi,1);});
  G.peds=[];
}

/* ---------- görev sistemi ---------- */
let MST=null; // {zone,type,word,count,got,phase}
const usedW={}; // zone.id -> [en]
function pickWord(zone){
  if(!usedW[zone.id])usedW[zone.id]=[];
  const pool=WORDS[zone.topic].filter(w=>!usedW[zone.id].includes(w.en));
  const w=pool.length?pick(pool):pick(WORDS[zone.topic]);
  usedW[zone.id].push(w.en);
  if(usedW[zone.id].length>WORDS[zone.topic].length-2)usedW[zone.id]=[];
  return w;
}
function missionPlan(idx){
  return [
    {type:'collect',count:3},
    {type:'showme'},
    {type:'collect',count:4},
    {type:'coins',count:8},
    {type:'rescue'},
    {type:'collect',count:5},
  ][idx];
}
function mDone(zone){return S.missions[zone.id]||0;}

/* diyalog */
const DLG={open:false,steps:[],i:0,done:null};
function showDlg(npcName,steps,onDone){
  DLG.open=true;DLG.steps=steps;DLG.i=0;DLG.done=onDone||null;
  G.lock=true;
  $('dlgName').textContent=npcName;
  renderDlgStep();
  $('dlg').classList.remove('hidden');
}
function renderDlgStep(){
  const st=DLG.steps[DLG.i];
  $('dlgEn').innerHTML=st.en;
  $('dlgTr').textContent=st.tr||'';
  $('dlgBtn').textContent=DLG.i<DLG.steps.length-1?'DEVAM ➜':'TAMAM ✔';
  if(st.tr) sayTr(st.tr);
  if(st.w)speak(st.w.en+'!','en-US',true);
}
function advDlg(){
  sfx.click();
  if(DLG.i<DLG.steps.length-1){DLG.i++;renderDlgStep();}
  else{
    $('dlg').classList.add('hidden');DLG.open=false;G.lock=false;
    const d=DLG.done;DLG.done=null;if(d)d();
  }
}
$('dlgBtn').addEventListener('click',advDlg);

function hi(){return S.name?(' '+S.name):' hero';}
function offerMission(npc){
  const z=npc.zone;
  const idx=mDone(z);
  const plan=missionPlan(idx);
  let w=pickWord(z);
  // sayılar için toplama görevi 3-5 aralığında olsun (kelime=sayı ile tutarlı)
  if(plan.type==='collect'&&z.topic==='numbers'){
    const np=WORDS.numbers.filter(x=>parseInt(x.digit)>=3&&parseInt(x.digit)<=5);
    w=pick(np);
  }
  const steps=[];
  if(idx===0)steps.push({en:`Hi${hi()}! I'm ${z.npc.en}! Welcome to the <b>${z.enName}</b>!`,
    tr:`Merhaba${S.name?' '+S.name:''}! Ben ${z.npc.name.toLowerCase()}!`});
  if(plan.type==='collect'){
    const n=z.topic==='numbers'?parseInt(w.digit):plan.count;
    steps.push({en:`Can you find <b>${n} ${plural(w.en,n).toUpperCase()}</b> ${w.emoji||(z.topic==='numbers'?'⭐':'')} for me?`,
      tr:`${NTR[n]} tane <b>${z.topic==='numbers'?'yıldız':w.tr}</b> bulur musun?`,w});
  }else if(plan.type==='showme'){
    steps.push({en:`Show me the <b>${w.en.toUpperCase()}</b>! Go and touch it!`,
      tr:`Bana <b>${w.tr}</b>yı göster! Git, dokun!`,w});
  }else if(plan.type==='coins'){
    steps.push({en:`Oh no! I lost <b>${plan.count} coins</b> 🪙! Can you find them?`,
      tr:`Ay! <b>${plan.count} altınımı</b> kaybettim! Bulur musun?`});
  }else if(plan.type==='rescue'){
    steps.push({en:`My friend is trapped in a bubble 🫧! Say the magic word: <b>${w.en.toUpperCase()}</b>!`,
      tr:`Dostum balonda sıkıştı! Sihirli kelime: <b>${w.en.toUpperCase()}</b>!`,w});
  }
  showDlg(z.npc.name,steps,()=>activateMission(z,plan,w));
}
function activateMission(z,plan,w){
  MST={zone:z,type:plan.type,word:w,count:plan.count||0,got:0,phase:'active'};
  clearItems();clearPeds();
  if(plan.type==='collect'){
    let cnt=plan.count;
    if(z.topic==='numbers')cnt=clamp(parseInt(w.digit)||3,3,5);
    MST.count=cnt;
    const dis=shuffle(WORDS[z.topic].filter(x=>x.en!==w.en)).slice(0,2).map(x=>x.en);
    spawnMissionItems(z,w,cnt,dis);
    setMissionHUD();
  }else if(plan.type==='showme'){
    spawnPedestals(z,w);
    setMissionHUD();
  }else if(plan.type==='coins'){
    for(let i=0;i<plan.count;i++){const s=freeSpotInZone(z,7,[]);spawnCoin(s.x,s.z,true);}
    setMissionHUD();
  }else if(plan.type==='rescue'){
    spawnBubble(z,w);
    setMissionHUD();
  }
}
function setMissionHUD(){
  if(!MST){$('mZone').textContent='🎉 KEŞFE BAŞLA';
    $('mTask').innerHTML='"!" işaretli bir arkadaşa git <small>visit a friend with "!"</small>';
    $('mProg').textContent='';return;}
  const z=MST.zone,w=MST.word;
  let icon=z.topic==='colors'?'🎨':(w.emoji||(z.topic==='numbers'?'⭐':''));
  $('mZone').textContent=z.name+(MST.phase==='turnin'?' — GÖREV TAMAM!':'');
  if(MST.type==='collect'){
    $('mTask').innerHTML=`${icon} <b style="color:#e91e63">${w.en.toUpperCase()}</b> — ${w.tr} topla`;
    $('mProg').textContent='●'.repeat(MST.got)+'○'.repeat(Math.max(0,MST.count-MST.got))+` ${MST.got}/${MST.count}`;
  }else if(MST.type==='showme'){
    $('mTask').innerHTML=`${icon} <b style="color:#e91e63">${w.en.toUpperCase()}</b> — ${w.tr}ya dokun!`;
    $('mProg').textContent='';
  }else if(MST.type==='coins'){
    $('mTask').innerHTML=`🪙 Kayıp altınları topla!`;
    $('mProg').textContent=`${MST.got}/${MST.count}`;
  }else if(MST.type==='rescue'){
    $('mTask').innerHTML=`🫧 Balonu patlat: <b style="color:#e91e63">${w.en.toUpperCase()}</b>`;
    $('mProg').textContent='';
  }
  if(MST.phase==='turnin')$('mProg').textContent='➜ '+z.npc.name+' yanına git!';
}
function completeMission(rewardCoins){
  const z=MST.zone,w=MST.word;
  S.coins+=rewardCoins;S.stars+=1;
  if(MST.type!=='coins')S.words[w.en]=1;
  S.missions[z.id]=(S.missions[z.id]||0)+1;
  save();updHUD();
  sfx.star();
  const wasLast=S.missions[z.id]===MISSION_CNT;
  toast(`✅ GÖREV TAMAM! +${rewardCoins} 🪙 ⭐`);
  floatyWord((w.emoji||(z.topic==='colors'?'🎨':'⭐'))+' '+w.en.toUpperCase()+'!');
  speak('Great job!','en-US');
  MST=null;setMissionHUD();updateNPCMarkers();
  if(wasLast){
    setTimeout(()=>{toast(`🏆 ${z.name} TAMAMLANDI! +20 🪙`);S.coins+=20;save();updHUD();speak('Amazing! Zone complete!','en-US');},900);
  }
}
function turnIn(){
  const z=MST.zone,w=MST.word,n=MST.count;
  const reward=8+(S.missions[z.id]||0)*2;
  showDlg(z.npc.name,[
    {en:`Thank you${hi()}! You found the <b>${plural(w.en,n).toUpperCase()}</b>! 🎉`,
     tr:`Sağ ol! Onları gerçekten buldun!`,w},
    {en:`<b>+${reward} coins</b> for you! ⭐`,tr:`Sana ${reward} altın! Aferin!`},
  ],()=>completeMission(reward));
  MST.phase='done';
}

/* ---------- bildirimler ---------- */
function toast(t){
  const d=document.createElement('div');d.className='toastItem';d.textContent=t;
  $('toast').appendChild(d);setTimeout(()=>d.remove(),3200);
}
function floatyWord(t){
  const old=$('floaty');if(old)old.remove();
  const d=document.createElement('div');d.id='floaty';d.textContent=t;
  document.body.appendChild(d);setTimeout(()=>d.remove(),1150);
}

/* ---------- kurtarma kelime seçimi ---------- */
function openChallenge(bubble){
  const z=MST?MST.zone:bubble.zone;
  const correct=bubble.w;
  const others=shuffle(WORDS[z.topic].filter(w=>w!==correct)).slice(0,2);
  const list=shuffle([correct,...others]);
  $('chTitle').textContent=`Sihirli kelime: ${correct.en.toUpperCase()} — ${correct.tr} hangisi?`;
  const cc=$('chCards');cc.innerHTML='';
  let done=false;
  list.forEach(w=>{
    const b=document.createElement('button');b.className='ch-card';
    let inner;
    if(z.topic==='colors')inner=`<div class="b" style="background:#${w.hex.toString(16).padStart(6,'0')}"></div>`;
    else if(z.topic==='numbers')inner=`<div class="d">${w.digit}</div>`;
    else inner=`<div class="e">${w.emoji}</div>`;
    b.innerHTML=inner+`<div class="w">${w.en.toUpperCase()}</div>`;
    b.addEventListener('pointerdown',e=>{
      e.preventDefault();ensureAudio();
      if(done)return;
      if(w===correct){
        done=true;b.classList.add('right');sfx.pop();sfx.star();
        popBubble(bubble);
        setTimeout(()=>{$('challenge').classList.add('hidden');},900);
      }else{
        b.classList.remove('wrong');void b.offsetWidth;b.classList.add('wrong');sfx.wrong();
        speak(`That's ${w.en}! Try again!`,'en-US');
      }
    });
    cc.appendChild(b);
  });
  $('challenge').classList.remove('hidden');
  G.lock=true;
  sayTr(`Sihirli kelime: ${correct.tr}! Doğru olanı seç!`);
  speak(correct.en+'!','en-US',true);
  // kapatınca kilidi aç
  const iv=setInterval(()=>{if($('challenge').classList.contains('hidden')){clearInterval(iv);G.lock=false;}},200);
}
function popBubble(bubble){
  bubble.popped=true;
  G.anims.push({o:bubble.g,pop:1});
  const w=bubble.w;
  S.words[w.en]=1;save();
  floatyWord((w.emoji||'⭐')+' '+w.en.toUpperCase()+'!');
  speak(`Yes! ${w.en}! You saved my friend!`,'en-US');
  if(MST&&MST.type==='rescue'&&MST.word===w){
    const z=MST.zone;
    completeMission(10);
  }
  toast('🫧 Arkadaş kurtarıldı! 🎉');
}

/* ---------- dükkan ---------- */
function openShop(){
  G.lock=true;renderShop();$('shop').classList.remove('hidden');
}
function renderShop(){
  $('shopCoins').textContent='🪙 '+S.coins;
  const g=$('shopCards');g.innerHTML='';
  HATS.forEach(h=>{
    const owned=S.hats.includes(h.id),worn=S.hat===h.id;
    const b=document.createElement('button');
    b.className='hat-card'+(owned?' owned':'')+(worn?' worn':'');
    b.innerHTML=`<div class="cone" style="border-bottom-color:${h.css}"></div>
      <div class="nm">${h.en}${h.crown?' 👑':''}</div>
      <div class="pr">${owned?'SAHİP':'🪙 '+h.price}</div>
      <div class="st">${worn?'GİYİLDİ ✔':(owned?'GİY':'SATIN AL')}</div>`;
    b.addEventListener('pointerdown',e=>{
      e.preventDefault();ensureAudio();
      if(!owned){
        if(S.coins>=h.price){
          S.coins-=h.price;S.hats.push(h.id);S.hat=h.id;
          equipHat(h.id);sfx.coin();sfx.star();
          toast(`🎩 ${h.en} şapka alındı!`);
          sayTr(`${h.tr} şapka aldın!`);
          speak(`${h.en} hat! Nice!`,'en-US',true);
        }else{
          sfx.wrong();toast(`🪙 Yetersiz altın — ${h.price} gerekli`);
          sayTr(`Daha ${NTR[Math.min(h.price,10)]} altın lazım!`);
        }
      }else{
        equipHat(worn?null:h.id);sfx.click();
        if(!worn)speak(`${h.en} hat!`,'en-US');
      }
      save();renderShop();updHUD();
    });
    g.appendChild(b);
  });
}
$('btnShopClose').addEventListener('click',()=>{$('shop').classList.add('hidden');G.lock=false;});

/* ---------- kelime defteri ---------- */
function renderWordbook(){
  const g=$('wbGrid');g.innerHTML='';
  Object.keys(WORDS).forEach(topic=>{
    const h=document.createElement('div');h.className='wb-h';
    const tn={animals:'🐱 HAYVANLAR',fruits:'🍎 MEYVELER',colors:'🎨 RENKLER',numbers:'🔢 SAYILAR'}[topic];
    const got=WORDS[topic].filter(w=>S.words[w.en]).length;
    h.textContent=`${tn} — ${got}/${WORDS[topic].length}`;
    h.style.gridColumn='1/-1';g.appendChild(h);
    WORDS[topic].forEach(w=>{
      const known=S.words[w.en];
      const d=document.createElement('div');d.className='wb-chip'+(known?'':' no');
      let ic=w.emoji||(topic==='colors'?`<span style="display:inline-block;width:16px;height:16px;border-radius:50%;background:#${(w.hex||0).toString(16).padStart(6,'0')}"></span>`:`<b>${w.digit}</b>`);
      d.innerHTML=`${ic} ${known?w.en.toUpperCase():'???'} <small>${known?w.tr:'???'}</small>`;
      g.appendChild(d);
    });
  });
}
['btnWords','btnPauseWords'].forEach(id=>$(id).addEventListener('click',()=>{
  sfx.click();renderWordbook();$('wordbook').classList.remove('hidden');}));
$('btnWbClose').addEventListener('click',()=>{$('wordbook').classList.add('hidden');});

/* ---------- HUD ---------- */
function updHUD(){
  $('coinsHud').textContent='🪙 '+S.coins;
  $('starsHud').textContent='⭐ '+S.stars;
}

/* ---------- girdi: joystick + klavye ---------- */
(function(){
  const joy=$('joy'),knob=$('joyKnob');
  let jid=null;
  function setFromEvent(e){
    const r=joy.getBoundingClientRect();
    let dx=(e.clientX-(r.left+r.width/2))/(r.width/2);
    let dy=(e.clientY-(r.top+r.height/2))/(r.height/2);
    const m=Math.hypot(dx,dy);if(m>1){dx/=m;dy/=m;}
    IN.x=dx;IN.y=dy;
    knob.style.left=(50+dx*32)+'%';knob.style.top=(50+dy*32)+'%';
  }
  joy.addEventListener('pointerdown',e=>{e.preventDefault();ensureAudio();
    jid=e.pointerId;try{joy.setPointerCapture(jid);}catch(err){}setFromEvent(e);});
  joy.addEventListener('pointermove',e=>{if(e.pointerId===jid)setFromEvent(e);});
  const rel=e=>{if(e.pointerId!==jid)return;jid=null;IN.x=0;IN.y=0;
    knob.style.left='50%';knob.style.top='50%';};
  joy.addEventListener('pointerup',rel);joy.addEventListener('pointercancel',rel);
})();
(function(){
  const b=$('btnJump');
  const dn=e=>{e.preventDefault();ensureAudio();IN.jumpBuf=8;IN.jumpHeld=true;};
  const up=e=>{if(e)e.preventDefault();IN.jumpHeld=false;};
  b.addEventListener('pointerdown',dn);b.addEventListener('pointerup',up);
  b.addEventListener('pointercancel',up);
})();
const K={l:0,r:0,u:0,d:0};
addEventListener('keydown',e=>{
  if(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code))e.preventDefault();
  ensureAudio();
  if(e.code==='ArrowLeft'||e.code==='KeyA')K.l=1;
  if(e.code==='ArrowRight'||e.code==='KeyD')K.r=1;
  if(e.code==='ArrowUp'||e.code==='KeyW')K.u=1;
  if(e.code==='ArrowDown'||e.code==='KeyS')K.d=1;
  if(e.code==='Space'&&!e.repeat){IN.jumpBuf=8;IN.jumpHeld=true;}
  if(e.code==='KeyM')toggleMute();
  if((e.code==='KeyP'||e.code==='Escape')&&G.started&&!DLG.open)setPause(!G.paused);
});
addEventListener('keyup',e=>{
  if(e.code==='ArrowLeft'||e.code==='KeyA')K.l=0;
  if(e.code==='ArrowRight'||e.code==='KeyD')K.r=0;
  if(e.code==='ArrowUp'||e.code==='KeyW')K.u=0;
  if(e.code==='ArrowDown'||e.code==='KeyS')K.d=0;
  if(e.code==='Space')IN.jumpHeld=false;
});

/* ---------- fizik & hareket ---------- */
/* Tüm hızlar SANİYE biriminde (u/s). dtf = 60fps kare sayısı, dts = saniye. */
function updPlayer(dtf){
  const dts=dtf/60;
  let ix=IN.x+ (K.r-K.l), iy=-(IN.y)+(K.u-K.d);
  if(G.lock||G.paused||DLG.open){ix=0;iy=0;}
  const m=Math.hypot(ix,iy);if(m>1){ix/=m;iy/=m;}
  // kamera uzayında hareket
  const fx=-Math.sin(G.camYaw),fz=-Math.cos(G.camYaw);
  const rx=-fz,rz=fx;
  const vx=(fx*iy+rx*ix)*PL.speed,vz=(fz*iy+rz*ix)*PL.speed;
  PL.x+=vx*dts;PL.z+=vz*dts;
  if(m>.08){
    const ty=Math.atan2(vx,vz);
    PL.yaw=lerpAngle(PL.yaw,ty,Math.min(1,.18*dtf));
    // kamera hareket yönünün ARKASINA otursun: hedef = yön + π
    // (işaret burada ters olsaydı kamera oyuncu çevresinde sonsuz dönerdi)
    G.camYaw=lerpAngle(G.camYaw,ty+Math.PI,Math.min(1,.045*dtf));
  }
  // dünya sınırı
  const d0=Math.hypot(PL.x,PL.z);
  if(d0>152){PL.x*=152/d0;PL.z*=152/d0;}
  // engeller (daire itme)
  for(const o of obstacles){
    const dx=PL.x-o.x,dz=PL.z-o.z,dd=Math.hypot(dx,dz),rr=o.r+PL.r;
    if(dd<rr&&dd>.0001){PL.x=o.x+dx/dd*rr;PL.z=o.z+dz/dd*rr;}
  }
  // düşey — platformlar yalnız ÜSTÜNDEN gelirken destekler (altından geçilir)
  const prevY=PL.y;
  PL.vy-=30*dts;if(PL.vy<-30)PL.vy=-30;
  PL.y+=PL.vy*dts;
  let gy=0;
  for(const p of platforms){
    if(Math.abs(PL.x-p.x)<=p.hw+PL.r*.5&&Math.abs(PL.z-p.z)<=p.hd+PL.r*.5&&prevY>=p.y-.05)gy=Math.max(gy,p.y);
  }
  PL.onG=false;
  if(PL.vy<=0&&PL.y<=gy){PL.y=gy;PL.vy=0;PL.onG=true;PL.jumps=0;
    if(!PL.wasG){PL.squash=1;tone(140,90,.08,'sine',.06);}}
  PL.wasG=PL.onG;
  if(PL.y<-10){PL.x=0;PL.z=14;PL.y=0;PL.vy=0;} // güvenlik ağı
  if(PL.onG)PL.coyote=8;else PL.coyote=Math.max(0,PL.coyote-dtf);
  IN.jumpBuf=Math.max(0,IN.jumpBuf-dtf);
  if(IN.jumpBuf>0&&!G.lock&&!DLG.open){
    if(PL.coyote>0){PL.vy=12.5;PL.jumps=1;PL.coyote=0;IN.jumpBuf=0;PL.squash=.6;sfx.jump();}
    else if(PL.jumps<2){PL.vy=11;PL.jumps=2;IN.jumpBuf=0;sfx.jump();}
  }
  if(!IN.jumpHeld&&PL.vy>4)PL.vy=4;
  PL.squash*=Math.pow(.87,dtf);
  // ayı mesh
  bear.position.set(PL.x,PL.y,PL.z);
  bear.rotation.y=PL.yaw;
  const pr=bear.userData.parts;
  const run=m>.08&&PL.onG;
  const t=G.time/1000;
  const sw=run?Math.sin(t*11)*.75:0;
  pr.legs[0].rotation.x=sw;pr.legs[1].rotation.x=-sw;
  pr.arms[0].rotation.x=-sw*.8;pr.arms[1].rotation.x=sw*.8;
  if(!PL.onG){pr.arms[0].rotation.x=-2.4;pr.arms[1].rotation.x=-2.4;
    pr.legs[0].rotation.x=.5;pr.legs[1].rotation.x=-.3;}
  pr.body.scale.y=.92*(1+Math.sin(t*2.4)*.02)*(1-PL.squash*.18);
  pr.head.position.y=1.62+Math.sin(t*2.4)*.03;
}
/* ---------- kamera ---------- */
function updCamera(dtf){
  if(!G.started){ // menü: yavaş yörünge
    const a=G.time/21000;
    camera.position.set(Math.sin(a)*26,12,Math.cos(a)*26);
    camera.lookAt(0,2,0);
    return;
  }
  const D=9.5,Hh=5.4;
  const tx=PL.x+Math.sin(G.camYaw)*D,tz=PL.z+Math.cos(G.camYaw)*D;
  camera.position.x=lerp(camera.position.x,tx,Math.min(1,.12*dtf));
  camera.position.y=lerp(camera.position.y,PL.y+Hh,Math.min(1,.12*dtf));
  camera.position.z=lerp(camera.position.z,tz,Math.min(1,.12*dtf));
  if(camera.position.y<1.5)camera.position.y=1.5; // kamera asla yerin altına inmez
  camera.lookAt(PL.x,PL.y+1.9,PL.z);
}
/* ---------- rehber oku ---------- */
let guideArrow,guideG;
function buildGuide(){
  guideG=new THREE.Group();
  const cone=new THREE.Mesh(new THREE.ConeGeometry(.28,.8,10),
    new THREE.MeshBasicMaterial({color:0xff6f00}));
  cone.rotation.x=Math.PI/2;cone.position.z=.4;
  guideG.add(cone);
  const ring=new THREE.Mesh(new THREE.TorusGeometry(.32,.07,8,16),
    new THREE.MeshBasicMaterial({color:0xff6f00}));
  guideG.add(ring);
  guideG.position.y=3.4;scene.add(guideG);
}
function guideTarget(){
  if(!MST)return null;
  if(MST.phase==='turnin'){
    const n=npcs.find(n=>n.zone===MST.zone);
    return n?{x:n.x,z:n.z}:null;
  }
  if(MST.type==='collect'){
    let best=null,bd=1e9;
    G.items.forEach(it=>{if(it.isTarget&&!it.got){const d=Math.hypot(it.g.position.x-PL.x,it.g.position.z-PL.z);
      if(d<bd){bd=d;best={x:it.g.position.x,z:it.g.position.z};}}});
    return best;
  }
  if(MST.type==='coins'){
    let best=null,bd=1e9;
    G.coins.forEach(c=>{if(c.mission&&!c.taken){const d=Math.hypot(c.x-PL.x,c.z-PL.z);
      if(d<bd){bd=d;best={x:c.x,z:c.z};}}});
    return best;
  }
  if(MST.type==='rescue'&&G.bubbles.length)return {x:G.bubbles[0].g.position.x,z:G.bubbles[0].g.position.z};
  if(MST.type==='showme'&&G.peds.length)return {x:G.peds[0].x,z:G.peds[0].z};
  return null;
}
function updGuide(){
  const t=guideTarget();
  guideG.visible=G.started&&!!t&&!G.lock&&!DLG.open;
  if(t){
    guideG.position.x=PL.x;guideG.position.z=PL.z;
    guideG.position.y=PL.y+3.3+Math.sin(G.time/300)*.15;
    guideG.rotation.y=Math.atan2(t.x-PL.x,t.z-PL.z);
  }
}

/* ---------- etkileşim & toplama ---------- */
function updInteract(){
  if(G.lock||DLG.open||G.paused)return;
  // NPC'ler
  npcs.forEach(n=>{
    const d=Math.hypot(PL.x-n.x,PL.z-n.z);
    if(d<3.4){
      if(n.cool<G.time-2500){
        n.cool=G.time;
        if(MST&&MST.zone===n.zone&&MST.phase==='turnin'){turnIn();}
        else if(!MST&&mDone(n.zone)<MISSION_CNT){offerMission(n);}
      }
    }
  });
  // dükkan
  if(Math.hypot(PL.x-shopPos.x,PL.z-shopPos.z)<5.2&&!G.shopCool){G.shopCool=true;openShop();}
  else if(Math.hypot(PL.x-shopPos.x,PL.z-shopPos.z)>7){G.shopCool=false;}
  // eşyalar
  for(const it of G.items){
    if(it.got)continue;
    const d=Math.hypot(PL.x-it.g.position.x,PL.z-it.g.position.z);
    if(d<1.9&&Math.abs(PL.y+1-it.baseY)<2.4){
      if(it.honey){
        it.got=true;scene.remove(it.g);S.coins+=2;save();updHUD();
        sfx.coin();speak('Honey!','en-US');floatyWord('🍯 HONEY! +2🪙');
        setTimeout(()=>{ // yeni kavanoz
          const z=pick(ZONES);const s=freeSpotInZone(z,20,[]);
          const sp=emojiSprite('🍯',1.7);sp.position.set(s.x,1.1,s.z);scene.add(sp);
          G.items.push({g:sp,w:{en:'honey',tr:'bal'},zone:z,isTarget:false,honey:true,got:false,ring:null,baseY:1.1,ph:rnd(0,6.28)});
        },8000);
      }
      else if(MST&&MST.type==='collect'&&it.zone===MST.zone){
        if(it.isTarget){
          it.got=true;scene.remove(it.g);if(it.ring)scene.remove(it.ring);
          MST.got++;sfx.collect();
          if(MST.zone.topic==='numbers')speak(NEN[Math.min(MST.got,10)]+'!','en-US');
          else sayWord(it.w);
          S.words[it.w.en]=1;save();
          floatyWord((it.w.emoji||'⭐')+' '+it.w.en.toUpperCase()+'!');
          setMissionHUD();
          if(MST.got>=MST.count){
            MST.phase='turnin';setMissionHUD();
            toast('➜ Görev tamam! '+MST.zone.npc.name+' yanına git!');
            sayTr(`Görev tamam! ${MST.zone.npc.name.toLowerCase()} yanına geri git!`);
          }
        }else if(G.time>(it.cool||0)){
          it.cool=G.time+1500;sfx.wrong();
          speak(`That's ${it.w.en}! Find the ${plural(MST.word.en,MST.count)}!`,'en-US');
          it.g.position.y=it.baseY;G.anims.push({o:it.g,shake:1});
        }
      }
    }
  }
  // paralar
  for(const c of G.coins){
    if(c.taken){
      if(!c.mission&&G.time>c.respawn){c.taken=false;c.m.visible=true;}
      continue;
    }
    const d=Math.hypot(PL.x-c.x,PL.z-c.z);
    if(d<1.7&&PL.y<2.6){
      c.taken=true;c.m.visible=false;c.respawn=G.time+45000;
      S.coins++;save();updHUD();sfx.coin();
      if(MST&&MST.type==='coins'&&c.mission){
        MST.got++;setMissionHUD();
        speak(NEN[Math.min(MST.got,10)]||'','en-US');
        if(MST.got>=MST.count){MST.phase='turnin';setMissionHUD();
          toast('➜ Altınlar tamam! '+MST.zone.npc.name+' yanına git!');}
      }
    }
  }
  // balonlar
  for(const b of G.bubbles){
    if(b.popped)continue;
    const d=Math.hypot(PL.x-b.g.position.x,PL.z-b.g.position.z);
    if(d<3&&PL.y<5){b.popped=true;openChallenge(b);break;}
  }
  // pedestal dokunma
  if(MST&&MST.type==='showme'){
    for(const p of G.peds){
      const d=Math.hypot(PL.x-p.x,PL.z-p.z);
      if(d<2.3&&PL.y<3){
        if(p.correct){
          sfx.star();sfx.collect();
          G.anims.push({o:p.vis,hop:1});
          speak(`Yes! ${p.w.en}! Great job!`,'en-US');
          S.words[p.w.en]=1;save();
          floatyWord((p.w.emoji||'⭐')+' '+p.w.en.toUpperCase()+'!');
          setTimeout(()=>{clearPeds();},600);
          completeMission(8);
        }else if(G.time>(p.cool||0)){
          p.cool=G.time+1400;sfx.wrong();
          G.anims.push({o:p.vis,shake:1});
          speak(`That's ${p.w.en}! Find the ${MST.word.en}!`,'en-US');
        }
        break;
      }
    }
  }
}

/* ---------- animasyonlar ---------- */
function updAnims(dtf){
  for(let i=G.anims.length-1;i>=0;i--){
    const a=G.anims[i];
    if(a.cloud){a.o.position.x+=a.o.userData.drift*dtf*.05;if(a.o.position.x>170)a.o.position.x=-170;continue;}
    if(a.pop!==undefined){
      a.pop+=dtf*.06;a.o.scale.setScalar(1+a.pop*.4);
      a.o.children[0].material.opacity=Math.max(0,.32-a.pop*.35);
      if(a.pop>1){scene.remove(a.o);
        if(G.bubbles[0]&&G.bubbles[0].g===a.o)G.bubbles.shift();
        G.anims.splice(i,1);}
      continue;
    }
    if(a.hop!==undefined){a.hop+=dtf*.1;a.o.position.y=1.9+Math.sin(Math.min(a.hop,1)*Math.PI)*1.6;
      if(a.hop>1)G.anims.splice(i,1);continue;}
    if(a.shake!==undefined){a.shake+=dtf*.12;
      a.o.position.x=(a.o.userData.bx!==undefined?a.o.userData.bx:(a.o.userData.bx=a.o.position.x))+Math.sin(a.shake*3)*.3;
      if(a.shake>1){a.o.position.x=a.o.userData.bx;G.anims.splice(i,1);}continue;}
  }
  // eşya bob
  G.items.forEach(it=>{
    if(it.got)return;
    it.g.position.y=it.baseY+Math.sin(G.time/340+it.ph)*.22;
  });
  // halka nabzı
  G.items.forEach(it=>{
    if(it.ring){const s=1+Math.sin(G.time/260)*.14;it.ring.scale.set(s,s,1);}
  });
  // paralar döner
  G.coins.forEach(c=>{if(!c.taken)c.m.rotation.y+=dtf*.09;});
  // balon bob
  G.bubbles.forEach(b=>{
    if(!b.popped)b.g.position.y=2.6+Math.sin(G.time/500+b.ph)*.3;
  });
  // NPC nefes
  npcs.forEach(n=>{
    const s=1+Math.sin(G.time/700+n.x)*.02;n.g.scale.set(s,1,s);
  });
}

/* ---------- ana döngü ---------- */
let tPrev=0;
function loop(ts){
  requestAnimationFrame(loop);
  const dt=Math.min(40,ts-(tPrev||ts));tPrev=ts;
  const dtf=clamp(dt/16.667,.2,2.5);
  G.time+=dt;
  if(G.started&&!G.paused){updPlayer(dtf);updInteract();}
  updAnims(dtf);
  updCamera(dtf);
  updGuide();
  renderer.render(scene,camera);
}

/* ---------- menü / akış ---------- */
function startGame(){
  G.started=true;G.paused=false;
  $('menu').classList.add('hidden');
  $('hud').classList.remove('hidden');$('hudRight').classList.remove('hidden');
  $('joy').classList.remove('hidden');$('btnJump').classList.remove('hidden');
  updHUD();setMissionHUD();updateNPCMarkers();
  speak("Let's learn English!",'en-US');
  if(!S.tut){S.tut=true;save();$('tut').classList.remove('hidden');}
}
function toMenu(){
  G.paused=false;
  $('pause').classList.add('hidden');$('wordbook').classList.add('hidden');
  $('settings').classList.add('hidden');$('tut').classList.add('hidden');
  G.started=false;
  $('hud').classList.add('hidden');$('hudRight').classList.add('hidden');
  $('joy').classList.add('hidden');$('btnJump').classList.add('hidden');
  $('menu').classList.remove('hidden');
}
function setPause(v){
  if(!G.started)return;
  G.paused=v;$('pause').classList.toggle('hidden',!v);
  if(v)try{speechSynthesis.cancel();}catch(e){}
}
function toggleMute(){
  S.muted=!S.muted;save();
  $('btnMute').textContent=S.muted?'🔇':'🔊';
  if(S.muted)try{speechSynthesis.cancel();}catch(e){}
}
$('btnPlay').addEventListener('click',()=>{ensureAudio();sfx.click();startGame();});
$('tutBtn').addEventListener('click',()=>{sfx.click();$('tut').classList.add('hidden');});
$('btnPause').addEventListener('click',()=>setPause(true));
$('btnResume').addEventListener('click',()=>{sfx.click();setPause(false);});
$('btnToMenu').addEventListener('click',toMenu);
$('btnMute').addEventListener('click',toggleMute);

/* ---------- ayarlar ---------- */
function openSettings(){
  $('setName').value=S.name||'';
  $('setSfx').checked=S.sfx;$('setVoice').checked=S.voice;$('setHint').checked=S.hint;
  document.querySelectorAll('#segLang button').forEach(b=>b.classList.toggle('on',b.dataset.v===S.lang));
  $('settings').classList.remove('hidden');
}
$('btnSettings2').addEventListener('click',()=>{ensureAudio();sfx.click();openSettings();});
$('btnPauseSettings').addEventListener('click',()=>{sfx.click();openSettings();});
$('btnSetClose').addEventListener('click',()=>{sfx.click();$('settings').classList.add('hidden');});
$('setName').addEventListener('input',e=>{S.name=e.target.value.trim();save();});
$('setSfx').addEventListener('change',e=>{S.sfx=e.target.checked;save();});
$('setVoice').addEventListener('change',e=>{S.voice=e.target.checked;save();});
$('setHint').addEventListener('change',e=>{S.hint=e.target.checked;save();});
document.querySelectorAll('#segLang button').forEach(b=>b.addEventListener('click',()=>{
  S.lang=b.dataset.v;save();
  document.querySelectorAll('#segLang button').forEach(z=>z.classList.toggle('on',z===b));
}));
$('btnReset').addEventListener('click',()=>{
  S.coins=0;S.stars=0;S.words={};S.hats=[];S.hat=null;S.missions={};S.tut=false;save();
  equipHat(null,true);updHUD();setMissionHUD();updateNPCMarkers();sfx.click();
  Object.keys(usedW).forEach(k=>delete usedW[k]);
});

/* ---------- başlat ---------- */
buildWorld();
buildPlayer();
buildNPCs();
buildGuide();
seedWorldCoins();
updHUD();updateNPCMarkers();
$('btnMute').textContent=S.muted?'🔇':'🔊';
resize();
requestAnimationFrame(loop);

/* test parametreleri */
const qp=new URLSearchParams(location.search);
if(qp.get('autostart'))setTimeout(startGame,300);
if(qp.get('dlg'))setTimeout(()=>{const n=npcs.find(n=>n.zone.id==='forest');offerMission(n);},1500);
if(qp.get('demo')){
  IN.y=-1;setInterval(()=>{IN.jumpBuf=8;IN.jumpHeld=true;setTimeout(()=>IN.jumpHeld=false,400);},2300);
  setTimeout(()=>{IN.y=-.3;IN.x=.6;},9000);
}
