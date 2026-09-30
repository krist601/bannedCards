export type AccountOrder={id:string;display_id:number;created_at:string;currency_code:string;total:number;status:string;items?:{id:string;title:string;quantity:number;thumbnail?:string}[]};
async function request<T>(path:string,method='GET',body?:unknown):Promise<T>{
 const response=await fetch(`${process.env.NEXT_PUBLIC_MEDUSA_URL}${path}`,{method,credentials:'include',cache:'no-store',signal:AbortSignal.timeout(15000),headers:{'Content-Type':'application/json','x-publishable-api-key':process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY??''},...(body?{body:JSON.stringify(body)}:{})});
 if(!response.ok)throw new Error(response.status===401?'Please sign in again.':'Unable to contact the store.');return response.json();
}
export async function loadOrders(offset=0){return request<{orders:AccountOrder[];count:number}>(`/store/orders?limit=10&offset=${offset}&order=-created_at&fields=id,display_id,created_at,currency_code,total,status,*items`);}
export async function registerAccount(email:string,password:string,name:string){
 const response=await fetch(`${process.env.NEXT_PUBLIC_MEDUSA_URL}/auth/customer/emailpass/register`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email,password}),signal:AbortSignal.timeout(15000)});
 if(!response.ok)throw new Error('Unable to create account. Try signing in if you already registered.');
 const {token}=await response.json();
 const created=await fetch(`${process.env.NEXT_PUBLIC_MEDUSA_URL}/store/customers`,{method:'POST',credentials:'include',headers:{'Content-Type':'application/json','x-publishable-api-key':process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY??'',Authorization:`Bearer ${token}`},body:JSON.stringify({email,first_name:name}),signal:AbortSignal.timeout(15000)});
 if(!created.ok)throw new Error('Unable to finish creating the customer account.');
}
