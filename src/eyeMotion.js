// Inverse flow sampling preserves the lid boundary and never accumulates edits.
export function warpEye(source, output, eye, gaze) {
  const [,,width,height] = eye.bounds;
  const weightAt = (x,y) => x<0||y<0||x>=width||y>=height ? 0 : eye.weights[y*width+x]/255;
  for(let y=0;y<height;y++) for(let x=0;x<width;x++) {
    const k=(y*width+x)*4;
    if(!eye.weights[y*width+x] || (!gaze[0]&&!gaze[1])) {
      for(let c=0;c<4;c++) output[k+c]=source[k+c];
      continue;
    }
    let sx=x,sy=y;
    for(let step=0;step<8;step++) {
      const ix=Math.floor(sx),iy=Math.floor(sy),fx=sx-ix,fy=sy-iy;
      const weight=(weightAt(ix,iy)*(1-fx)+weightAt(ix+1,iy)*fx)*(1-fy)
        +(weightAt(ix,iy+1)*(1-fx)+weightAt(ix+1,iy+1)*fx)*fy;
      sx-=gaze[0]*eye.maxOffset[0]*weight/8;
      sy-=gaze[1]*eye.maxOffset[1]*weight/8;
    }
    sx=Math.max(0,Math.min(width-1,sx));sy=Math.max(0,Math.min(height-1,sy));
    const ix=Math.floor(sx),iy=Math.floor(sy),fx=sx-ix,fy=sy-iy;
    const a=(iy*width+ix)*4,b=(iy*width+Math.min(width-1,ix+1))*4;
    const c=(Math.min(height-1,iy+1)*width+ix)*4,d=(Math.min(height-1,iy+1)*width+Math.min(width-1,ix+1))*4;
    for(let channel=0;channel<3;channel++) output[k+channel]=(source[a+channel]*(1-fx)+source[b+channel]*fx)*(1-fy)+(source[c+channel]*(1-fx)+source[d+channel]*fx)*fy;
    output[k+3]=255;
  }
}

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
    move(value) {
      if(disposed)return;
      if(timer!==null)clearTimer(timer);
      aim(value);
      timer=setTimer(()=>{timer=null;aim([0,0]);},3000);
    },
    reset() {
      if(timer!==null)clearTimer(timer);
      if(frameId!==null)cancelFrame(frameId);
      timer=frameId=null;last=null;current=target=[0,0];rest();
    },
    dispose(){this.reset();disposed=true;},
  };
}
