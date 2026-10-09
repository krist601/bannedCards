export type AccountOrder={id:string;display_id:number;created_at:string;currency_code:string;total:number;status:string;metadata?:{payment_status?:string}|null;items?:{id:string;title:string;quantity:number;unit_price?:number;thumbnail?:string|null}[]};
async function request<T>(path:string,method='GET',body?:unknown):Promise<T>{
 const response=await fetch(`${process.env.NEXT_PUBLIC_MEDUSA_URL}${path}`,{method,credentials:'include',cache:'no-store',signal:AbortSignal.timeout(15000),headers:{'Content-Type':'application/json','x-publishable-api-key':process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY??''},...(body?{body:JSON.stringify(body)}:{})});
 if(!response.ok)throw new Error(response.status===401?'Please sign in again.':'Unable to contact the store.');return response.json();
}
export async function loadOrders(offset=0){return request<{orders:AccountOrder[];count:number}>(`/store/orders?limit=10&offset=${offset}&order=-created_at&fields=id,display_id,created_at,currency_code,total,status,metadata,*items`);}
export async function registerAccount(email:string,password:string,name:string){
 const response=await fetch(`${process.env.NEXT_PUBLIC_MEDUSA_URL}/auth/customer/emailpass/register`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email,password}),signal:AbortSignal.timeout(15000)});
 if(!response.ok)throw new Error('Unable to create account. Try signing in if you already registered.');
 const {token}=await response.json();
 const created=await fetch(`${process.env.NEXT_PUBLIC_MEDUSA_URL}/store/customers`,{method:'POST',credentials:'include',headers:{'Content-Type':'application/json','x-publishable-api-key':process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY??'',Authorization:`Bearer ${token}`},body:JSON.stringify({email,first_name:name}),signal:AbortSignal.timeout(15000)});
 if(!created.ok)throw new Error('Unable to finish creating the customer account.');
}

export type EmailVerification={verified:boolean;email:string};
export const loadEmailVerification=()=>request<EmailVerification>('/store/email-verification');
/** Sends or resends the verification email. `retryAfter` is set when the shopper asked again too soon. */
export async function sendEmailVerification(locale:'es'|'en'):Promise<{sent:boolean;verified?:boolean;retryAfter?:number;devLink?:string}>{
 const response=await fetch(`${process.env.NEXT_PUBLIC_MEDUSA_URL}/store/email-verification`,{method:'POST',credentials:'include',cache:'no-store',signal:AbortSignal.timeout(15000),headers:{'Content-Type':'application/json','x-publishable-api-key':process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY??''},body:JSON.stringify({locale})});
 const body=await response.json().catch(()=>({}));
 if(response.status===429)return {sent:false,retryAfter:body.retry_after};
 if(!response.ok)throw new Error('The email could not be sent. Please try again later.');
 return {sent:Boolean(body.sent),verified:body.verified,devLink:body.dev_link};
}
export async function confirmEmail(token:string):Promise<boolean>{
 const response=await fetch(`${process.env.NEXT_PUBLIC_MEDUSA_URL}/store/email-verification/confirm`,{method:'POST',cache:'no-store',signal:AbortSignal.timeout(15000),headers:{'Content-Type':'application/json','x-publishable-api-key':process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY??''},body:JSON.stringify({token})});
 return response.ok;
}

export type Profile={id:string;email:string;first_name:string;last_name:string;phone:string;created_at:string};
const toProfile=(c:Partial<Profile>&{id:string;email:string}):Profile=>({id:c.id,email:c.email,first_name:c.first_name??'',last_name:c.last_name??'',phone:c.phone??'',created_at:c.created_at??''});
export async function loadProfile(){return toProfile((await request<{customer:Partial<Profile>&{id:string;email:string}}>('/store/customers/me')).customer);}
/** Saves the editable profile fields. The email address and the cart link are never touched here. */
export async function saveProfile(values:{first_name:string;last_name:string;phone:string}){
 const trimmed={first_name:values.first_name.trim().slice(0,100),last_name:values.last_name.trim().slice(0,100),phone:values.phone.trim().slice(0,40)};
 return toProfile((await request<{customer:Partial<Profile>&{id:string;email:string}}>('/store/customers/me','POST',trimmed)).customer);
}
