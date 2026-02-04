import { ToastData } from "@/components/ui/toaster"

let toastListeners: Array<(toasts: ToastData[]) => void> = []
let toasts: ToastData[] = []

function addToast(toast: ToastData) {
  toasts = [...toasts, toast]
  toastListeners.forEach((listener) => listener(toasts))
}

function removeToast(id: string) {
  toasts = toasts.filter((t) => t.id !== id)
  toastListeners.forEach((listener) => listener(toasts))
}

export const toast = {
  show: (props: Omit<ToastData, "id">) => {
    const id = Math.random().toString(36).substring(2, 9)
    addToast({ ...props, id })
    // Auto-dismiss after 5 seconds
    setTimeout(() => {
      removeToast(id)
    }, 5000)
    return id
  },
  success: (title: string, description?: string) => {
    return toast.show({ title, description, variant: "default" })
  },
  error: (title: string, description?: string) => {
    return toast.show({ title, description, variant: "destructive" })
  },
  dismiss: (id: string) => {
    removeToast(id)
  },
  // Internal function for Toaster component
  _subscribe: (listener: (toasts: ToastData[]) => void) => {
    toastListeners.push(listener)
    listener(toasts)
    return () => {
      toastListeners = toastListeners.filter((l) => l !== listener)
    }
  },
}
