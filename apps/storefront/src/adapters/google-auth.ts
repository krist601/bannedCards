type Pending = {state:string;createdAt:number;returnTo:string;link:boolean};
const key='banned-cards-google-sign-in';
const config=()=>({url:process.env.NEXT_PUBLIC_MEDUSA_URL??'',apiKey:process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY??''});
async function request(path:string,body?:unknown,token?:string,credentials:RequestCredentials='include'){
 const {url,apiKey}=config();
 const response=await fetch(`${url}${path}`,{method:body===undefined?'GET':'POST',credentials,cache:'no-store',signal:AbortSignal.timeout(20000),headers:{'Content-Type':'application/json','x-publishable-api-key':apiKey,...(token?{Authorization:`Bearer ${token}`}:{})},...(body===undefined?{}:{body:JSON.stringify(body)})});
 const data=await response.json().catch(()=>({}));
 if(!response.ok)throw new Error(data.code==='sign_in_to_link'?'Sign in with your password first, then link Google from your profile.':data.code==='google_email_mismatch'?'Choose the Google account with the same email as your store account.':data.code==='google_already_linked'?'This Google account is already linked to another customer.':'Google sign-in failed. Please try again.');
 return data;
}
export async function googleAvailable(){const data=await request('/store/auth/google');return data.enabled===true;}
export function safeReturnPath(path:string){return path.startsWith('/')&&!path.startsWith('//')&&!path.includes('\\')&&!/[\r\n]/.test(path)&&!path.startsWith('/auth/')?path:'/';}
export async function startGoogleSignIn(link=false){
 const data=await request('/auth/customer/google',{});
 const url=new URL(data.location);
 if(url.origin!=='https://accounts.google.com'||!url.searchParams.get('state'))throw new Error('Google sign-in failed. Please try again.');
 const pending:Pending={state:url.searchParams.get('state')!,createdAt:Date.now(),returnTo:safeReturnPath(window.location.pathname+window.location.search),link};
 // Store only the state nonce and navigation details, never authentication tokens.
 sessionStorage.setItem(key,JSON.stringify(pending));window.location.assign(url.href);
}
export function validateGoogleReturn(query:URLSearchParams,raw:string|null,now=Date.now()):Pending{
 if(!raw)throw new Error('Google sign-in expired. Please start again.');
 let pending:Pending;try{pending=JSON.parse(raw);}catch{throw new Error('Google sign-in expired. Please start again.');}
 if(!pending.state||query.get('state')!==pending.state||!Number.isFinite(pending.createdAt)||now-pending.createdAt>600000||now<pending.createdAt)throw new Error('Google sign-in expired. Please start again.');
 if(query.has('error'))throw new Error('Google sign-in was cancelled.');
 if(!query.get('code'))throw new Error('Google sign-in failed. Please try again.');
 return {...pending,returnTo:safeReturnPath(pending.returnTo),link:pending.link===true};
}
/** Progress of the return-from-Google sign-in, so the page can show what is happening. */
export type GoogleStep='verify'|'session'|'prepare'|'done';
const listeners=new Set<(step:GoogleStep)=>void>();let lastStep:GoogleStep='verify';
const emit=(step:GoogleStep)=>{lastStep=step;listeners.forEach(listener=>listener(step));};
export function onGoogleProgress(listener:(step:GoogleStep)=>void){listeners.add(listener);listener(lastStep);return()=>{listeners.delete(listener);};}
let completion:Promise<string>|undefined;
export function completeGoogleSignIn(){
 // Single exchange even when React Strict Mode invokes effects twice.
 if(completion)return completion;
 completion=(async()=>{
  const query=new URLSearchParams(window.location.search);
  const raw=sessionStorage.getItem(key);sessionStorage.removeItem(key);
  window.history.replaceState(null,'',window.location.pathname);
  emit('verify');
  const pending=validateGoogleReturn(query,raw);
  const callbackQuery=new URLSearchParams({code:query.get('code')!,state:query.get('state')!});
  const result=await request(`/auth/customer/google/callback?${callbackQuery}`,{});
  if(!result.token||result.mfa_required||result.verification_required)throw new Error('Google sign-in failed. Please try again.');
  await request('/store/auth/google/complete',{link:pending.link},result.token);
  emit('session');
  // Omit the old session so refresh uses the Google identity, including new registrations.
  const refreshed=await request('/auth/token/refresh',{},result.token,'omit');
  if(!refreshed.token||refreshed.mfa_required||refreshed.verification_required)throw new Error('Google sign-in failed. Please try again.');
  await request('/auth/session',{},refreshed.token);
  emit('prepare');
  const session=await request('/store/customers/me');
  if(!session.customer?.id)throw new Error('Google sign-in failed. Please try again.');
  emit('done');
  return pending.returnTo;
 })();
 return completion;
}
