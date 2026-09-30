"use client";
import {useEffect,useState} from 'react';
import Link from 'next/link';
import {completeGoogleSignIn} from '@/adapters/google-auth';
import {useLocale} from '@/presentation/locale-provider';
export default function GoogleCallback(){
 const {t}=useLocale();const [error,setError]=useState('');
 useEffect(()=>{let active=true;completeGoogleSignIn().then(path=>{if(active)window.location.replace(path);}).catch(error=>{if(active)setError(error instanceof Error?error.message:'Google sign-in failed. Please try again.');});return()=>{active=false;};},[]);
 return <main className="catalogue"><h1>{t('Google sign-in')}</h1>{error?<><p role="alert">{t(error)}</p><Link className="button" href="/">{t('Back to the store')}</Link></>:<p role="status">{t('Completing sign-in…')}</p>}</main>;
}
