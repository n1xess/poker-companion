import { type ButtonHTMLAttributes } from 'react'
import { motion } from 'framer-motion'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'destructive' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  fullWidth?: boolean
}

const variants = {
  primary: 'bg-accent text-white active:bg-blue-600',
  secondary: 'glass text-white active:opacity-80',
  destructive: 'bg-accent-red text-white active:bg-red-600',
  ghost: 'text-white/70 active:text-white',
}

export function Button({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  className = '',
  children,
  ...props
}: ButtonProps) {
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm rounded-lg',
    md: 'px-5 py-3 text-base rounded-xl',
    lg: 'px-6 py-4 text-lg rounded-xl',
  }

  return (
    <motion.button
      whileTap={{ scale: 0.96 }}
      className={`font-semibold ${variants[variant]} ${sizeClasses[size]} ${
        fullWidth ? 'w-full' : ''
      } transition-colors duration-150 ${className}`}
      {...(props as any)}
    >
      {children}
    </motion.button>
  )
}
