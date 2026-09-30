import {normalizeSections,sectionDefaults} from '@/config/storefront-sections';
export async function loadStorefrontSettings(){
 if(process.env.NEXT_PUBLIC_COMMERCE_MODE==='demo')return sectionDefaults;
 try {
  const response=await fetch(`${process.env.NEXT_PUBLIC_MEDUSA_URL}/store/storefront-settings`,{headers:{'x-publishable-api-key':process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY??''},cache:'no-store',signal:AbortSignal.timeout(15000)});
  if(!response.ok)return sectionDefaults;
  return normalizeSections((await response.json()).settings);
 } catch {
  return sectionDefaults;
 }
}
