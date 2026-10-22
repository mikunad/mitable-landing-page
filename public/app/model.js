export const ACCENT='#E94C54';
export const PURPLE='#9B80D5';
export const DEMO_CODE='123456';
export const CITIES=[
 {name:'San Francisco, CA',region:'bay',lat:37.7749,lng:-122.4194,zips:['941']},
 {name:'Oakland, CA',region:'bay',lat:37.8044,lng:-122.2712,zips:['946']},
 {name:'San Jose, CA',region:'bay',lat:37.3382,lng:-121.8863,zips:['951']},
 {name:'Washington, DC',region:'dmv',lat:38.9072,lng:-77.0369,zips:['200','202','203','204','205']},
 {name:'Arlington, VA',region:'dmv',lat:38.8816,lng:-77.0910,zips:['222']},
 {name:'Alexandria, VA',region:'dmv',lat:38.8048,lng:-77.0469,zips:['223']},
 {name:'Bethesda, MD',region:'dmv',lat:38.9847,lng:-77.0947,zips:['208']},
 {name:'Silver Spring, MD',region:'dmv',lat:38.9907,lng:-77.0261,zips:['209']},
];
export function selectedLegIndex(stopIndex,stopCount){return Number.isInteger(stopIndex)&&stopIndex>=0&&stopIndex<stopCount&&stopCount>1?Math.min(stopIndex,stopCount-2):null}
export function selectionColors(stopIndex,stopCount){const leg=selectedLegIndex(stopIndex,stopCount);return{pins:Array.from({length:stopCount},(_,i)=>i===stopIndex?PURPLE:ACCENT),legs:Array.from({length:Math.max(0,stopCount-1)},(_,i)=>i===leg?PURPLE:ACCENT)}}
export function normalizePhone(value,country='+1'){const digits=value.replace(/\D/g,'');const local=country==='+1'&&digits.length===11&&digits.startsWith('1')?digits.slice(1):digits;return country==='+1'?local.length===10?country+local:null:local.length>=7&&local.length<=12?country+local:null}
export function validUsername(value){return /^[a-z0-9][a-z0-9._]{2,23}$/.test(value)&&!['admin','support','mitable','help','settings'].includes(value)}
export function cityForInput(value){const q=value.trim().toLowerCase();if(!q)return null;return CITIES.find(c=>c.name.toLowerCase()===q||c.name.split(',')[0].toLowerCase()===q||/^\d{5}$/.test(q)&&c.zips.includes(q.slice(0,3)))||null}
export function cityForCoordinates(lat,lng){const bay=lat>=37.1&&lat<=38.4&&lng>=-123&&lng<=-121.2,dmv=lat>=38.2&&lat<=39.4&&lng>=-77.8&&lng<=-76.4;if(!bay&&!dmv)return null;return CITIES.filter(c=>c.region===(bay?'bay':'dmv')).sort((a,b)=>((a.lat-lat)**2+(a.lng-lng)**2)-((b.lat-lat)**2+(b.lng-lng)**2))[0]}
export function emptyProfile(){return{firstName:'',lastName:'',username:'',city:null,interests:[],cuisines:[],diet:[],allergies:null,foodAvoid:'',budget:'Any',transport:[],car:false,access:[],activityAvoid:'',complete:false}}
export function safeRead(key,fallback){try{return JSON.parse(localStorage.getItem(key))??fallback}catch{return fallback}}
export function safeWrite(key,value){try{localStorage.setItem(key,JSON.stringify(value))}catch{/* State still works for the current visit. */}}
export function escapeHTML(value){return String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
export function directionsURL(plan){const stops=plan.stops;const q=new URLSearchParams({api:'1',origin:`${stops[0].lat},${stops[0].lng}`,destination:`${stops.at(-1).lat},${stops.at(-1).lng}`,travelmode:'walking'});if(stops.length>2)q.set('waypoints',stops.slice(1,-1).map(s=>`${s.lat},${s.lng}`).join('|'));return'https://www.google.com/maps/dir/?'+q}
export function distanceMiles(a,b){const rad=n=>n*Math.PI/180,dLat=rad(b.lat-a.lat),dLng=rad(b.lng-a.lng);return 3958.8*2*Math.asin(Math.sqrt(Math.sin(dLat/2)**2+Math.cos(rad(a.lat))*Math.cos(rad(b.lat))*Math.sin(dLng/2)**2))}
