import test from 'node:test';
import assert from 'node:assert/strict';
import {composeBlink,createBlinkMotion} from '../src/blinkMotion.js';

test('a blink closes and reopens, sleeps between blinks, and cancels on disposal',()=>{
 let id=0;const timers=new Map(),frames=new Map(),draws=[];
 const blink=createBlinkMotion({draw:v=>draws.push(v),random:()=>0,
  setTimer:(cb,ms)=>{timers.set(++id,{cb,ms});return id;},clearTimer:id=>timers.delete(id),
  requestFrame:cb=>{frames.set(++id,cb);return id;},cancelFrame:id=>frames.delete(id)});
 const frame=time=>{const callbacks=[...frames.values()];frames.clear();callbacks.forEach(cb=>cb(time));};
 blink.start();blink.start();assert.equal(timers.size,1);assert.equal(frames.size,0);
 const timer=[...timers.values()][0];assert.equal(timer.ms,1000);timers.clear();timer.cb();
 frame(0);frame(90);assert.equal(draws.at(-1),1);frame(120);assert.equal(draws.at(-1),1);
 frame(260);assert.equal(draws.at(-1),0);assert.equal(frames.size,0);assert.equal(timers.size,1);
 blink.stop();assert.equal(timers.size,0);blink.start();assert.equal(timers.size,1);
 const pending=timers.values().next().value;timers.clear();pending.cb();blink.dispose();assert.equal(frames.size,0);assert.equal(timers.size,0);
 blink.start();assert.equal(timers.size,0);
});

test('open eyes restore exact pixels and blinks keep the patch border unchanged',()=>{
 const w=12,h=12,source=Uint8ClampedArray.from({length:w*h*4},(_,i)=>i%256),out=new Uint8ClampedArray(source.length);
 const eye={bounds:[0,0,w,h],weights:Array.from({length:w*h},(_,i)=>i%w>2&&i%w<9&&Math.floor(i/w)>3&&Math.floor(i/w)<9?255:0)};
 composeBlink(source,out,eye,0);assert.deepEqual(out,source);
 composeBlink(source,out,eye,1);assert.notDeepEqual(out,source);
 for(let y=0;y<h;y++)for(let x=0;x<w;x++)if(x===0||y===0||x===w-1||y===h-1){const k=(y*w+x)*4;assert.deepEqual(out.slice(k,k+4),source.slice(k,k+4));}
});
