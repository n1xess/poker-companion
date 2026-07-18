import { useUIStore } from '../../stores/ui-store'
import { motion, AnimatePresence } from 'framer-motion'

export function Toaster() {
  const toasts = useUIStore((s) => s.toasts)
  const removeToast = useUIStore((s) => s.removeToast)

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] flex flex-col items-center gap-2 px-4 pt-[env(safe-area-inset-top,16px)] pointer-events-none">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, translateY: -20 }}
            animate={{ opacity: 1, translateY: 0 }}
            exit={{ opacity: 0, translateY: -20 }}
            className={`px-4 py-2.5 rounded-xl text-sm font-medium pointer-events-auto ${
              t.type === 'success'
                ? 'bg-accent-green text-black'
                : t.type === 'error'
                ? 'bg-accent-red text-white'
                : 'glass text-white'
            }`}
            onClick={() => removeToast(t.id)}
          >
            {t.message}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
