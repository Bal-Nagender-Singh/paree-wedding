'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminRedirect() {
  const router = useRouter();

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('paree_token') : null;
    const u = typeof window !== 'undefined' && localStorage.getItem('paree_user') 
      ? JSON.parse(localStorage.getItem('paree_user')!) 
      : null;
    const ADMIN_EMAIL = 'admin@paree.com';
    
    if (!token || !u || u.role !== 'admin' || u.email !== ADMIN_EMAIL) {
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('open_auth_drawer', 'true');
      }
      router.push('/');
    } else {
      router.replace('/admin/dashboard');
    }
  }, [router]);

  return null;
}
