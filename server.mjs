import { createServer } from 'node:http';
import { createReadStream, statSync } from 'node:fs';
import { resolve, dirname, extname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

export const publicRoot = resolve(dirname(fileURLToPath(import.meta.url)), 'public');
try{process.loadEnvFile(resolve(publicRoot,'../.env'))}catch(e){if(e.code!=='ENOENT')throw e}
const appRoutes = new Set(['/app','/app/','/app/profile','/app/preferences','/auth/phone','/auth/code','/auth/sign-in','/onboarding/profile','/onboarding/preferences','/plan']);
const daytripRoutes = new Set(['/waitlist','/waitlist/','/invite','/invite/','/signin','/signin/']);
const mime={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.mp4':'video/mp4','.webmanifest':'application/manifest+json','.json':'application/json; charset=utf-8','.txt':'text/plain; charset=utf-8'};
const attempts=new Map();

async function submitWaitlist(req,res,config,emailFetch){
 const send=(status,message)=>res.writeHead(status,{'Content-Type':mime['.json'],'Cache-Control':'no-store'}).end(JSON.stringify({message}));
 if(!/^application\/json(?:;|$)/i.test(req.headers['content-type']||'')){send(415,'Use JSON.');return}
 let body='';
 try{for await(const chunk of req){body+=chunk;if(body.length>2048){send(413,'Request too large.');return}}}catch{send(400,'Invalid request.');return}
 let payload;try{payload=JSON.parse(body)}catch{send(400,'Invalid request.');return}
 if(payload.website){send(200,'Thanks.');return}
 const digits=String(payload.phone||'').replace(/\D/g,'');
 const phone=digits.length===10?'+1'+digits:digits.length===11&&digits[0]==='1'?'+'+digits:null;
 if(!phone){send(400,'Enter a valid US phone number.');return}
 const key=req.socket.remoteAddress||'unknown',now=Date.now(),recent=(attempts.get(key)||[]).filter(time=>now-time<600000);
 if(recent.length>=5){send(429,'Please try again later.');return}
 recent.push(now);attempts.set(key,recent);
 if(!config.RESEND_API_KEY||!config.WAITLIST_TO_EMAIL||!config.WAITLIST_FROM_EMAIL){send(503,'Waitlist sign-up is coming soon.');return}
 try{
  const response=await emailFetch('https://api.resend.com/emails',{method:'POST',headers:{Authorization:`Bearer ${config.RESEND_API_KEY}`,'Content-Type':'application/json'},body:JSON.stringify({from:config.WAITLIST_FROM_EMAIL,to:[config.WAITLIST_TO_EMAIL],subject:'New daytrip waitlist signup',text:`Phone number: ${phone}`}),signal:AbortSignal.timeout(10000)});
  if(!response.ok){console.error('Waitlist email failed:',response.status);send(502,'Could not join right now. Please try again.');return}
  send(200,'You’re on the list.');
 }catch(error){console.error('Waitlist email failed:',error.message);send(502,'Could not join right now. Please try again.')}
}

export function createAppServer(config=process.env,emailFetch=globalThis.fetch){
 return createServer((req,res)=>{
  res.setHeader('X-Content-Type-Options','nosniff');
  res.setHeader('Referrer-Policy','strict-origin-when-cross-origin');
  if(req.url==='/api/waitlist'&&req.method==='POST'){submitWaitlist(req,res,config,emailFetch);return}
  if(!['GET','HEAD'].includes(req.method)){res.writeHead(405,{'Allow':'GET, HEAD'}).end();return}
  let pathname;try{pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname)}catch{res.writeHead(400).end();return}
  if(pathname==='/healthz'){res.writeHead(200,{'Content-Type':'text/plain'}).end(req.method==='HEAD'?undefined:'ok');return}
  if(pathname==='/api/config'){
   const body=JSON.stringify({demoAuth:true,googleMapsKey:config.GOOGLE_MAPS_BROWSER_KEY||config.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY||'',googlePlacesEnabled:config.GOOGLE_PLACES_ENABLED==='true',googleRoutesEnabled:config.GOOGLE_ROUTES_ENABLED==='true'});
   res.writeHead(200,{'Content-Type':mime['.json'],'Cache-Control':'no-store'}).end(req.method==='HEAD'?undefined:body);return
  }
  const file=resolve(publicRoot,'.'+(pathname==='/'||daytripRoutes.has(pathname)?'/index.html':appRoutes.has(pathname)?'/app.html':pathname));
  if(!file.startsWith(publicRoot+sep)){res.writeHead(403).end();return}
  let stat;try{stat=statSync(file);if(!stat.isFile())throw Error()}catch{res.writeHead(404,{'Content-Type':'text/plain'}).end(req.method==='HEAD'?undefined:'Not found');return}
  const type=mime[extname(file)];if(!type){res.writeHead(403).end();return}
  let start=0,end=stat.size-1;
  if(req.headers.range){
   const m=/^bytes=(\d*)-(\d*)$/.exec(req.headers.range);
   if(!m||(!m[1]&&!m[2])){res.writeHead(416,{'Content-Range':`bytes */${stat.size}`}).end();return}
   if(!m[1])start=Math.max(0,stat.size-Number(m[2]));else{start=Number(m[1]);if(m[2])end=Math.min(Number(m[2]),end)}
   if(start>end||start>=stat.size||![start,end].every(Number.isSafeInteger)){res.writeHead(416,{'Content-Range':`bytes */${stat.size}`}).end();return}
  }
  res.writeHead(req.headers.range?206:200,{'Content-Type':type,'Content-Length':end-start+1,'Accept-Ranges':'bytes','Cache-Control':/\.(html|js|css|webmanifest|svg|png)$/.test(file)?'no-cache':'public, max-age=86400',...(pathname==='/sw.js'?{'Service-Worker-Allowed':'/'}:{}),...(req.headers.range?{'Content-Range':`bytes ${start}-${end}/${stat.size}`}:{})});
  if(req.method==='HEAD'){res.end();return}
  const stream=createReadStream(file,{start,end});stream.on('error',()=>res.destroy());res.on('close',()=>stream.destroy());stream.pipe(res);
 });
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url))createAppServer().listen(Number(process.env.PORT||3000),'0.0.0.0',()=>console.log('daytrip web listening'));
