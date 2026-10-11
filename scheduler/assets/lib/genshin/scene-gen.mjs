// build/gen.mjs — emits a self-contained 1920x1080 layered cutscene HTML.
// Deterministic (no Math.random). Usage: node build/gen.mjs <sceneName> > code/<name>.html

const RUNTIME = String.raw`
var W=1920,H=1080;
var cv=document.getElementById("c"), g=cv.getContext("2d");
function rnd(i){var s=Math.sin(i*127.1+311.7)*43758.5453;return s-Math.floor(s);}
function rr(i,a,b){return a+(b-a)*rnd(i);}
function lg(G,x0,y0,x1,y1,st){var q=G.createLinearGradient(x0,y0,x1,y1);for(var i=0;i<st.length;i++)q.addColorStop(st[i][0],st[i][1]);return q;}
function rg(G,x,y,r0,r1,st){var q=G.createRadialGradient(x,y,r0,x,y,r1);for(var i=0;i<st.length;i++)q.addColorStop(st[i][0],st[i][1]);return q;}
function L(){var c=document.createElement("canvas");c.width=W;c.height=H;return {c:c,g:c.getContext("2d")};}
function lin(a,b,t){return "rgb("+Math.round(a[0]+(b[0]-a[0])*t)+","+Math.round(a[1]+(b[1]-a[1])*t)+","+Math.round(a[2]+(b[2]-a[2])*t)+")";}
`;

const PRELUDE = String.raw`
var FLOOR=CFG.floor;
var WIN_BOT=CFG.winBot, WIN_TOP=CFG.winTop, WIN_W=CFG.winW, WIN_GAP=CFG.winGap, N=CFG.winN;
var totalW=N*WIN_W+(N-1)*WIN_GAP, X0=(W-totalW)/2+(CFG.offsetX||0);
var SPRING=WIN_TOP+WIN_W;
var LAMPX=CFG.lampX, LAMPY=CFG.lampY, CHARX=CFG.charX, CHARH=CFG.charH;
// archSub appends a subpath WITHOUT resetting the current path
// (required for evenodd groups — beginPath() would wipe the wall rect)
function archSub(G,x,w,spring,bot){
  var r=w;
  G.moveTo(x,bot); G.lineTo(x,spring);
  G.arc(x+w,spring,r,Math.PI,Math.PI*4/3,false);
  G.arc(x,spring,r,Math.PI*5/3,Math.PI*2,false);
  G.lineTo(x+w,bot); G.closePath();
}
function archPath(G,x,w,spring,bot){ G.beginPath(); archSub(G,x,w,spring,bot); }
function archRing(G,x,w,spring,bot){ G.beginPath(); archSub(G,x,w,spring,bot); }
`;

const PLANES = String.raw`
var far=L(), f=far.g;
var wall=L(), wg=wall.g;
var mid=L(), m=mid.g;
var bloom=L(), b=bloom.g;
var near=L(), n=near.g;
`;

// ============================================================
//  FAR PLANE  — sky + distant city  (bright, cool, low contrast)
// ============================================================
const FAR_SKY = String.raw`
// --- dusk sky: deliberately NOT white; the brightest thing is the horizon band ---
f.fillStyle=lg(f,0,0,0,H,[[0,"#16305c"],[0.22,"#26507f"],[0.46,"#4a7aa8"],[0.66,"#7ba3c6"],[0.80,"#a9c4d8"],[1,"#5d80a6"]]);
f.fillRect(0,0,W,H);
// stars up high
f.save();
for(var i=0;i<130;i++){
  var sx=rr(i*3.7,0,W), sy=rr(i*5.9,0,430), sr=rr(i*8.3,0.6,1.9);
  f.fillStyle="rgba(226,240,255,"+(0.10+rnd(i*11.1)*0.55).toFixed(3)+")";
  f.beginPath();f.arc(sx,sy,sr,0,7);f.fill();
}
f.restore();
// moon + tight halo
f.fillStyle=rg(f,1288,232,6,200,[[0,"rgba(255,252,236,0.62)"],[0.10,"rgba(236,246,255,0.22)"],[1,"rgba(200,222,250,0)"]]);
f.fillRect(1050,10,480,480);
f.fillStyle="rgba(255,253,244,0.96)";f.beginPath();f.arc(1288,232,32,0,7);f.fill();
// thin cloud streaks
for(var i=0;i<38;i++){
  var cx=rr(i*3.1,-160,W+160), cy=rr(i*7.7,120,660), cr=rr(i*5.3,130,340);
  f.fillStyle="rgba(196,222,246,"+(0.04+rnd(i*11)*0.075).toFixed(3)+")";
  f.beginPath();f.ellipse(cx,cy,cr,cr*0.14,0,0,7);f.fill();
}
// horizon glow — the one genuinely bright band in the far plane
f.fillStyle=lg(f,0,640,0,900,[[0,"rgba(255,226,178,0)"],[0.55,"rgba(255,222,172,0.42)"],[1,"rgba(255,214,158,0.10)"]]);
f.fillRect(0,640,W,270);
// distant city
f.fillStyle="rgba(58,88,132,0.75)";
f.beginPath();f.moveTo(-60,880);
for(var i=0;i<34;i++){var bx=-60+i*62,bh=rr(i*13.3,24,120);
  f.lineTo(bx,880-bh);f.lineTo(bx+38,880-bh*0.66);f.lineTo(bx+62,880-bh*1.02);}
f.lineTo(W+60,880);f.lineTo(W+60,1060);f.lineTo(-60,1060);f.closePath();f.fill();
f.fillStyle="rgba(46,74,116,0.85)";
for(var i=0;i<15;i++){var sx=rr(i*23.7,20,W-20),sh=rr(i*31.1,150,340),sw=rr(i*17.9,20,46);
  f.beginPath();f.moveTo(sx-sw,910);f.lineTo(sx,910-sh);f.lineTo(sx+sw,910);f.closePath();f.fill();}
// warm window lights in the city
f.save();f.globalCompositeOperation="lighter";
for(var i=0;i<70;i++){var x=rr(i*9.1,0,W),y=rr(i*15.3,600,830);
  f.fillStyle="rgba(255,206,140,"+(0.12+rnd(i*21)*0.45).toFixed(3)+")";
  f.fillRect(x,y,3,3);}
f.restore();
`;

// ============================================================
//  FAR PLANE  — the wall, punched with evenodd so the sky shows through
// ============================================================
const FAR_WALL = String.raw`
// punch openings (evenodd => sky remains visible through them)
wg.beginPath();
wg.rect(-20,-20,W+40,FLOOR+120);
for(var i=0;i<N;i++){ archSub(wg,X0+i*(WIN_W+WIN_GAP),WIN_W,SPRING,WIN_BOT); }
wg.fillStyle=lg(wg,0,0,0,FLOOR,[[0,"#1a2144"],[0.30,"#151a3a"],[0.66,"#101530"],[1,"#0a0e22"]]);
wg.fill("evenodd");

// stone coursing, clipped to the wall face
wg.save();
wg.beginPath();
wg.rect(-20,-20,W+40,FLOOR+120);
for(var i=0;i<N;i++){ archSub(wg,X0+i*(WIN_W+WIN_GAP),WIN_W,SPRING,WIN_BOT); }
wg.clip("evenodd");
wg.strokeStyle="rgba(0,0,0,0.26)";wg.lineWidth=1.5;
for(var y=WIN_TOP-60;y<FLOOR+60;y+=46){wg.beginPath();wg.moveTo(0,y);wg.lineTo(W,y);wg.stroke();}
for(var y=WIN_TOP-60,k=0;y<FLOOR+60;y+=46,k++){
  var off=(k%2)*56;
  for(var x=off;x<W;x+=112){wg.beginPath();wg.moveTo(x,y);wg.lineTo(x,y+46);wg.stroke();}
}
// vertical light falloff on the wall
wg.fillStyle=lg(wg,0,0,0,FLOOR,[[0,"rgba(96,128,182,0.20)"],[0.5,"rgba(0,0,0,0.10)"],[1,"rgba(0,0,0,0.42)"]]);
wg.fillRect(0,0,W,FLOOR+60);
wg.restore();

// arch mouldings
for(var i=0;i<N;i++){ var x=X0+i*(WIN_W+WIN_GAP);
  wg.save();
  wg.strokeStyle="#2b3468";wg.lineWidth=20;archRing(wg,x,WIN_W,SPRING,WIN_BOT);wg.stroke();
  wg.strokeStyle="#3f4a86";wg.lineWidth=3.5;archRing(wg,x,WIN_W,SPRING,WIN_BOT);wg.stroke();
  wg.strokeStyle="#0c1024";wg.lineWidth=3;archPath(wg,x+11,WIN_W-22,SPRING,WIN_BOT);wg.stroke();
  // hood-mould terminator blocks at the springing
  wg.fillStyle="#333d74";
  wg.fillRect(x-24,SPRING-12,26,26); wg.fillRect(x+WIN_W-2,SPRING-12,26,26);
  wg.fillStyle="#1c2248";
  wg.fillRect(x-24,SPRING+14,26,10); wg.fillRect(x+WIN_W-2,SPRING+14,26,10);
  wg.restore();
}
// sills
for(var i=0;i<N;i++){ var x=X0+i*(WIN_W+WIN_GAP);
  wg.fillStyle="#252d5c";wg.fillRect(x-32,WIN_BOT,WIN_W+64,18);
  wg.fillStyle="#3a4480";wg.fillRect(x-32,WIN_BOT-5,WIN_W+64,5);
  wg.fillStyle="#0e1228";wg.fillRect(x-32,WIN_BOT+18,WIN_W+64,12);
}
// jamb shadow: darken only the WALL beside each opening.
// source-atop keeps the hole transparent so the sky survives.
wg.save();wg.globalCompositeOperation="source-atop";
for(var i=0;i<N;i++){ var x=X0+i*(WIN_W+WIN_GAP);
  wg.strokeStyle="rgba(6,9,22,0.75)";wg.lineWidth=26;
  archPath(wg,x-4,WIN_W+8,SPRING,WIN_BOT);wg.stroke();
  wg.strokeStyle="rgba(6,9,22,0.40)";wg.lineWidth=56;
  archPath(wg,x-16,WIN_W+32,SPRING,WIN_BOT);wg.stroke();
}
wg.restore();
// mullions (stone tracery, read as gothic)
for(var i=0;i<N;i++){ var x=X0+i*(WIN_W+WIN_GAP);
  wg.save();
  wg.strokeStyle="rgba(18,22,48,0.90)";wg.lineWidth=8;
  wg.beginPath();wg.moveTo(x+WIN_W*0.5,WIN_TOP+WIN_W*0.14);wg.lineTo(x+WIN_W*0.5,WIN_BOT);wg.stroke();
  wg.lineWidth=6;
  wg.beginPath();wg.moveTo(x+8,SPRING+150);wg.lineTo(x+WIN_W-8,SPRING+150);wg.stroke();
  wg.beginPath();wg.moveTo(x+8,SPRING+320);wg.lineTo(x+WIN_W-8,SPRING+320);wg.stroke();
  wg.restore();
}
`;

// ============================================================
//  MID PLANE
// ============================================================
const MID_FLOOR = String.raw`
m.fillStyle=lg(m,0,FLOOR,0,H,[[0,"#161d40"],[0.35,"#1a2248"],[1,"#0a0e22"]]);
m.fillRect(0,FLOOR,W,H-FLOOR);
m.strokeStyle="rgba(104,134,198,0.14)";m.lineWidth=2;
for(var i=-18;i<=18;i++){m.beginPath();m.moveTo(W/2+i*62,FLOOR);m.lineTo(W/2+i*440,H);m.stroke();}
for(var k=1;k<9;k++){var y=FLOOR+Math.pow(k/9,1.8)*(H-FLOOR)*1.9;if(y>H)break;
  m.beginPath();m.moveTo(0,y);m.lineTo(W,y);m.stroke();}
// light pools on the floor, one per window (skipped in corridor mode)
m.save();m.globalCompositeOperation="lighter";
for(var i=0;i<(CFG.corridor?0:N);i++){ var x=X0+i*(WIN_W+WIN_GAP);
  m.fillStyle=lg(m,x,WIN_BOT,x,FLOOR+280,[[0,"rgba(142,186,246,0.30)"],[1,"rgba(96,142,220,0)"]]);
  m.beginPath();m.moveTo(x+12,WIN_BOT);m.lineTo(x+WIN_W-12,WIN_BOT);
  m.lineTo(x+WIN_W+96,FLOOR+290);m.lineTo(x-96,FLOOR+290);m.closePath();m.fill();}
m.restore();
`;

const MID_COLUMNS = String.raw`
function goldStar(G,B,cx,cy,r){
  G.save();G.fillStyle="rgba(255,224,158,0.96)";
  G.beginPath();
  G.moveTo(cx,cy-r);G.lineTo(cx+r*0.34,cy-r*0.30);G.lineTo(cx+r,cy-r*0.10);
  G.lineTo(cx+r*0.32,cy+r*0.22);G.lineTo(cx+r*0.50,cy+r*0.95);G.lineTo(cx,cy+r*0.40);
  G.lineTo(cx-r*0.50,cy+r*0.95);G.lineTo(cx-r*0.32,cy+r*0.22);G.lineTo(cx-r,cy-r*0.10);
  G.lineTo(cx-r*0.34,cy-r*0.30);G.closePath();G.fill();G.restore();
  B.save();B.globalCompositeOperation="lighter";
  B.fillStyle=rg(B,cx,cy,0,92,[[0,"rgba(255,210,128,0.55)"],[1,"rgba(255,182,92,0)"]]);
  B.fillRect(cx-92,cy-92,184,184);B.restore();
}
function column(G,B,cx,top,bot,wTop){
  var wBot=wTop*1.10;
  G.beginPath();G.moveTo(cx-wTop/2,top);G.lineTo(cx+wTop/2,top);
  G.lineTo(cx+wBot/2,bot);G.lineTo(cx-wBot/2,bot);G.closePath();
  G.fillStyle=lg(G,cx-wTop/2,0,cx+wTop/2,0,[[0,"#060814"],[0.14,"#1b2246"],[0.36,"#414c86"],[0.52,"#2f3868"],[0.78,"#12172f"],[1,"#04060f"]]);
  G.fill();
  G.save();G.globalAlpha=0.36;G.strokeStyle="#04060f";G.lineWidth=2;
  for(var k=-2;k<=2;k++){G.beginPath();G.moveTo(cx+k*wTop*0.17,top+8);G.lineTo(cx+k*wBot*0.17,bot-8);G.stroke();}
  G.restore();
  // capital
  G.fillStyle=lg(G,cx-wTop/2,0,cx+wTop/2,0,[[0,"#0c1029"],[0.42,"#46528e"],[1,"#090d20"]]);
  G.fillRect(cx-wTop*0.92,top-32,wTop*1.84,32);
  G.fillRect(cx-wTop*0.72,top-58,wTop*1.44,28);
  G.fillStyle="#242c58";G.fillRect(cx-wTop*0.92,top-4,wTop*1.84,8);
  // base
  G.fillStyle="#121736";G.fillRect(cx-wBot*0.78,bot-36,wBot*1.56,36);
  G.fillStyle="#1d2448";G.fillRect(cx-wBot*0.64,bot-64,wBot*1.28,30);
  goldStar(G,B,cx,top-78,wTop*0.24);
}
for(var i=0;i<N-1;i++){column(m,b,X0+(i+1)*(WIN_W+WIN_GAP)-WIN_GAP/2,-40,FLOOR+24,WIN_GAP*0.64);}
column(m,b,X0-WIN_GAP/2,-40,FLOOR+24,WIN_GAP*0.64);
column(m,b,X0+totalW+WIN_GAP/2,-40,FLOOR+24,WIN_GAP*0.64);
// entablature
m.fillStyle="#0b0f28";m.fillRect(0,0,W,48);
m.fillStyle="#182046";m.fillRect(0,48,W,18);
m.save();m.globalAlpha=0.42;m.fillStyle="#c8a45c";m.fillRect(0,64,W,3);m.restore();
`;

const MID_SHAFT = String.raw`
m.save();m.globalCompositeOperation="lighter";
function shaft(G,x0,x1,dx,alpha){
  G.save();
  G.beginPath();G.moveTo(x0,-60);G.lineTo(x1,-60);G.lineTo(x1+dx,H);G.lineTo(x0+dx,H);G.closePath();G.clip();
  G.fillStyle=lg(G,0,0,0,H,[[0,"rgba(174,212,255,"+alpha+")"],[0.45,"rgba(158,198,250,"+(alpha*0.40).toFixed(3)+")"],[1,"rgba(140,184,244,0)"]]);
  G.fillRect(0,0,W,H);G.restore();
}
shaft(m,LAMPX-280,LAMPX-90,420,0.15);
shaft(m,X0+WIN_W*0.5,X0+WIN_W*0.5+90,110,0.065);
shaft(m,X0+2*(WIN_W+WIN_GAP)+WIN_W*0.5,X0+2*(WIN_W+WIN_GAP)+WIN_W*0.5+90,70,0.05);
m.restore();
`;

const MID_LAMP = String.raw`
m.strokeStyle="#1c2244";m.lineWidth=5;
m.beginPath();m.moveTo(LAMPX,0);m.lineTo(LAMPX,LAMPY-78);m.stroke();
m.save();m.translate(LAMPX,LAMPY);
m.fillStyle="#221b30";m.beginPath();m.moveTo(-10,-80);m.lineTo(10,-80);m.lineTo(7,-58);m.lineTo(-7,-58);m.closePath();m.fill();
m.fillStyle="rgba(255,182,92,0.97)";
m.beginPath();m.moveTo(-30,-58);m.lineTo(30,-58);m.lineTo(23,40);m.lineTo(-23,40);m.closePath();m.fill();
m.fillStyle="rgba(255,249,228,0.99)";m.beginPath();m.ellipse(0,-8,13,30,0,0,7);m.fill();
m.strokeStyle="#131020";m.lineWidth=5;
m.beginPath();m.moveTo(-30,-58);m.lineTo(30,-58);m.lineTo(23,40);m.lineTo(-23,40);m.closePath();m.stroke();
m.beginPath();m.moveTo(0,-58);m.lineTo(0,40);m.stroke();
m.fillStyle="#1c1728";m.beginPath();m.moveTo(-27,40);m.lineTo(27,40);m.lineTo(16,58);m.lineTo(-16,58);m.closePath();m.fill();
m.restore();
b.save();b.globalCompositeOperation="lighter";
b.fillStyle=rg(b,LAMPX,LAMPY-8,0,620,[[0,"rgba(255,194,104,1)"],[0.07,"rgba(255,166,72,0.55)"],[0.30,"rgba(230,130,50,0.17)"],[1,"rgba(188,94,34,0)"]]);
b.fillRect(LAMPX-640,LAMPY-660,1280,1320);b.restore();
m.save();m.globalCompositeOperation="lighter";
m.fillStyle=rg(m,LAMPX,FLOOR+150,20,580,[[0,"rgba(255,164,74,0.26)"],[1,"rgba(255,142,54,0)"]]);
m.beginPath();m.ellipse(LAMPX,FLOOR+150,580,180,0,0,7);m.fill();m.restore();
`;

// ============================================================
//  CHARACTER  — tall, layered, cel-shaded, strong rim light
// ============================================================
const CHAR = String.raw`
// 460-unit figure. Narrow silhouette, small hood, rim light via a gradient
// clipped INSIDE the shape (never a painted stripe on the outside).
function rimIn(G, path, x0, x1, warm, cool){
  G.save();
  G.clip(path);
  G.globalCompositeOperation="lighter";
  G.fillStyle=lg(G,x0,0,x1,0,[
    [0,"rgba(150,196,255,"+cool+")"],
    [0.13,"rgba(150,196,255,0)"],
    [0.78,"rgba(255,206,136,0)"],
    [0.92,"rgba(255,206,136,"+(warm*0.6).toFixed(2)+")"],
    [1,"rgba(255,200,126,"+warm+")"]]);
  G.fillRect(x0-40,-520,(x1-x0)+80,560);
  G.restore();
}

function character(G,B,cx,feet,hgt){
  var s=hgt/460;
  G.save();G.translate(cx,feet);G.scale(s,s);

  // contact shadow
  G.save();G.fillStyle=rg(G,0,10,0,175,[[0,"rgba(0,0,0,0.68)"],[1,"rgba(0,0,0,0)"]]);
  G.beginPath();G.ellipse(0,10,172,30,0,0,7);G.fill();G.restore();

  // ---- inner robe (dark, shows through the front slit) ----
  var robe=new Path2D();
  robe.moveTo(-20,-286);
  robe.bezierCurveTo(-26,-190,-30,-80,-34,8);
  robe.lineTo(34,8);
  robe.bezierCurveTo(28,-80,24,-190,18,-286);
  robe.closePath();
  G.fillStyle=lg(G,-34,0,34,0,[[0,"#252c46"],[0.45,"#3f4866"],[1,"#1e2438"]]);
  G.fill(robe);

  // ---- cloak: narrow shoulders -> gentle flare ----
  var cloak=new Path2D();
  cloak.moveTo(-44,-296);
  cloak.bezierCurveTo(-52,-262,-56,-220,-58,-186);
  cloak.bezierCurveTo(-66,-118,-72,-52,-76,4);
  cloak.bezierCurveTo(-44,14,-16,2,6,6);
  cloak.bezierCurveTo(28,10,52,2,74,4);
  cloak.bezierCurveTo(70,-52,64,-118,58,-186);
  cloak.bezierCurveTo(56,-220,52,-262,44,-296);
  cloak.bezierCurveTo(26,-308,-26,-308,-44,-296);
  cloak.closePath();
  G.fillStyle=lg(G,-76,0,74,0,[[0,"#525c82"],[0.16,"#8e9abe"],[0.36,"#ccd5e8"],[0.52,"#e4eaf6"],[0.70,"#c0c9e1"],[0.88,"#8793b8"],[1,"#4c567c"]]);
  G.fill(cloak);

  // hard-edged cel shadow (left third) — the anime "one shadow block" move
  G.save();G.clip(cloak);
  G.fillStyle="rgba(100,114,160,0.42)";
  G.beginPath();G.moveTo(-44,-296);
  G.bezierCurveTo(-52,-262,-56,-220,-58,-186);
  G.bezierCurveTo(-66,-118,-72,-52,-76,4);
  G.bezierCurveTo(-56,10,-34,4,-18,6);
  G.bezierCurveTo(-24,-84,-28,-190,-28,-290);
  G.closePath();G.fill();
  // vertical folds following gravity
  G.strokeStyle="rgba(108,122,166,0.34)";G.lineWidth=2.6;
  G.beginPath();G.moveTo(-32,-280);G.bezierCurveTo(-36,-190,-40,-90,-44,6);G.stroke();
  G.beginPath();G.moveTo(30,-280);G.bezierCurveTo(34,-190,38,-90,42,6);G.stroke();
  G.strokeStyle="rgba(255,252,244,0.26)";G.lineWidth=2;
  G.beginPath();G.moveTo(-6,-276);G.bezierCurveTo(-4,-186,0,-88,4,6);G.stroke();
  G.restore();
  // front slit: two converging lines showing the dark robe
  G.save();
  G.strokeStyle="rgba(96,110,152,0.62)";G.lineWidth=3;
  G.beginPath();G.moveTo(-16,-278);G.bezierCurveTo(-18,-190,-22,-88,-26,6);G.stroke();
  G.strokeStyle="rgba(255,250,240,0.30)";G.lineWidth=2.4;
  G.beginPath();G.moveTo(-9,-278);G.bezierCurveTo(-8,-190,-6,-88,-4,6);G.stroke();
  G.restore();
  // light falls off toward the floor: darken the lower half of the cloak
  G.save();G.clip(cloak);G.globalCompositeOperation="multiply";
  G.fillStyle=lg(G,0,-120,0,20,[[0,"rgba(255,255,255,1)"],[0.55,"rgba(186,196,224,1)"],[1,"rgba(126,140,180,1)"]]);
  G.fillRect(-90,-120,180,160);
  G.restore();
  // hem
  G.fillStyle="rgba(80,94,136,0.52)";
  G.beginPath();G.moveTo(-76,4);G.bezierCurveTo(-24,16,28,16,74,4);
  G.lineTo(74,20);G.bezierCurveTo(28,32,-24,32,-76,20);G.closePath();G.fill();

  // ---- shoulder mantle: bottom edge is a curve, never a straight cut ----
  var cape=new Path2D();
  cape.moveTo(-46,-294);
  cape.bezierCurveTo(-58,-276,-62,-250,-62,-226);
  cape.bezierCurveTo(-36,-206,-6,-198,22,-202);
  cape.bezierCurveTo(46,-206,58,-220,64,-238);
  cape.bezierCurveTo(64,-266,60,-284,46,-296);
  cape.bezierCurveTo(24,-310,-26,-310,-46,-294);
  cape.closePath();
  G.fillStyle=lg(G,-62,0,64,0,[[0,"#4b567c"],[0.22,"#8d99bd"],[0.48,"#dbe2f0"],[0.70,"#b6c0da"],[1,"#485378"]]);
  G.fill(cape);
  G.save();G.clip(cape);G.globalCompositeOperation="multiply";
  G.fillStyle="rgba(108,122,168,0.38)";
  G.beginPath();G.moveTo(-62,-226);G.bezierCurveTo(-36,-206,-6,-198,22,-202);
  G.bezierCurveTo(46,-206,58,-220,64,-238);G.lineTo(64,-218);
  G.bezierCurveTo(58,-198,46,-184,22,-180);G.bezierCurveTo(-6,-176,-36,-184,-62,-208);
  G.closePath();G.fill();G.restore();

  // ---- clasped hands, mostly hidden by the mantle (just a slim hint) ----
  G.save();
  G.fillStyle="rgba(214,222,240,0.85)";
  G.beginPath();G.ellipse(2,-212,13,8,-0.10,0,7);G.fill();
  G.fillStyle="rgba(255,224,180,0.34)";
  G.beginPath();G.ellipse(7,-214,7,5,0,0,7);G.fill();
  G.restore();

  // ---- hood: small teardrop, tilted slightly forward ----
  var hood=new Path2D();
  hood.moveTo(-46,-288);
  hood.bezierCurveTo(-58,-320,-56,-366,-28,-396);
  hood.bezierCurveTo(-4,-422,34,-424,50,-398);
  hood.bezierCurveTo(62,-378,60,-340,46,-316);
  hood.bezierCurveTo(28,-296,-14,-278,-46,-288);
  hood.closePath();
  G.fillStyle=lg(G,-46,0,42,0,[[0,"#535e85"],[0.26,"#9aa6c6"],[0.50,"#e6ecf8"],[0.76,"#b4bedb"],[1,"#4f5a80"]]);
  G.fill(hood);
  G.save();G.clip(hood);G.globalCompositeOperation="multiply";
  G.fillStyle="rgba(102,116,162,0.44)";
  G.beginPath();G.moveTo(-38,-294);G.bezierCurveTo(-46,-326,-42,-364,-18,-386);
  G.lineTo(-10,-382);G.bezierCurveTo(-30,-362,-32,-326,-26,-296);G.closePath();G.fill();G.restore();
  // hood opening: a narrow upright oval
  G.beginPath();G.ellipse(-2,-352,25,34,0.10,0,7);
  G.fillStyle=lg(G,0,-380,0,-320,[[0,"#0f1430"],[0.6,"#070a18"],[1,"#03050c"]]);
  G.fill();
  // pale hair framing the face (thin locks, not blobs)
  G.save();
  G.fillStyle="rgba(228,235,251,0.74)";
  G.beginPath();G.moveTo(-22,-378);G.bezierCurveTo(-34,-362,-36,-334,-30,-314);
  G.bezierCurveTo(-26,-336,-22,-360,-14,-374);G.closePath();G.fill();
  G.beginPath();G.moveTo(20,-380);G.bezierCurveTo(32,-364,34,-336,28,-316);
  G.bezierCurveTo(24,-338,20,-362,12,-376);G.closePath();G.fill();
  G.fillStyle="rgba(246,249,255,0.66)";
  G.beginPath();G.moveTo(-20,-394);G.bezierCurveTo(-2,-406,16,-404,26,-392);
  G.bezierCurveTo(10,-400,-6,-400,-20,-394);G.closePath();G.fill();
  G.restore();
  // faint face
  G.save();G.globalCompositeOperation="lighter";
  G.fillStyle=rg(G,0,-348,0,22,[[0,"rgba(255,226,192,0.30)"],[1,"rgba(255,196,148,0)"]]);
  G.beginPath();G.ellipse(0,-348,13,17,0,0,7);G.fill();G.restore();

  // ---- RIM LIGHT: gradient clipped inside each silhouette ----
  rimIn(G,cloak,-84,82,0.80,0.62);
  rimIn(G,cape,-70,72,0.62,0.48);
  rimIn(G,hood,-52,48,0.72,0.56);

  G.restore();
}
character(m,b,CHARX,FLOOR+64,CHARH);
`;

const DUST = String.raw`
m.save();m.globalCompositeOperation="lighter";
for(var i=0;i<220;i++){
  var x=rr(i*2.3,0,W), y=rr(i*4.7,40,H-40), r=rr(i*6.1,0.7,2.5);
  m.fillStyle="rgba(214,232,255,"+(0.08+rnd(i*9.3)*0.36).toFixed(3)+")";
  m.beginPath();m.arc(x,y,r,0,7);m.fill();
}
m.restore();
`;

const NEAR_FRAME = String.raw`
function framePillar(x,w,dir){
  n.save();
  n.fillStyle=lg(n,x,0,x+w,0,[[0,"#010206"],[0.5,"#060914"],[1,"#010104"]]);
  n.fillRect(x,0,w,H);
  n.fillStyle="rgba(108,136,202,0.30)";n.fillRect(dir>0?x+w-5:x,0,5,H);
  var gx=dir>0?x+w-42:x+42;
  for(var k=0;k<8;k++){
    var cy=100+k*130;
    n.strokeStyle="rgba(192,154,84,0.54)";n.lineWidth=3.5;
    n.beginPath();n.moveTo(gx,cy-46);
    n.bezierCurveTo(gx+dir*38,cy-28,gx+dir*38,cy+28,gx,cy+46);n.stroke();
    n.strokeStyle="rgba(154,122,66,0.30)";n.lineWidth=2;
    n.beginPath();n.moveTo(gx+dir*6,cy-46);
    n.bezierCurveTo(gx+dir*25,cy-26,gx+dir*25,cy+26,gx+dir*6,cy+46);n.stroke();
    n.fillStyle="rgba(218,180,104,0.56)";
    n.beginPath();n.arc(gx+dir*15,cy,5,0,7);n.fill();
    n.strokeStyle="rgba(142,114,62,0.26)";n.lineWidth=2;
    n.beginPath();n.moveTo(gx,cy+46);n.bezierCurveTo(gx+dir*52,cy+72,gx+dir*14,cy+102,gx,cy+106);n.stroke();
  }
  n.fillStyle="rgba(160,128,70,0.30)";
  n.fillRect(x,0,w,46);
  n.restore();
}
framePillar(-50,246,1); framePillar(1724,246,-1);
// out-of-focus bokeh: must stay subtle or it reads as grey discs
n.save();n.globalCompositeOperation="lighter";
for(var i=0;i<62;i++){
  var x=rr(i*17.3,0,W), y=rr(i*29.1,0,H), r=rr(i*23.7,9,34);
  var warm=(i%5===0);
  n.fillStyle=rg(n,x,y,0,r,[
    [0, warm?"rgba(255,214,160,0.075)":"rgba(212,232,255,0.065)"],
    [0.6, warm?"rgba(255,200,140,0.028)":"rgba(196,220,255,0.024)"],
    [1, "rgba(190,215,255,0)"]]);
  n.beginPath();n.arc(x,y,r,0,7);n.fill();
}
n.restore();
n.fillStyle=lg(n,0,0,0,128,[[0,"rgba(1,2,7,0.95)"],[1,"rgba(1,2,7,0)"]]);n.fillRect(0,0,W,128);
n.fillStyle=lg(n,0,H,0,H-172,[[0,"rgba(1,2,7,0.92)"],[1,"rgba(1,2,7,0)"]]);n.fillRect(0,H-172,W,172);
`;

const COMPOSITE = String.raw`
g.fillStyle="#03050c";g.fillRect(0,0,W,H);
g.save();g.filter="blur(2.5px)";g.drawImage(far.c,0,0);g.restore();
g.drawImage(wall.c,0,0);
// aerial haze in front of the far wall, behind the mid plane
if(CFG.fog){
  var fg2=g.createLinearGradient(0,CFG.winTop-140,0,CFG.floor+260);
  fg2.addColorStop(0,"rgba(120,162,220,0.00)");
  fg2.addColorStop(0.40,"rgba(120,162,220,0.26)");
  fg2.addColorStop(0.76,"rgba(138,176,226,0.50)");
  fg2.addColorStop(1,"rgba(150,186,230,0.26)");
  g.fillStyle=fg2;g.fillRect(0,CFG.winTop-140,W,CFG.floor+420);
}
g.drawImage(mid.c,0,0);
g.save();g.globalCompositeOperation="lighter";g.filter="blur(72px)";g.globalAlpha=CFG.bloomA;g.drawImage(bloom.c,0,0);g.restore();
g.save();g.globalCompositeOperation="lighter";g.filter="blur(24px)";g.globalAlpha=CFG.bloomB;g.drawImage(bloom.c,0,0);g.restore();
g.save();g.filter="blur("+CFG.nearBlur+"px)";g.drawImage(near.c,0,0);g.restore();
// ---- colour script: each variant only swaps these stops ----
var PAL={
  night:{top:"rgba(56,94,168,0.34)",mid:"rgba(48,68,130,0.10)",bot:"rgba(22,12,50,0.38)",warm:"rgba(255,144,62,0.13)",vig:"rgba(62,72,112,1)"},
  dusk:{top:"rgba(126,84,152,0.34)",mid:"rgba(158,98,104,0.12)",bot:"rgba(54,26,58,0.36)",warm:"rgba(255,146,52,0.26)",vig:"rgba(78,64,96,1)"},
  moon:{top:"rgba(38,96,184,0.44)",mid:"rgba(34,62,132,0.16)",bot:"rgba(6,12,40,0.50)",warm:"rgba(255,150,70,0.09)",vig:"rgba(42,56,98,1)"},
  ember:{top:"rgba(154,78,58,0.30)",mid:"rgba(124,60,58,0.12)",bot:"rgba(46,16,24,0.42)",warm:"rgba(255,130,42,0.32)",vig:"rgba(84,56,60,1)"}
};
var PL=PAL[CFG.palette||"night"];
// grade: cool-shadow vignette first, then the colour cast
g.save();g.globalCompositeOperation="multiply";
g.fillStyle=rg(g,W*0.5,H*0.5,420,1260,[[0,"rgba(255,250,238,1)"],[1,PL.vig]]);
g.fillRect(0,0,W,H);g.restore();
g.save();g.globalCompositeOperation="overlay";
g.fillStyle=lg(g,0,0,0,H,[[0,PL.top],[0.55,PL.mid],[1,PL.bot]]);
g.fillRect(0,0,W,H);g.restore();
g.save();g.globalCompositeOperation="lighter";
g.fillStyle=lg(g,0,H,0,H*0.5,[[0,PL.warm],[1,"rgba(255,144,62,0)"]]);
g.fillRect(0,H*0.5,W,H*0.5);g.restore();
g.save();g.globalAlpha=0.030;
for(var i=0;i<9000;i++){
  g.fillStyle=rnd(i*5.1)>0.5?"#fff":"#000";
  g.fillRect(rnd(i*1.7)*W,rnd(i*3.3)*H,1.5,1.5);
}
g.restore();
`;

const UI = String.raw`
function optionButton(cx,cy,label,hot){
  g.save();g.globalCompositeOperation="lighter";
  g.fillStyle=rg(g,cx,cy,4,58,[[0,"rgba(120,240,228,0.44)"],[0.5,"rgba(60,170,195,0.13)"],[1,"rgba(30,110,150,0)"]]);
  g.beginPath();g.arc(cx,cy,58,0,7);g.fill();g.restore();
  g.save();
  g.beginPath();g.arc(cx,cy,21,0,7);
  g.fillStyle=rg(g,cx-8,cy-8,2,26,[[0,"#f2fffd"],[0.5,"#7fe8de"],[1,"#186a7d"]]);g.fill();
  g.strokeStyle="rgba(220,255,252,0.95)";g.lineWidth=2.5;g.stroke();
  g.beginPath();g.arc(cx,cy,26,0,7);g.strokeStyle="rgba(160,240,235,0.34)";g.lineWidth=1.5;g.stroke();
  g.font="500 27px 'WenQuanYi Zen Hei','Droid Sans Fallback',sans-serif";g.textBaseline="middle";
  g.fillStyle="rgba(0,0,0,0.78)";g.fillText(label,cx+40,cy+2);
  g.fillStyle=hot?"#ffffff":"rgba(232,242,252,0.9)";g.fillText(label,cx+39,cy+1);
  g.restore();
}
optionButton(320,392,"询问图书馆的事",true);
optionButton(320,482,"提起那盏提灯");
optionButton(320,572,"保持沉默");
(function(){
  var bx=430,by=876,bw=1150,bh=150;
  g.save();
  g.fillStyle=rg(g,bx+bw/2,by+bh/2,100,760,[[0,"rgba(6,9,20,0.74)"],[1,"rgba(4,7,16,0.58)"]]);
  g.fillRect(bx,by,bw,bh);
  g.strokeStyle="rgba(206,220,246,0.22)";g.lineWidth=2;g.strokeRect(bx,by,bw,bh);
  g.fillStyle="rgba(196,214,244,0.5)";g.fillRect(bx,by,bw,2);
  g.strokeStyle="rgba(228,238,255,0.55)";g.lineWidth=2;
  g.beginPath();g.moveTo(bx,by+18);g.lineTo(bx,by);g.lineTo(bx+18,by);g.stroke();
  g.beginPath();g.moveTo(bx+bw-18,by+bh);g.lineTo(bx+bw,by+bh);g.lineTo(bx+bw,by+bh-18);g.stroke();
  g.fillStyle="rgba(8,12,24,0.84)";g.fillRect(bx+34,by-26,208,32);
  g.fillStyle="#e9d9ac";g.font="500 24px 'WenQuanYi Zen Hei',sans-serif";g.textBaseline="middle";
  g.fillText("派蒙",bx+58,by-9);
  g.fillStyle="rgba(242,246,255,0.97)";g.font="400 30px 'WenQuanYi Zen Hei',sans-serif";
  g.fillText("这里的书……好像是自己飞起来的。",bx+60,by+62);
  g.fillStyle="rgba(228,238,252,0.82)";g.font="400 26px 'WenQuanYi Zen Hei',sans-serif";
  g.fillText("小心点，别被砸到了。",bx+60,by+108);
  g.fillStyle="rgba(232,242,255,0.9)";
  var ax=bx+bw-52,ay=by+bh-28;
  g.beginPath();g.moveTo(ax-9,ay-5);g.lineTo(ax+9,ay-5);g.lineTo(ax,ay+7);g.closePath();g.fill();
  g.restore();
})();
g.save();g.font="400 23px 'WenQuanYi Zen Hei',sans-serif";
g.fillStyle="rgba(236,243,255,0.55)";g.fillText("蒙德 · 西风大教堂 · 藏书阁",64,58);g.restore();
`;

// ============================================================
//  MODULE: flying pages & books  (mid plane, additive-ish, depth-sorted)
// ============================================================
const PAGES = String.raw`
(function(){
  // one leaf: a curled quad with a spine edge. (x,y)=hinge, w,h, rot, curl, alpha
  function leaf(G,x,y,w,h,rot,curl,alpha,blur){
    G.save();G.translate(x,y);G.rotate(rot);
    var p=new Path2D();
    p.moveTo(0,0);
    p.bezierCurveTo(w*0.45,-h*0.10,w*0.85,-h*0.34,w*curl,-h*0.62);
    p.bezierCurveTo(w*1.12,-h*0.44,w*1.18,-h*0.10,w*1.06,h*0.30);
    p.bezierCurveTo(w*0.72,h*0.44,w*0.30,h*0.30,0,h*0.16);
    p.closePath();
    G.globalAlpha=alpha;
    G.fillStyle=lg(G,0,-h*0.6,w,0,[[0,"#3c4a78"],[0.35,"#8fa2cc"],[0.68,"#dfe8fa"],[1,"#aebddc"]]);
    G.fill(p);
    G.strokeStyle="rgba(226,236,255,0.55)";G.lineWidth=1.6;G.stroke(p);
    // ruled text lines
    G.save();G.clip(p);G.strokeStyle="rgba(70,90,140,0.34)";G.lineWidth=1.1;
    for(var k=1;k<7;k++){G.beginPath();G.moveTo(w*0.10,-h*0.62+h*0.14*k);G.lineTo(w*1.06,-h*0.62+h*0.16*k);G.stroke();}
    G.restore();
    // spine shadow
    G.strokeStyle="rgba(30,40,72,0.5)";G.lineWidth=2.4;
    G.beginPath();G.moveTo(0,0);G.lineTo(0,h*0.16);G.stroke();
    G.restore();
  }
  // an open book: two leaves in a V
  function book(G,x,y,s,rot,alpha){
    G.save();G.translate(x,y);G.rotate(rot);G.scale(s,s);
    G.globalAlpha=alpha;
    G.beginPath();G.moveTo(0,-26);G.lineTo(-58,-14);G.lineTo(-52,26);G.lineTo(0,20);G.closePath();
    G.fillStyle=lg(G,-58,0,0,0,[[0,"#2f3c66"],[0.5,"#8b9dc8"],[1,"#c9d6ee"]]);G.fill();
    G.strokeStyle="rgba(232,240,255,0.5)";G.lineWidth=1.6;G.stroke();
    G.beginPath();G.moveTo(0,-26);G.lineTo(58,-14);G.lineTo(52,26);G.lineTo(0,20);G.closePath();
    G.fillStyle=lg(G,0,0,58,0,[[0,"#e2eafa"],[0.5,"#b6c4e0"],[1,"#5d6b96"]]);G.fill();
    G.strokeStyle="rgba(232,240,255,0.5)";G.stroke();
    G.fillStyle="rgba(20,26,48,0.85)";G.fillRect(-3,-26,6,48);
    G.restore();
  }
  var i,x,y;
  // far, small, hazy books
  for(i=0;i<7;i++){
    book(m,rr(i*31.7,120,1800),rr(i*47.1,150,520),0.34+rnd(i*13)*0.22,rr(i*59.3,-0.5,0.5),0.42);
  }
  // mid pages — vary size a lot so they read as near/far, not as a texture
  for(i=0;i<13;i++){
    var px=rr(i*71.3,60,1860), py=rr(i*37.9,180,780);
    var sc=(i%4===0)?1.25:(i%3===0?0.62:0.95);
    leaf(m,px,py,rr(i*19.1,34,74)*sc,rr(i*23.3,26,52)*sc,rr(i*83.7,-1.4,1.4),0.85,0.5+rnd(i*11)*0.42,0.9);
  }
  // near, soft (out of focus) pages -> depth. Few and faint; they must not
  // compete with the character.
  for(i=0;i<3;i++){
    leaf(n,rr(i*97.1,120,1780),rr(i*53.3,200,700),rr(i*29.7,80,126),rr(i*41.3,62,98),rr(i*67.1,-1.4,1.4),0.9,0.20,1);
  }
})();
`;

// ============================================================
//  MODULE: petals / motes / birds
// ============================================================
const PETALS = String.raw`
(function(){
  for(var i=0;i<58;i++){
    var x=rr(i*41.3,0,W), y=rr(i*67.9,80,980), s=rr(i*23.1,4,11), rot=rr(i*91.7,0,6.28);
    m.save();m.translate(x,y);m.rotate(rot);m.globalAlpha=0.34+rnd(i*17)*0.46;
    m.beginPath();m.ellipse(0,0,s,s*0.52,0,0,7);
    m.fillStyle=lg(m,-s,0,s,0,[[0,"#f0dcea"],[1,"#b6a8cc"]]);m.fill();
    m.restore();
  }
})();
`;

const BIRDS = String.raw`
(function(){
  for(var i=0;i<6;i++){
    var x=rr(i*57.3,200,1700), y=rr(i*83.1,90,420), s=rr(i*29.9,7,17), ph=rnd(i*13)*0.6;
    m.save();m.translate(x,y);m.globalAlpha=0.55;
    m.strokeStyle="rgba(20,26,48,0.9)";m.lineWidth=2.2;
    m.beginPath();
    m.moveTo(-s,-s*0.3*(1-ph));
    m.quadraticCurveTo(-s*0.4,-s*0.75*(1-ph),0,-s*0.10);
    m.quadraticCurveTo(s*0.4,-s*0.75*(1-ph),s,-s*0.3*(1-ph));
    m.stroke();m.restore();
  }
})();
`;

// ============================================================
//  MODULE: one-point-perspective colonnade corridor (alternative background)
// ============================================================
const CORRIDOR = String.raw`
// one-point perspective colonnade. VP is a bright arched window at the far end.
var VPX=W*0.5, VPY=CFG.vpy||500;
var RIB=8;
var FLOORY=CFG.floor;   // horizon / floor contact height

// ---- far plane: deep hall + glowing window at the VP ----
far.fillStyle=lg(f,0,0,0,H,[[0,"#070d22"],[0.34,"#0e1a3c"],[0.66,"#1a2c56"],[1,"#243a68"]]);
f.fillRect(0,0,W,H);
// the far window
f.save();f.translate(VPX,VPY);
f.fillStyle="rgba(188,220,255,0.95)";
archSub(f,-72,144,600); f.fill();
f.fillStyle="rgba(240,248,255,0.9)";
archSub(f,-46,92,540); f.fill();
f.restore();
// glow around it
f.save();f.globalCompositeOperation="lighter";
f.fillStyle=rg(f,VPX,VPY+20,0,420,[[0,"rgba(176,212,255,0.55)"],[0.4,"rgba(120,168,240,0.18)"],[1,"rgba(80,130,220,0)"]]);
f.fillRect(VPX-440,VPY-420,880,880);f.restore();

// ---- corridor floor (mid plane), receding to the VP ----
m.fillStyle=lg(m,0,VPY,0,H,[[0,"#141c3e"],[0.5,"#0d1330"],[1,"#05070f"]]);
m.beginPath();
m.moveTo(VPX-120,VPY+10); m.lineTo(VPX+120,VPY+10);
m.lineTo(W+400,H+200); m.lineTo(-400,H+200);
m.closePath(); m.fill();
// floor guide lines converging on the VP
m.save();m.globalAlpha=0.5;m.strokeStyle="rgba(104,136,200,0.14)";m.lineWidth=1.6;
for(var i=-7;i<=7;i++){
  m.beginPath();m.moveTo(VPX+i*26,VPY+12);
  m.lineTo(VPX+i*(W*0.62),H+160);m.stroke();
}
for(var k=1;k<10;k++){
  var y=VPY+Math.pow(k/10,2.1)*(H-VPY)*1.9;
  if(y>H+80)break;
  var hw=(y-VPY)/(H-VPY)*(W*0.75);
  m.beginPath();m.moveTo(VPX-hw,y);m.lineTo(VPX+hw,y);m.stroke();
}
m.restore();

// ---- ribs: far -> near. Each rib = side pillars + a spanning arch ----
function rib(G,t){
  // t=0 far, 1 near
  var k=Math.pow(t,1.45);
  var halfW = 90 + k*(W*0.72);            // half width at the springing
  var spring = VPY - 40 + k*(FLOORY-VPY)*0.95;
  var foot   = spring + 60 + k*980;        // where the pillar meets the floor
  var pw     = 16 + k*96;                  // pillar width
  var dark   = 0.10 + k*0.78;
  var tint   = "rgba("+Math.round(16+46*(1-t))+","+Math.round(22+54*(1-t))+","+Math.round(52+78*(1-t))+","+(0.55+0.42*k).toFixed(2)+")";
  G.save();
  G.fillStyle=tint;
  // pillars
  G.beginPath();
  G.moveTo(VPX-halfW,spring); G.lineTo(VPX-halfW+pw,spring);
  G.lineTo(VPX-halfW+pw*1.35,foot); G.lineTo(VPX-halfW-pw*0.35,foot); G.closePath(); G.fill();
  G.beginPath();
  G.moveTo(VPX+halfW,spring); G.lineTo(VPX+halfW-pw,spring);
  G.lineTo(VPX+halfW-pw*1.35,foot); G.lineTo(VPX+halfW+pw*0.35,foot); G.closePath(); G.fill();
  // capital blocks
  G.fillStyle="rgba("+Math.round(30+60*(1-t))+","+Math.round(40+70*(1-t))+","+Math.round(86+90*(1-t))+","+(0.6+0.35*k).toFixed(2)+")";
  G.fillRect(VPX-halfW-pw*0.5,spring-10-k*22,pw*2,10+k*22);
  G.fillRect(VPX+halfW-pw*1.5,spring-10-k*22,pw*2,10+k*22);
  // spanning arch (thin band)
  G.strokeStyle=tint;
  G.lineWidth=8+k*46;
  G.beginPath();
  G.arc(VPX,spring,halfW,Math.PI,Math.PI*2,false);
  G.stroke();
  // ornament: a gold dot on each capital, only on nearer ribs
  if(t>0.45){
    G.save();G.globalCompositeOperation="lighter";
    G.fillStyle="rgba(255,214,140,"+(0.35*k).toFixed(2)+")";
    G.beginPath();G.arc(VPX-halfW+pw*0.5,spring-16-k*22,3+k*5,0,7);G.fill();
    G.beginPath();G.arc(VPX+halfW-pw*0.5,spring-16-k*22,3+k*5,0,7);G.fill();
    G.restore();
  }
  G.restore();
}
for(var ri=0;ri<=RIB;ri++){ rib(wg, ri/RIB); }
// light spilling from the far window: a soft pool, not a hard wedge
m.save();m.globalCompositeOperation="lighter";
// soft elliptical pool right under the VP (no hard-edged wedge)
m.fillStyle=rg(m,VPX,VPY+150,10,620,[[0,"rgba(178,214,255,0.32)"],[0.5,"rgba(150,196,255,0.10)"],[1,"rgba(140,186,250,0)"]]);
m.beginPath();m.ellipse(VPX,VPY+130,420,110,0,0,7);m.fill();
m.restore();
`;


// ============================================================
//  MODULE: aerial fog (far plane only => depth without touching mid)
// ============================================================
const FOG = String.raw`
// volumetric haze sitting in FRONT of the far wall but behind the mid plane
g.save();
g.globalCompositeOperation="source-over";
var fg2=g.createLinearGradient(0,CFG.winTop-120,0,CFG.floor+220);
fg2.addColorStop(0,"rgba(126,166,220,0.00)");
fg2.addColorStop(0.42,"rgba(126,166,220,0.30)");
fg2.addColorStop(0.78,"rgba(140,176,224,0.52)");
fg2.addColorStop(1,"rgba(150,184,228,0.30)");
g.fillStyle=fg2;
g.fillRect(0,CFG.winTop-120,W,CFG.floor+340);
g.restore();
`;

// ============================================================
//  scene configs
// ============================================================
const BASE = {
  floor:812, winBot:700, winTop:140, winW:190, winGap:138, winN:5,
  offsetX:0, lampX:1500, lampY:330, charX:900, charH:392,
  far:1, wall:1, columns:1, floorPlane:1, shaft:1, lamp:1, char:1,
  dust:1, frame:1, ui:1, pages:0, petals:0, birds:0, corridor:0,
  wallAlpha:1, midAlpha:1, bloomA:0.68, bloomB:0.44, nearBlur:3,
  palette:"night", vpy:500
};
const S = (o)=>Object.assign({}, BASE, o);

const SCENES = {
  // ---- e179: baseline full frame (library / cathedral interior) ----
  e179: S({}),
  // ---- e180: atmosphere pass — flying pages, petals, birds, thicker dust ----
  e180: S({ pages:1, petals:1, birds:1 }),
  // ---- e181: stronger light — volumetrics, warm pool, bloom ----
  e181: S({ pages:1, petals:1, bloomA:0.86, bloomB:0.58 }),
  // ---- e182: receding colonnade corridor (one-point perspective) ----
  e182: S({ corridor:1, far:0, wall:0, columns:0, lamp:1, pages:1, petals:1, charH:340, charX:830, floor:860 }),
  // ---- e183: aerial perspective study — deep fog on the far plane ----
  e183: S({ pages:1, petals:1, birds:1, fog:1 }),
  // ---- e184: maximum warm/cool split (moonlight blue vs ember orange) ----
  e184: S({ palette:"moon", pages:1, petals:1, birds:1, bloomA:0.92, bloomB:0.62,
            lampX:1430, lampY:300 }),
  // ---- e185: depth-of-field study — heavy far fog + defocused near plane ----
  e185: S({ fog:1, nearBlur:7, bloomA:0.80, bloomB:0.52, pages:1, petals:1 }),
  // ---- e186: low angle / close shot — figure reads at 1/2 height ----
  e186: S({ charH:600, charX:1370, floor:930, winTop:40, winBot:800,
            winW:250, winGap:180, winN:4, offsetX:-70, lampX:1690, lampY:250,
            pages:1, petals:1, birds:1, fog:1 }),
  // ---- e187: wide seven-bay nave — architecture dominates ----
  e187: S({ winN:7, winW:150, winGap:104, floor:806, charH:318, charX:960,
            lampX:1660, lampY:300, pages:1, petals:1, birds:1, fog:1 }),
  // ---- e188: time-of-day variant — dusk, warm key from the west ----
  e188: S({ palette:"dusk", pages:1, petals:1, birds:1, fog:1, bloomA:0.88, bloomB:0.58 }),
  // ---- e189: consolidated best recipe ----
  e189: S({ fog:1, nearBlur:3.5, pages:1, petals:1, birds:1, bloomA:0.76, bloomB:0.50 }),
  // ---- e190: final frame — ember grade, maximum atmosphere ----
  e190: S({ palette:"ember", fog:1, nearBlur:3.5, pages:1, petals:1, birds:1,
            bloomA:0.86, bloomB:0.56, lampX:1460, lampY:320 }),
};

const name = process.argv[2] || "e179";
const cfg = SCENES[name];
if(!cfg){ console.error("unknown scene: "+name); process.exit(1); }

const body = [
  RUNTIME,
  "var CFG="+JSON.stringify(cfg)+";",
  PRELUDE,
  PLANES,
  cfg.far?FAR_SKY:"",
  cfg.corridor?CORRIDOR:"",
  cfg.wall?FAR_WALL:"",
  cfg.floorPlane?MID_FLOOR:"",
  cfg.columns?MID_COLUMNS:"",
  cfg.shaft?MID_SHAFT:"",
  cfg.lamp?MID_LAMP:"",
  cfg.char?CHAR:"",
  cfg.birds?BIRDS:"",
  cfg.dust?DUST:"",
  cfg.petals?PETALS:"",
  cfg.pages?PAGES:"",
  cfg.frame?NEAR_FRAME:"",
  COMPOSITE,
  cfg.ui?UI:""
].join("\n");

process.stdout.write("<!DOCTYPE html>\n<html><head><meta charset=\"utf-8\"><style>html,body{margin:0;background:#000;overflow:hidden}canvas{display:block}</style></head><body><canvas id=\"c\" width=\"1920\" height=\"1080\"></canvas><script>\n"+body+"\n<\/script></body></html>\n");
