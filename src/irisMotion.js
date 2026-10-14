const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const smooth=v=>{const t=clamp(v,0,1);return t*t*(3-2*t);};
// Separate the photographed iris from the eye whites once, before animation.
export function prepareIris(source,eye){
 const [x,y,w,h]=eye.bounds;
 const [gx,gy,rx,ry]=eye.iris;
 const cx=gx-x,cy=gy-y;
 const radius=(px,py)=>Math.hypot((px-cx)/rx,(py-cy)/ry);
 const alpha=(px,py)=>smooth((1-radius(px,py))*Math.min(rx,ry)+.5);
 const donors=[];
 for(let py=0;py<h;py++)for(let px=0;px<w;px++){
  if(eye.weights[py*w+px]>200&&radius(px,py)>1.12){
   const k=(py*w+px)*4;
   donors.push({x:px,y:py,color:Array.from(source.slice(k,k+3))});
  }
 }
 const base=new Uint8ClampedArray(source),iris=new Uint8ClampedArray(source.length);
 for(let py=0;py<h;py++){
  const whites=[0,0,0];let total=0;
  for(const d of donors){const weight=Math.exp(-((d.y-py)**2)/12);total+=weight;for(let c=0;c<3;c++)whites[c]+=d.color[c]*weight;}
  if(total)for(let c=0;c<3;c++)whites[c]/=total;
  for(let px=0;px<w;px++){
   const k=(py*w+px)*4,a=alpha(px,py);
   if(!a)continue;
   for(let c=0;c<3;c++)base[k+c]=source[k+c]*(1-a)+whites[c]*a;
   let nearest=k;
   // Complete only the tiny iris area hidden by the lid, using the nearest
   // visible iris pixels. This prevents lashes moving with the iris.
   if(eye.weights[py*w+px]<220){
    let best=Infinity;
    for(let yy=0;yy<h;yy++)for(let xx=0;xx<w;xx++){
     if(eye.weights[yy*w+xx]<220||radius(xx,yy)>.9)continue;
     const distance=(xx-px)**2+(yy-py)**2;
     if(distance<best){best=distance;nearest=(yy*w+xx)*4;}
    }
   }
   for(let c=0;c<3;c++)iris[k+c]=source[nearest+c];
   iris[k+3]=Math.round(a*255);
  }
 }
 return {source,base,iris,eye};
}
export function composeIris(prepared,output,gaze){
 const {source,base,iris,eye}=prepared;
 const [,,w,h]=eye.bounds;
 const dx=gaze[0]*eye.maxOffset[0],dy=gaze[1]*eye.maxOffset[1];
 if(!dx&&!dy){output.set(source);return;}
 const strength=smooth(Math.hypot(dx,dy));
 for(let py=0;py<h;py++)for(let px=0;px<w;px++){
  const k=(py*w+px)*4,clip=eye.weights[py*w+px]/255*strength;
  if(!clip){for(let c=0;c<4;c++)output[k+c]=source[k+c];continue;}
  const sx=px-dx,sy=py-dy,ix=Math.floor(sx),iy=Math.floor(sy),fx=sx-ix,fy=sy-iy;
  // Premultiplied-alpha interpolation avoids dark outlines on the cutout.
  let alpha=0;const colors=[0,0,0];
  for(const [ox,oy,weight]of [[0,0,(1-fx)*(1-fy)],[1,0,fx*(1-fy)],[0,1,(1-fx)*fy],[1,1,fx*fy]]){
   const x=ix+ox,y=iy+oy;if(x<0||y<0||x>=w||y>=h)continue;
   const p=(y*w+x)*4,a=iris[p+3]/255*weight;alpha+=a;
   for(let c=0;c<3;c++)colors[c]+=iris[p+c]*a;
  }
  for(let c=0;c<3;c++)output[k+c]=source[k+c]*(1-clip)+(base[k+c]*(1-alpha)+colors[c])*clip;
  output[k+3]=255;
 }
}
