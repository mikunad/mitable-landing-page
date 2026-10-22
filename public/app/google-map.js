import {selectionColors,ACCENT} from './model.js';
import {pinHTML} from './ui.js';
let configPromise,libraryPromise;
export function getConfig(){return configPromise??=fetch('/api/config',{cache:'no-store'}).then(r=>{if(!r.ok)throw Error('Configuration unavailable');return r.json()}).catch(e=>{configPromise=null;throw e})}
export async function loadGoogle(){
 if(window.google?.maps?.Map)return window.google.maps;
 if(libraryPromise)return libraryPromise;
 const config=await getConfig();if(!config.googleMapsKey)throw Error('Google Maps key not configured');
 libraryPromise=new Promise((resolve,reject)=>{
  const script=document.createElement('script');script.id='google-maps-sdk';script.async=true;
  const timeout=setTimeout(()=>{script.remove();libraryPromise=null;reject(Error('Google Maps timed out'))},18000);
  window.__mitableGoogleReady=()=>{clearTimeout(timeout);resolve(window.google.maps)};
  script.onerror=()=>{clearTimeout(timeout);script.remove();libraryPromise=null;reject(Error('Google Maps unavailable'))};
  const params=new URLSearchParams({key:config.googleMapsKey,v:'weekly',language:'en',region:'US',loading:'async',callback:'__mitableGoogleReady'});
  script.src='https://maps.googleapis.com/maps/api/js?'+params;document.head.append(script);
 });return libraryPromise;
}
const dayStyles=()=>matchMedia('(prefers-color-scheme:dark)').matches?[
 {elementType:'geometry',stylers:[{color:'#292c2d'}]},{elementType:'labels.text.fill',stylers:[{color:'#aaa6a0'}]},{elementType:'labels.text.stroke',stylers:[{color:'#292c2d'}]},
 {featureType:'road',elementType:'geometry',stylers:[{color:'#494d4f'}]},{featureType:'road',elementType:'geometry.stroke',stylers:[{color:'#3a3d3e'}]},{featureType:'poi.park',elementType:'geometry',stylers:[{color:'#30473a'}]},{featureType:'water',elementType:'geometry',stylers:[{color:'#243843'}]},{featureType:'poi',elementType:'labels',stylers:[{visibility:'off'}]}
 ]:[{elementType:'geometry',stylers:[{color:'#ecebe5'}]},{elementType:'labels.text.fill',stylers:[{color:'#858982'}]},{featureType:'road',elementType:'geometry',stylers:[{color:'#ffffff'}]},{featureType:'poi.park',elementType:'geometry',stylers:[{color:'#cee0b8'}]},{featureType:'water',elementType:'geometry',stylers:[{color:'#c9dfe8'}]},{featureType:'poi',elementType:'labels',stylers:[{visibility:'off'}]}];
export class GoogleMapController{
 constructor(container,{onSelect,onReady,onError,onRoute,onPlace}={}){this.container=container;this.callbacks={onSelect,onReady,onError,onRoute,onPlace};this.markers=[];this.lines=[];this.routeCache=new Map();this.placeCache=new Map();this.generation=0;this.selected=null;this.destroyed=false;this.theme=matchMedia('(prefers-color-scheme:dark)');this.themeListener=()=>this.map?.setOptions({styles:dayStyles()});this.theme.addEventListener('change',this.themeListener)}
 async initialize(){
  try{const maps=await loadGoogle();if(this.destroyed)return;this.maps=maps;
   const errorHandler=()=>{if(!this.destroyed)this.callbacks.onError?.()};this.authFailure=errorHandler;window.gm_authFailure=errorHandler;
   this.map=new maps.Map(this.container,{center:{lat:37.76,lng:-122.42},zoom:14,disableDefaultUI:true,clickableIcons:false,gestureHandling:'greedy',styles:dayStyles(),keyboardShortcuts:false});
   this.resize=new ResizeObserver(()=>{if(!this.destroyed){maps.event.trigger(this.map,'resize');clearTimeout(this.fitTimer);this.fitTimer=setTimeout(()=>{if(!this.destroyed)this.fit()},120)}});this.resize.observe(this.container);
   this.map.addListener('click',()=>this.callbacks.onSelect?.(null));this.callbacks.onReady?.();
   if(this.plan)await this.showPlan(this.plan);
  }catch(e){if(!this.destroyed){console.warn('Map unavailable:',e.message);this.callbacks.onError?.()}}
 }
 createPin(stop,index){const maps=this.maps,controller=this;
  class PixelPin extends maps.OverlayView{
   onAdd(){this.button=document.createElement('button');this.button.type='button';this.button.className='map-pin';this.button.innerHTML=pinHTML(index+1);this.button.setAttribute('aria-label',`Stop ${index+1}: ${stop.name}`);this.button.addEventListener('click',()=>controller.callbacks.onSelect?.(index));maps.OverlayView.preventMapHitsAndGesturesFrom(this.button);this.getPanes().overlayMouseTarget.append(this.button);this.update()}
   draw(){const point=this.getProjection()?.fromLatLngToDivPixel(new maps.LatLng(stop.lat,stop.lng));if(point&&this.button){this.button.style.left=point.x+'px';this.button.style.top=point.y+'px'}}
   update(){if(this.button){this.button.classList.toggle('selected',controller.selected===index);this.button.setAttribute('aria-pressed',String(controller.selected===index));this.button.style.color=selectionColors(controller.selected,controller.plan.stops.length).pins[index]}}
   onRemove(){this.button?.remove()}
  }const pin=new PixelPin();pin.setMap(this.map);return pin;
 }
 async showPlan(plan){
  this.plan=plan;this.selected=null;if(!this.map)return;const generation=++this.generation;
  this.markers.forEach(p=>p.setMap(null));this.lines.forEach(l=>{l.line.setMap(null);l.casing.setMap(null)});this.markers=[];this.lines=[];
  plan.stops.forEach((s,i)=>this.markers.push(this.createPin(s,i)));
  for(let i=0;i<plan.stops.length-1;i++){const path=[plan.stops[i],plan.stops[i+1]];const casing=new this.maps.Polyline({map:this.map,path,strokeColor:'#ffffff',strokeOpacity:.95,strokeWeight:9,zIndex:1});const line=new this.maps.Polyline({map:this.map,path,strokeColor:ACCENT,strokeOpacity:1,strokeWeight:5,zIndex:2});this.lines.push({line,casing})}
  this.fit();const config=await getConfig();if(this.destroyed||generation!==this.generation)return;
  if(config.googlePlacesEnabled)plan.stops.forEach((stop,i)=>this.placeDetails(stop).then(place=>{if(!this.destroyed&&generation===this.generation&&place)this.callbacks.onPlace?.(i,place)}).catch(()=>{}));
  if(!config.googleRoutesEnabled){this.callbacks.onRoute?.(null,null);return}
  try{const {Route}=await this.maps.importLibrary('routes');const results=await Promise.all(plan.stops.slice(0,-1).map((s,i)=>{
    const cacheKey=plan.id+':'+i;if(!this.routeCache.has(cacheKey))this.routeCache.set(cacheKey,Route.computeRoutes({origin:{lat:s.lat,lng:s.lng},destination:{lat:plan.stops[i+1].lat,lng:plan.stops[i+1].lng},travelMode:'WALKING',fields:['path','distanceMeters','durationMillis']}));return this.routeCache.get(cacheKey);
   }));if(this.destroyed||generation!==this.generation)return;
   results.forEach(({routes},i)=>{const route=routes?.[0];if(!route?.path?.length)return;this.lines[i].line.setPath(route.path);this.lines[i].casing.setPath(route.path);this.callbacks.onRoute?.(i,{minutes:Math.ceil(route.durationMillis/60000),miles:route.distanceMeters/1609.344})});this.fit();
  }catch{if(!this.destroyed&&generation===this.generation)this.callbacks.onRoute?.(null,null)}
 }
 async placeDetails(stop){const key=stop.name+' '+stop.address;if(!this.placeCache.has(key))this.placeCache.set(key,(async()=>{const {Place}=await this.maps.importLibrary('places');const {places}=await Place.searchByText({textQuery:key,fields:['displayName','regularOpeningHours','googleMapsURI'],maxResultCount:1});return places?.[0]||null})());return this.placeCache.get(key)}
 select(index){this.selected=index;const colors=selectionColors(index,this.plan?.stops.length||0);this.markers.forEach(p=>p.update());this.lines.forEach((l,i)=>l.line.setOptions({strokeColor:colors.legs[i],zIndex:colors.legs[i]==='#9B80D5'?3:2}))}
 fit(){if(!this.map||!this.plan||document.documentElement.classList.contains('keyboard-open'))return;const bounds=new this.maps.LatLngBounds();this.plan.stops.forEach(s=>bounds.extend({lat:s.lat,lng:s.lng}));const search=this.container.parentElement.querySelector('.map-search'),hasSearch=search&&getComputedStyle(search).display!=='none';const top=hasSearch?168:112;this.map.fitBounds(bounds,{top,right:28,bottom:32,left:28})}
 recenter(lat,lng){if(this.map){this.map.panTo({lat,lng});this.map.setZoom(15)}}
 destroy(){this.destroyed=true;++this.generation;clearTimeout(this.fitTimer);this.resize?.disconnect();this.theme.removeEventListener('change',this.themeListener);this.markers.forEach(p=>p.setMap(null));this.lines.forEach(l=>{l.line.setMap(null);l.casing.setMap(null)});if(this.map)this.maps.event.clearInstanceListeners(this.map);if(window.gm_authFailure===this.authFailure)delete window.gm_authFailure}
}
