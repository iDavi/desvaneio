import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {createGazeMotion} from '../src/eyeMotion.js';
import {prepareIris,composeIris} from '../src/irisMotion.js';
const calibration=JSON.parse(readFileSync(new URL('../src/eyeCalibration.json',import.meta.url)));
const photos=Object.keys(calibration);
test('all ten original photos have valid matching calibration and preserve every unmasked pixel in nine directions',()=>{
 assert.equal(photos.length,10);
 for(const file of photos){
  const config=calibration[file];
  const image=readFileSync(new URL('../public/images/'+file,import.meta.url));
  assert.equal(createHash('sha256').update(image).digest('hex'),config.sha256,file);
  assert.equal(config.eyes.length,2);
  for(const eye of config.eyes){
   const [x,y,w,h]=eye.bounds;assert(x>=0&&y>=0&&x+w<=config.size[0]&&y+h<=config.size[1]);
   assert.equal(eye.weights.length,w*h);assert(eye.weights.some(v=>v>0));
   const source=Uint8ClampedArray.from({length:w*h*4},(_,i)=>i%4===3?255:(Math.floor(i/4)*17+i%4*67)%256);
   for(const gaze of [[0,0],[-1,0],[1,0],[0,-1],[0,1],[-1,-1],[1,-1],[-1,1],[1,1]]){
    const output=new Uint8ClampedArray(source.length);composeIris(prepareIris(source,eye),output,gaze);
    let changed=0;
    for(let pixel=0;pixel<w*h;pixel++){
     const start=pixel*4;
     if(!eye.weights[pixel]||!gaze.some(Boolean))assert.deepEqual(output.slice(start,start+4),source.slice(start,start+4),file);
     if(output[start]!==source[start])changed++;
    }
    if(gaze.some(Boolean))assert(changed>0,file);
   }
  }
 }
});
function harness(){
 let now=0,id=0;const frames=new Map(),timers=new Map(),draws=[];let rests=0;
 const motion=createGazeMotion({draw:g=>draws.push([...g]),rest:()=>rests++,requestFrame:cb=>{frames.set(++id,cb);return id;},cancelFrame:i=>frames.delete(i),setTimer:(cb,ms)=>{timers.set(++id,{cb,due:now+ms});return id;},clearTimer:i=>timers.delete(i)});
 function advance(ms){const end=now+ms;while(now<end){now=Math.min(end,now+16);for(const [i,t] of [...timers])if(t.due<=now){timers.delete(i);t.cb();}const queue=[...frames];frames.clear();for(const [,cb]of queue)cb(now);}}
 return {motion,advance,frames,timers,draws,get rests(){return rests;}};
}
test('starts quickly, rests three seconds after the last mouse move, then stops all frames',()=>{
 const h=harness();assert.equal(h.frames.size,0);assert.equal(h.timers.size,0);
 h.motion.move([1,-1]);h.advance(120);assert(h.draws.at(-1)[0]>.95);assert(h.draws.at(-1)[1]<-.95);
 h.advance(880);h.motion.move([-.5,1]);h.advance(2990);assert.equal(h.rests,0);
 h.advance(240);assert.deepEqual(h.draws.at(-1),[0,0]);assert.equal(h.rests,1);assert.equal(h.frames.size,0);assert.equal(h.timers.size,0);
 const count=h.draws.length;h.advance(5000);assert.equal(h.draws.length,count);
 h.motion.move([1,1]);h.advance(120);assert(h.draws.at(-1)[1]>.95);
});
test('disabling or unmounting cancels pending mouse calculations and inactivity timer',()=>{
 const h=harness();h.motion.move([1,1]);h.motion.dispose();assert.equal(h.frames.size,0);assert.equal(h.timers.size,0);h.motion.move([1,1]);h.advance(4000);assert.equal(h.draws.length,0);
});

test('the iris actually travels toward the left instead of just distorting in place',()=>{
 const eye=calibration['rita-lee-maga.jpg'].eyes[0];const [x,y,w,h]=eye.bounds;const [cx,cy,rx,ry]=eye.iris;
 const source=new Uint8ClampedArray(w*h*4);
 for(let row=0;row<h;row++)for(let col=0;col<w;col++){
  const k=(row*w+col)*4,dark=Math.hypot((x+col-cx)/rx,(y+row-cy)/ry)<.7;
  source.set([dark?20:180,dark?20:180,dark?20:180,255],k);
 }
 const prepared=prepareIris(source,eye);const moved=new Uint8ClampedArray(source.length);composeIris(prepared,moved,[-1,0]);
 const center=data=>{let sum=0,n=0;for(let i=0;i<w*h;i++)if(eye.weights[i]>200&&data[i*4]<70){sum+=i%w;n++;}return sum/n;};
 assert(center(source)-center(moved)>5,'leftward iris displacement should exceed five source pixels');
});
test('a new slideshow photo respects the remaining inactivity time',()=>{
 const h=harness();h.motion.move([-1,0],400);h.advance(350);assert.equal(h.rests,0);h.advance(300);assert.deepEqual(h.draws.at(-1),[0,0]);assert.equal(h.frames.size,0);
});
