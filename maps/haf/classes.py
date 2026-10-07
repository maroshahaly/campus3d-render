from hafp import *
from PIL import Image, ImageDraw
import collections, sys
h=Hafp('../send/HM_LE_3d.hafp.head'); L=int(sys.argv[1]); W,S,E,N=[float(x) for x in sys.argv[2].split(',')]
shapes=collections.defaultdict(list)
for (i1,i2,i3),loc in h.iter_locs(L):
    if loc[1]+loc[2]>h.size or loc[2]<=4: continue
    bw,bs,be,bn=parcel_bbox(h,L,i1,i2,i3)
    if be<W or bw>E or bn<S or bs>N: continue
    p=h.parcel(L,i1,i2,i3)
    for typ,Sx,ln in layer_table(p):
        if ln<=4: continue
        ng=(u32(p,Sx)>>23)&0xff
        for g in range(ng):
            G=Sx+u32(p,Sx+4+8*g)*2; cls=p[G+1]
            for b in range(p[G]):
                e=G+2+b*6; bt=p[e+1]>>6; P=G+u32(p,e+2)*2; hh=u16(p,P)
                base=P+4 if bt==2 else P+2
                it = P+4+4*hh+6*u16(p,P+2) if bt==2 else P+2+4*hh
                for _ in range(p[e]|(p[e+1]&0x3f)<<8):
                    sz=(p[it]&0x1f)*2; st=u16(p,it+2); c=u16(p,it+4)&0x7ff
                    attr=u16(p,it+(10 if bt==2 else 6))
                    pts=[struct.unpack_from('<HH',p,base+(st+i)*4) for i in range(c)]
                    shapes[(cls,bt)].append((attr,[(bw+x/11250*(be-bw), bs+y/7500*(bn-bs)) for x,y in pts], pts))
                    if sz==0: break
                    it+=sz
keys=sorted(shapes); cols=6; tw=300; th=int(tw*(N-S)/(E-W)*1.2)
img=Image.new('RGB',(cols*tw,((len(keys)+cols-1)//cols)*(th+16)),'white'); dr=ImageDraw.Draw(img)
for k,key in enumerate(keys):
    ox=(k%cols)*tw; oy=(k//cols)*(th+16)
    attrs=collections.Counter(a for a,_,_ in shapes[key])
    dr.text((ox+2,oy+2),f'{key} n={len(shapes[key])} {[hex(a) for a,_ in attrs.most_common(3)]}',fill='black')
    for a,ll,pts in shapes[key]:
        xy=[(ox+(x-W)/(E-W)*tw, oy+16+th-(y-S)/(N-S)*th) for x,y in ll]
        if key[1]==2:
            if len(xy)>2: dr.polygon(xy,fill=(90,140,220))
        elif len(xy)>1: dr.line(xy,fill=(200,40,40))
    dr.rectangle([ox,oy+16,ox+tw-1,oy+16+th],outline='gray')
img.save(sys.argv[3])
