'use client';

import React, { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppProvider } from '@/context/AppContext';

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        refetchOnWindowFocus: false,
        staleTime: 60000,
      },
    },
  }));

  return (
    <QueryClientProvider client={queryClient}>
      <AppProvider>
        {children}
      </AppProvider>
    </QueryClientProvider>
  );
}
