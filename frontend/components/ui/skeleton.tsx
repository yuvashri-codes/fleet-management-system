import React from 'react'
import { cn } from '@/lib/utils'

export function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("rounded-md shimmer h-4 w-full opacity-70", className)}
      {...props}
    />
  )
}
export default Skeleton
