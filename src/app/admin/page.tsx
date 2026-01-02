'use client';

import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { useRouter } from 'next/navigation';

// Dynamically import App to avoid SSR issues with some libraries if any (recharts usually fine but good practice for SPAs)
// We import directly from src/App.tsx
// Note: In Next.js, importing from relative paths outside 'app' is fine.
import App from '../../App';

export default function AdminPage() {
    const { isAuthenticated, loading } = useAdminAuth();
    const router = useRouter();
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
        if (!loading && !isAuthenticated) {
            router.push('/');
        }
    }, [isAuthenticated, loading, router]);

    if (!isClient) return null; // Prevent hydration mismatch

    if (loading) return null;

    if (!isAuthenticated) return null;

    return <App />;
}
