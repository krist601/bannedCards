"use client";
import {useEffect,useState} from 'react';
import {googleAvailable,startGoogleSignIn} from '@/adapters/google-auth';
import {useLocale} from './locale-provider';
export function GoogleButton({link=false}:{link?:boolean}){
 const {t}=useLocale();const [enabled,setEnabled]=useState(false),[checking,setChecking]=useState(true),[busy,setBusy]=useState(false),[error,setError]=useState('');
 useEffect(()=>{let active=true;googleAvailable().then(value=>{if(active)setEnabled(value);}).catch(()=>{}).finally(()=>{if(active)setChecking(false);});return()=>{active=false;};},[]);
 async function start(){setBusy(true);setError('');try{await startGoogleSignIn(link);}catch(error){setError(error instanceof Error?error.message:'Google sign-in failed. Please try again.');setBusy(false);}}
 return <div className="google-sign-in"><button className="google-button" type="button" disabled={!enabled||busy||checking} onClick={()=>void start()}><svg viewBox="0 0 48 48" width="20" height="20" aria-hidden="true"><path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.9 6.1C12.4 13.6 17.7 9.5 24 9.5z"/><path fill="#4285F4" d="M46.1 24.6c0-1.6-.1-3.1-.4-4.6H24v9h12.4c-.5 2.9-2.2 5.3-4.6 6.9l7.4 5.7c4.3-4 6.9-9.9 6.9-17z"/><path fill="#FBBC05" d="M10.5 28.7c-.5-1.4-.8-2.9-.8-4.7s.3-3.3.8-4.7l-7.9-6.1C.9 16.4 0 20.1 0 24s.9 7.6 2.6 10.8l7.9-6.1z"/><path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.4-5.7c-2.1 1.4-4.8 2.3-8.5 2.3-6.3 0-11.6-4.1-13.5-9.8l-7.9 6.1C6.5 42.6 14.6 48 24 48z"/></svg>{t(busy?'Redirecting to Google…':link?'Link Google account':'Continue with Google')}</button>{!checking&&!enabled&&<small>{t('Google sign-in is not available yet.')}</small>}{error&&<p role="alert">{t(error)}</p>}</div>;
}
