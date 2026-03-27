import React from 'react'
import ReactDOM from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { router } from './router'
import { ApiError } from './services/api.client'
import './index.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: (failureCount, error) => {
        // Do not retry on 401/403/404
        if (error instanceof ApiError && [401, 403, 404].includes(error.status)) return false
        return failureCount < 1
      },
    },
    mutations: {
      onError: (error) => {
        // Auto-logout on 401
        if (error instanceof ApiError && error.status === 401) {
          const authStr = localStorage.getItem('csm-auth')
          if (authStr) {
            try {
              const state = JSON.parse(authStr) as { state?: object }
              if (state?.state) {
                localStorage.setItem('csm-auth', JSON.stringify({ state: { currentUser: null, isAuthenticated: false } }))
              }
            } catch { /* ignore */ }
          }
          router.navigate('/login')
        }
      },
    },
  },
})

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </React.StrictMode>,
)
