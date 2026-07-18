import { type ReactNode } from 'react'

export function SafeAreaWrapper({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-black text-white" style={{
      paddingTop: 'env(safe-area-inset-top, 0px)',
      paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      paddingLeft: 'env(safe-area-inset-left, 0px)',
      paddingRight: 'env(safe-area-inset-right, 0px)',
    }}>
      {children}
    </div>
  )
}
