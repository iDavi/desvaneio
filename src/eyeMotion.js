// Only event-driven frames: no polling or animation loop while idle.
export function createGazeMotion({draw,rest,requestFrame,cancelFrame,setTimer,clearTimer}) {
  let current=[0,0],target=[0,0],frameId=null,timer=null,last=null,disposed=false;
  function tick(time) {
    frameId=null;
    const dt=last===null?16:Math.min(50,time-last);last=time;
    const alpha=1-Math.exp(-dt/30);
    current=current.map((v,i)=>v+(target[i]-v)*alpha);
    const done=current.every((v,i)=>Math.abs(v-target[i])<.003);
    if(done)current=[...target];
    draw(current);
    if(!done)frameId=requestFrame(tick);
    else {last=null;if(!target.some(Boolean))rest();}
  }
  function aim(value){target=value;if(frameId===null)frameId=requestFrame(tick);}
  return {
    move(value, remaining=3000) {
      if(disposed)return;
      if(timer!==null)clearTimer(timer);
      aim(value);
      timer=setTimer(()=>{timer=null;aim([0,0]);},remaining);
    },
    reset() {
      if(timer!==null)clearTimer(timer);
      if(frameId!==null)cancelFrame(frameId);
      timer=frameId=null;last=null;current=target=[0,0];rest();
    },
    dispose(){this.reset();disposed=true;},
  };
}
