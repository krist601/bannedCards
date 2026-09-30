"use client";
import {useEffect,useState} from 'react';
import {googleAvailable,startGoogleSignIn} from '@/adapters/google-auth';
import {useLocale} from './locale-provider';
export function GoogleButton({link=false}:{link?:boolean}){
 const {t}=useLocale();const [enabled,setEnabled]=useState(false),[checking,setChecking]=useState(true),[busy,setBusy]=useState(false),[error,setError]=useState('');
 useEffect(()=>{let active=true;googleAvailable().then(value=>{if(active)setEnabled(value);}).catch(()=>{}).finally(()=>{if(active)setChecking(false);});return()=>{active=false;};},[]);
 async function start(){setBusy(true);setError('');try{await startGoogleSignIn(link);}catch(error){setError(error instanceof Error?error.message:'Google sign-in failed. Please try again.');setBusy(false);}}
 return <div className="google-sign-in"><button className="google-button" type="button" disabled={!enabled||busy||checking} onClick={()=>void start()}>{t(busy?'Redirecting to Google…':link?'Link Google account':'Continue with Google')}</button>{!checking&&!enabled&&<small>{t('Google sign-in is not available yet.')}</small>}{error&&<p role="alert">{t(error)}</p>}</div>;
}
