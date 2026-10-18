import { useEffect, useRef } from 'react';
import calibration from './eyeCalibration.json';
import { createGazeMotion } from './eyeMotion';
import { prepareIris, composeIris } from './irisMotion';
import { composeBlink, createBlinkMotion } from './blinkMotion';

export default function EyePhoto({photo,active,enabled,onLoad,pointerHistory}) {
  const image=useRef(null),canvas=useRef(null);
  useEffect(()=>{
    if(!active||!enabled||!photo.animateEyes)return;
    const capability=window.matchMedia('(any-hover: hover) and (any-pointer: fine)');
    let cleanup=null;
    function attach() {
      cleanup?.();cleanup=null;
      // Blinking runs on touch devices too; only gaze tracking needs a mouse.
      if(!capability.matches)pointerHistory.current=null;
      const config=calibration[photo.file],canvasElement=canvas.current;
      let context=null,patches=null,motion=null,blink=null,gaze=[0,0],closure=0;
      function render() {
        if(!patches)return;
        for(const patch of patches){
          composeIris(patch.prepared,patch.gazeOutput.data,gaze);
          composeBlink(patch.gazeOutput.data,patch.output.data,patch.eye,closure);
          context.putImageData(patch.output,...patch.eye.bounds.slice(0,2));
        }
        canvasElement.hidden=!closure&&!gaze.some(Boolean);
      }
      function prepare() {
        const im=image.current,c=canvasElement;
        if(!im?.complete||!im.naturalWidth||document.hidden)return false;
        if(im.naturalWidth!==config.size[0]||im.naturalHeight!==config.size[1])return false;
        c.width=im.naturalWidth;c.height=im.naturalHeight;
        context=c.getContext('2d');context.drawImage(im,0,0);
        patches=config.eyes.map(eye=>{
          const [x,y,w,h]=eye.bounds;
          return {eye,prepared:prepareIris(context.getImageData(x,y,w,h).data,eye),gazeOutput:context.createImageData(w,h),output:context.createImageData(w,h)};
        });
        motion=createGazeMotion({
          draw(value) {gaze=value;render();},
          rest(){gaze=[0,0];render();},
          requestFrame:cb=>requestAnimationFrame(cb),cancelFrame:id=>cancelAnimationFrame(id),
          setTimer:(cb,ms)=>window.setTimeout(cb,ms),clearTimer:id=>window.clearTimeout(id),
        });
        blink=createBlinkMotion({
          draw(value){closure=value;render();},
          requestFrame:cb=>requestAnimationFrame(cb),cancelFrame:id=>cancelAnimationFrame(id),
          setTimer:(cb,ms)=>window.setTimeout(cb,ms),clearTimer:id=>window.clearTimeout(id),
        });
        blink.start();
        return true;
      }
      function track(clientX,clientY,remaining=3000) {
        if(document.hidden)return;
        if(!motion&&!prepare())return;
        const box=image.current.getBoundingClientRect();
        // Match object-fit: cover, including its centered cropping.
        const [w,h]=config.size,scale=Math.max(box.width/w,box.height/h);
        const cx=config.eyes.reduce((sum,e)=>sum+e.center[0],0)/2;
        const cy=config.eyes.reduce((sum,e)=>sum+e.center[1],0)/2;
        const x=box.left+(box.width-w*scale)/2+cx*scale;
        const y=box.top+(box.height-h*scale)/2+cy*scale;
        motion.move([Math.tanh((clientX-x)/(box.width*.35)),Math.tanh((clientY-y)/(box.height*.18))],remaining);
      }
      function move(event){
        if(event.pointerType!=='mouse'||document.hidden)return;
        pointerHistory.current={x:event.clientX,y:event.clientY,time:performance.now()};
        track(event.clientX,event.clientY);
      }
      const reset=()=>{pointerHistory.current=null;motion?.reset();blink?.stop();};
      const resume=()=>{if(!document.hidden){if(!motion)prepare();else blink?.start();}};
      const visibility=()=>{reset();resume();};
      image.current.addEventListener('load',resume);
      resume();
      const previous=pointerHistory.current;
      if(capability.matches&&previous){const remaining=3000-(performance.now()-previous.time);if(remaining>0)track(previous.x,previous.y,remaining);}
      if(capability.matches)window.addEventListener('pointermove',move,{passive:true});
      window.addEventListener('blur',reset);
      document.addEventListener('visibilitychange',visibility);
      window.addEventListener('focus',resume);
      cleanup=()=>{
        window.removeEventListener('pointermove',move);window.removeEventListener('blur',reset);
        document.removeEventListener('visibilitychange',visibility);
        window.removeEventListener('focus',resume);image.current?.removeEventListener('load',resume);
        blink?.dispose();motion?.dispose();canvasElement.hidden=true;
        // Release the canvas backing store when this photo stops being active.
        canvasElement.width=canvasElement.height=0;
      };
    }
    attach();capability.addEventListener('change',attach);
    return ()=>{capability.removeEventListener('change',attach);cleanup?.();};
  },[active,enabled,photo.file,photo.animateEyes,pointerHistory]);
  return <div className={`cover-image${active?' is-active':''}`} aria-hidden={!active}>
    <img ref={image} src={`${import.meta.env.BASE_URL}images/${photo.file}`} alt={photo.alt}
      width="367" height="490" fetchPriority={active?'high':'auto'} loading="eager" onLoad={onLoad}/>
    <canvas ref={canvas} className="eye-canvas" hidden aria-hidden="true"/>
  </div>;
}
