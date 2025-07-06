import { cn } from '@/lib/utils'

interface LoadingProps {
  size?: 'sm' | 'md' | 'lg'
  fullScreen?: boolean
  text?: string
  className?: string
}

export function Loading({ size = 'md', fullScreen = false, text, className }: LoadingProps) {
  const sizeClasses = {
    sm: 'w-6 h-6 border-2',
    md: 'w-8 h-8 border-3',
    lg: 'w-12 h-12 border-4',
  }

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center">
        <div className="text-center">
          <div
            className={cn(
              'inline-block animate-spin rounded-full border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]',
              sizeClasses[size],
              'border-solana-purple',
              className
            )}
            role="status"
          />
          {text && <p className="mt-4 text-white text-lg">{text}</p>}
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center">
      <div
        className={cn(
          'inline-block animate-spin rounded-full border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]',
          sizeClasses[size],
          'border-solana-purple',
          className
        )}
        role="status"
      />
      {text && <p className="mt-2 text-gray-400 text-sm">{text}</p>}
    </div>
  )
}

export function LoadingSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('animate-pulse bg-gray-700/50 rounded', className)} />
  )
}

export function LoadingDots() {
  return (
    <span className="inline-flex items-center gap-1">
      <span className="animate-bounce inline-block w-1 h-1 bg-current rounded-full" style={{ animationDelay: '0ms' }} />
      <span className="animate-bounce inline-block w-1 h-1 bg-current rounded-full" style={{ animationDelay: '150ms' }} />
      <span className="animate-bounce inline-block w-1 h-1 bg-current rounded-full" style={{ animationDelay: '300ms' }} />
    </span>
  )
}