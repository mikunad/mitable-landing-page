// The handle owns the gesture; scrolling the cards or stops keeps its normal behavior.
export function mountDrawer(view,drawer,{onChange,canExpand=()=>true}){
 let mode='preview',drag=null,previewHeight=360,snaps={},suppressClickUntil=0,frame;
 const clamp=(value,min,max)=>Math.max(min,Math.min(value,max));
 const children=new ResizeObserver(schedule);
 const viewport=new ResizeObserver(schedule);

 function measure(){
  frame=undefined;
  const height=view.clientHeight;
  if(!height)return;
  if(mode!=='details'&&drawer.children.length){
   const style=getComputedStyle(drawer);
   previewHeight=Math.ceil([...drawer.children].reduce((sum,child)=>sum+child.getBoundingClientRect().height,0)+parseFloat(style.paddingTop)+parseFloat(style.paddingBottom));
  }
  const mapRoom=height>=640?240:144;
  const preview=clamp(previewHeight,Math.min(280,height-96),height-96);
  snaps={peek:Math.min(104,preview),preview,details:height-mapRoom};
  // Very short viewports can still show the complete preview; details scroll inside.
  snaps.details=Math.max(preview,snaps.details);
  view.style.setProperty('--drawer-preview-height',`${preview}px`);
  view.style.setProperty('--drawer-detail-height',`${snaps.details}px`);
  view.style.setProperty('--drawer-peek-height',`${snaps.peek}px`);
 }
 function schedule(){if(frame===undefined)frame=requestAnimationFrame(measure)}
 function refresh(expanded){
  if(expanded)mode='details';else if(mode==='details')mode='preview';
  view.classList.toggle('drawer-peek',mode==='peek');
  children.disconnect();
  if(!expanded)[...drawer.children].forEach(child=>children.observe(child));
  measure();
 }
 function settle(next){
  const focusHandle=document.activeElement===drawer.querySelector('.drawer-handle');
  mode=next;view.classList.remove('drawer-dragging');
  view.style.removeProperty('--drawer-height');
  onChange(next);
  if(focusHandle)drawer.querySelector('.drawer-handle')?.focus({preventScroll:true});
 }
 const modes=()=>canExpand()?['peek','preview','details']:['peek','preview'];
 function down(event){
  // A fresh tap is intentional, even immediately after a drag.
  if(event.isPrimary)suppressClickUntil=0;
  const handle=event.target.closest('.drawer-handle');
  if(!handle||drag||!event.isPrimary||event.button!==0)return;
  measure();
  drag={id:event.pointerId,handle,startY:event.clientY,height:drawer.getBoundingClientRect().height,moved:false,samples:[{y:event.clientY,time:event.timeStamp}]};
  handle.setPointerCapture(event.pointerId);
 }
 function move(event){
  if(!drag||event.pointerId!==drag.id)return;
  const distance=drag.startY-event.clientY;
  if(!drag.moved&&Math.abs(distance)<4)return;
  drag.moved=true;view.classList.add('drawer-dragging');
  view.style.setProperty('--drawer-height',`${clamp(drag.height+distance,snaps.peek,canExpand()?snaps.details:snaps.preview)}px`);
  drag.samples.push({y:event.clientY,time:event.timeStamp});
  drag.samples=drag.samples.filter(sample=>event.timeStamp-sample.time<100);
  event.preventDefault();
 }
 function end(event){
  if(!drag||event.pointerId!==drag.id)return;
  const gesture=drag;drag=null;
  if(gesture.handle.hasPointerCapture(event.pointerId))gesture.handle.releasePointerCapture(event.pointerId);
  if(!gesture.moved)return;
  suppressClickUntil=performance.now()+400;
  if(event.type!=='pointerup'){settle(mode);return}
  const sample=gesture.samples[0],elapsed=event.timeStamp-sample.time;
  const velocity=elapsed>0&&elapsed<160?(sample.y-event.clientY)/elapsed:0;
  const projected=drawer.getBoundingClientRect().height+clamp(velocity,-2,2)*140;
  const next=modes().reduce((best,candidate)=>Math.abs(snaps[candidate]-projected)<Math.abs(snaps[best]-projected)?candidate:best,'peek');
  settle(next);
 }
 function click(event){
  // A drag is followed by a synthetic click in mobile browsers. Don't toggle twice.
  if(performance.now()<suppressClickUntil&&event.detail!==0){event.preventDefault();event.stopPropagation();return}
  if(!event.target.closest('.drawer-handle'))return;
  settle(mode==='peek'?'preview':mode==='preview'&&canExpand()?'details':'preview');
 }
 function key(event){
  if(!event.target.closest('.drawer-handle'))return;
  const options=modes(),index=options.indexOf(mode);
  const next=event.key==='ArrowUp'?options[Math.min(index+1,options.length-1)]:event.key==='ArrowDown'?options[Math.max(index-1,0)]:event.key==='Home'?'peek':event.key==='End'?options.at(-1):null;
  if(next){event.preventDefault();settle(next)}
 }
 drawer.addEventListener('pointerdown',down);
 drawer.addEventListener('pointermove',move);
 drawer.addEventListener('pointerup',end);
 drawer.addEventListener('pointercancel',end);
 drawer.addEventListener('lostpointercapture',end);
 drawer.addEventListener('click',click,true);
 drawer.addEventListener('keydown',key);
 viewport.observe(view);
 return {refresh,openPreview(){settle('preview')},destroy(){
  if(frame!==undefined)cancelAnimationFrame(frame);
  children.disconnect();viewport.disconnect();
  drawer.removeEventListener('pointerdown',down);drawer.removeEventListener('pointermove',move);drawer.removeEventListener('pointerup',end);drawer.removeEventListener('pointercancel',end);drawer.removeEventListener('lostpointercapture',end);drawer.removeEventListener('click',click,true);drawer.removeEventListener('keydown',key);
 }};
}
