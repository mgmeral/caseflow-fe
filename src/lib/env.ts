/// <reference types="vite/client" />

/**
 * Frontend runtime API base URL.
 * Keep this relative in normal development so requests go through Vite proxy
 * or the local gateway instead of calling the backend origin directly.
 */
export const API_URL = ((import.meta.env.VITE_API_URL as string | undefined) ?? '/api').trim() || '/api'
