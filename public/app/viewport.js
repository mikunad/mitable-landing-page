// Keep the app inside the visible viewport, including when the keyboard opens.
// Pinch zoom retains normal browser panning rather than relaying out the app.
export function mountViewport(win=window,doc=document){
 const viewport=win.visualViewport;
 let frame,baseline=viewport?.height||win.innerHeight,width=win.innerWidth;
 const update=()=>{
  frame=undefined;
  if(viewport&&viewport.scale!==1)return;
  const height=viewport?.height||win.innerHeight;
  const top=viewport?.offsetTop||0;
  const editable=doc.activeElement?.matches('input,textarea,select,[contenteditable=true]');
  if(width!==win.innerWidth){width=win.innerWidth;baseline=height}
  const wasKeyboard=doc.documentElement.classList.contains('keyboard-open');
  const keyboard=Boolean((editable||wasKeyboard)&&baseline-height>100);
  if(!keyboard&&!editable)baseline=height;
  doc.documentElement.style.setProperty('--app-height',`${height}px`);
  doc.documentElement.style.setProperty('--app-top',`${top}px`);
  doc.documentElement.classList.toggle('keyboard-open',keyboard);
  const field=doc.activeElement;
  const scroller=keyboard&&field?.closest('.form-fields,.preferences-content,.sheet-inner');
  if(scroller){
   const visible=scroller.getBoundingClientRect(),input=field.getBoundingClientRect();
   if(input.bottom>visible.bottom-12)scroller.scrollTop+=input.bottom-visible.bottom+12;
   else if(input.top<visible.top+12)scroller.scrollTop-=visible.top+12-input.top;
  }
 };
 const schedule=()=>{if(frame===undefined)frame=win.requestAnimationFrame(update)};
 viewport?.addEventListener('resize',schedule);
 viewport?.addEventListener('scroll',schedule);
 win.addEventListener('resize',schedule);
 doc.addEventListener('focusin',schedule);
 doc.addEventListener('focusout',schedule);
 update();
 return()=>{
  if(frame!==undefined)win.cancelAnimationFrame(frame);
  viewport?.removeEventListener('resize',schedule);
  viewport?.removeEventListener('scroll',schedule);
  win.removeEventListener('resize',schedule);
  doc.removeEventListener('focusin',schedule);
  doc.removeEventListener('focusout',schedule);
 };
}
