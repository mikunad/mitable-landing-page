export function mountSystemTheme(){
 const scheme=matchMedia('(prefers-color-scheme: dark)');
 const mobile=matchMedia('(max-width: 759px)');
 function sync(){
  const mode=scheme.matches?'dark':'light';
  const videoBackground=document.querySelector('.auth-screen')||(mobile.matches&&document.querySelector('.landing'));
  document.documentElement.dataset.theme=mode;
  document.documentElement.style.colorScheme=mode;
  const meta=document.querySelector('meta[name="theme-color"]');
  if(meta)meta.content=videoBackground?'#151916':scheme.matches?'#191919':'#F7F5EF';
 }
 scheme.addEventListener('change',sync);
 mobile.addEventListener('change',sync);
 sync();
 return{sync,destroy(){scheme.removeEventListener('change',sync);mobile.removeEventListener('change',sync)}};
}
