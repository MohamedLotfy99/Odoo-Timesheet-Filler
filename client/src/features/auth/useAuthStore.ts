import { create } from 'zustand'
import type { OdooSession } from '../../shared/types'

interface AuthState {
  status: 'checking' | 'authenticated' | 'anonymous'
  session: OdooSession | null
  setSession: (session: OdooSession | null) => void
}

export const useAuthStore = create<AuthState>((set) => ({
  status: 'checking',
  session: null,
  setSession: (session) => set({ session, status: session ? 'authenticated' : 'anonymous' })
}))
