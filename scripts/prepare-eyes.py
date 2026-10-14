"""Calibrated eye openings and iris regions for the ten original photos; Python + Pillow.
Run manually after changing calibration. CI uses the committed JSON.
Left/right below refer to image coordinates, not anatomy.
"""
from pathlib import Path
import json, math, hashlib
from PIL import Image, ImageDraw
ROOT=Path(__file__).resolve().parents[1]
# Each eye: corners, top/bottom midpoint, iris center, maximum x/y motion.
CAL={
'cover.jpg': [([360,530],[410,550],[385,526],[383,545],[383,537],2.6),([452,579],[485,593],[469,572],[468,590],[467,580],2.3)],
'rita-lee-maga.jpg': [([235,291],[292,296],[261,277],[262,304],[261,288],3.2),([374,286],[425,281],[399,273],[400,297],[400,282],3.2)],
'rita-lee-chapeu-inclinado.jpg': [([203,409],[246,431],[225,406],[223,427],[225,416],2.6),([300,466],[338,488],[320,456],[318,483],[317,468],2.5)],
'rita-lee-mao-chapeu.jpg': [([180,270],[209,274],[195,262],[194,280],[195,268],1.6),([250,277],[278,281],[264,270],[263,286],[264,276],1.4)],
'rita-lee-mutantes-frontal.jpg': [([167,119],[184,120],[175,115],[175,124],[176,119],1.0),([207,120],[222,119],[214,116],[215,124],[214,120],1.0)],
'rita-lee-flor-vermelha.jpg': [([322,286],[383,288],[350,272],[349,300],[349,282],3.6),([462,288],[527,295],[494,273],[496,302],[494,284],3.6)],
'rita-lee-mutantes-de-cima.jpg': [([315,284],[344,282],[330,276],[331,290],[329,282],1.6),([377,276],[404,272],[389,269],[390,281],[388,275],1.4)],
'rita-lee-gato-preto.jpg': [([199,481],[233,483],[216,472],[217,489],[220,480],1.8),([257,481],[294,480],[276,471],[276,490],[280,480],1.8)],
'rita-lee-sorriso-aberto.jpg': [([287,390],[330,392],[308,380],[309,400],[309,388],2.5),([386,390],[427,388],[406,379],[406,399],[406,386],2.5)],
'rita-lee-maga-sentada.jpg': [([79,173],[90,173],[84,170],[84,175.5],[84,172],0.65),([102,172],[113,172],[108,169],[108,174.5],[108,171.5],0.65)]
}
IRISES={
'cover.jpg':[[378,531,13,13],[465,577,11,12]],
'rita-lee-maga.jpg':[[261,285,15,15],[400,280,14,14]],
'rita-lee-chapeu-inclinado.jpg':[[221,408,12,13],[315,462,12,13]],
'rita-lee-mao-chapeu.jpg':[[194,264,8,8],[263,268,8,8]],
'rita-lee-mutantes-frontal.jpg':[[176,119,5,5],[214,119,5,5]],
'rita-lee-flor-vermelha.jpg':[[348,278,18,18],[495,280,18,18]],
'rita-lee-mutantes-de-cima.jpg':[[327,282,8,8],[392,276,7,7]],
'rita-lee-gato-preto.jpg':[[223,479,10,11],[282,477,11,11]],
'rita-lee-sorriso-aberto.jpg':[[309,384,12,12],[405,381,13,13]],
'rita-lee-maga-sentada.jpg':[[84,172,2.4,2.4],[108,171.5,2.4,2.4]]
}
def quad(a,b,c):
 return [((1-t)**2*a[0]+2*t*(1-t)*b[0]+t*t*c[0],(1-t)**2*a[1]+2*t*(1-t)*b[1]+t*t*c[1]) for t in [i/40 for i in range(41)]]
def dist(x,y,a,b):
 vx,vy=b[0]-a[0],b[1]-a[1];den=vx*vx+vy*vy
 t=max(0,min(1,((x-a[0])*vx+(y-a[1])*vy)/den)) if den else 0
 return math.hypot(x-a[0]-t*vx,y-a[1]-t*vy)
result={};sheet=Image.new('RGB',(600,10*125),'#ddd');sd=ImageDraw.Draw(sheet)
for i,(file,eyes) in enumerate(CAL.items()):
 path=ROOT/'public/images'/file;im=Image.open(path).convert('RGB');entry={'size':list(im.size),'sha256':hashlib.sha256(path.read_bytes()).hexdigest(),'eyes':[]};preview=im.copy()
 for eye_index,(left,right,top,bottom,center,motion) in enumerate(eyes):
  # A quadratic control at twice the midpoint offset passes through the measured midpoint.
  mid=[(left[k]+right[k])/2 for k in (0,1)]
  up=[2*top[k]-mid[k] for k in (0,1)];down=[2*bottom[k]-mid[k] for k in (0,1)]
  outline=quad(left,up,right)+quad(right,down,left)[1:]
  x=math.floor(min(p[0] for p in outline))-2;y=math.floor(min(p[1] for p in outline))-2
  w=math.ceil(max(p[0] for p in outline))-x+3;h=math.ceil(max(p[1] for p in outline))-y+3
  inside=Image.new('1',im.size);ImageDraw.Draw(inside).polygon(outline,fill=1)
  feather=max(.5,min(1.2,(bottom[1]-top[1])*.07));rim=min(.7,feather*.5)
  weights=[]
  for py in range(y,y+h):
   for px in range(x,x+w):
    distance=min(dist(px,py,a,b) for a,b in zip(outline,outline[1:]))
    t=max(0,min(1,(distance-rim)/feather)) if inside.getpixel((px,py)) else 0
    weights.append(round(255*t*t*(3-2*t)))
  iris=IRISES[file][eye_index]
  strategy='iris' if file in {'rita-lee-maga.jpg','rita-lee-flor-vermelha.jpg','rita-lee-sorriso-aberto.jpg'} else 'flow'
  gain=.45 if file in {'cover.jpg','rita-lee-chapeu-inclinado.jpg','rita-lee-mao-chapeu.jpg','rita-lee-mutantes-de-cima.jpg'} else .55
  bias=[round((left[0]+right[0])/2-iris[0],2),0]
  if strategy=='flow':
   gain=.48
   if file in {'rita-lee-mutantes-frontal.jpg','rita-lee-maga-sentada.jpg'}:gain=.3
   feather=max(1.5,(bottom[1]-top[1])*.3)
   weights=[]
   for py in range(y,y+h):
    for px in range(x,x+w):
     distance=min(dist(px,py,a,b) for a,b in zip(outline,outline[1:]))
     t=max(0,min(1,(distance-.6)/feather)) if inside.getpixel((px,py)) else 0
     weights.append(round(255*t*t*(3-2*t)))
  entry['eyes'].append({'bounds':[x,y,w,h],'center':iris[:2],'iris':iris,'strategy':strategy,'gazeBias':bias,'maxOffset':[round(iris[2]*gain,2),round(iris[3]*.24,2)],'weights':weights})
  mask=Image.new('L',(w,h));mask.putdata(weights);preview.paste(Image.new('RGB',(w,h),'red'),(x,y),mask.point(lambda v:v//2))
 result[file]=entry
 centers=[e['center'] for e in entry['eyes']];x0=min(p[0] for p in centers)-40;y0=min(p[1] for p in centers)-25;x1=max(p[0] for p in centers)+40;y1=max(p[1] for p in centers)+25
 crop=preview.crop((x0,y0,x1,y1));crop.thumbnail((590,98));sheet.paste(crop,(0,i*125+25));sd.text((0,i*125),file,fill='black')
(ROOT/'src/eyeCalibration.json').write_text(json.dumps(result,separators=(',',':'))+'\n')
sheet.save(ROOT.parent/'eye-calibration.jpg')
print('Prepared',len(result),'photos,',sum(len(v['eyes']) for v in result.values()),'eyes')
