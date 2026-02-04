import { useEffect, useState } from "react"
import { createPortal } from "react-dom"
import { Toast } from "./toast"
import { toast } from "@/lib/toast"

export interface ToastData {
  id: string
  title?: string
  description?: string
  variant?: "default" | "destructive"
  action?: React.ReactNode
}

export function Toaster() {
  const [mounted, setMounted] = useState(false)
  const [currentToasts, setCurrentToasts] = useState<ToastData[]>([])

  useEffect(() => {
    setMounted(true)
    const unsubscribe = toast._subscribe(setCurrentToasts)
    return unsubscribe
  }, [])

  if (!mounted) return null

  return createPortal(
    <div
      className="fixed top-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col md:max-w-[420px]"
      aria-live="polite"
      aria-atomic="true"
    >
      {currentToasts.map((toastData) => (
        <Toast
          key={toastData.id}
          {...toastData}
          onClose={() => toast.dismiss(toastData.id)}
        />
      ))}
    </div>,
    document.body
  )
}
