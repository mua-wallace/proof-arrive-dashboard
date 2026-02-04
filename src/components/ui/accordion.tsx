import * as React from "react"
import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

interface AccordionContextValue {
  value: string[]
  onChange: (value: string[]) => void
  type: "single" | "multiple"
}

const AccordionContext = React.createContext<AccordionContextValue | undefined>(undefined)

export interface AccordionProps {
  type?: "single" | "multiple"
  defaultValue?: string[]
  value?: string[]
  onValueChange?: (value: string[]) => void
  children: React.ReactNode
  className?: string
}

const Accordion = React.forwardRef<HTMLDivElement, AccordionProps>(
  ({ type = "single", defaultValue = [], value, onValueChange, children, className, ...props }, ref) => {
    const [internalValue, setInternalValue] = React.useState<string[]>(defaultValue)
    const controlledValue = value !== undefined ? value : internalValue
    const setValue = onValueChange || setInternalValue

    return (
      <AccordionContext.Provider value={{ value: controlledValue, onChange: setValue, type }}>
        <div ref={ref} className={cn("space-y-2", className)} {...props}>
          {children}
        </div>
      </AccordionContext.Provider>
    )
  }
)
Accordion.displayName = "Accordion"

export interface AccordionItemProps {
  value: string
  children: React.ReactNode
  className?: string
}

const AccordionItem = React.forwardRef<HTMLDivElement, AccordionItemProps>(
  ({ value, children, className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("border rounded-lg overflow-hidden", className)}
        {...props}
      >
        {children}
      </div>
    )
  }
)
AccordionItem.displayName = "AccordionItem"

export interface AccordionTriggerProps {
  children: React.ReactNode
  className?: string
}

const AccordionTrigger = React.forwardRef<HTMLButtonElement, AccordionTriggerProps>(
  ({ children, className, ...props }, ref) => {
    const context = React.useContext(AccordionContext)
    if (!context) throw new Error("AccordionTrigger must be used within Accordion")

    const itemContext = React.useContext(AccordionItemContext)
    if (!itemContext) throw new Error("AccordionTrigger must be used within AccordionItem")

    const { value, onChange, type } = context
    const { value: itemValue } = itemContext

    const isOpen = value.includes(itemValue)

    const handleClick = () => {
      if (type === "single") {
        onChange(isOpen ? [] : [itemValue])
      } else {
        onChange(isOpen ? value.filter((v) => v !== itemValue) : [...value, itemValue])
      }
    }

    return (
      <button
        ref={ref}
        type="button"
        onClick={handleClick}
        className={cn(
          "flex w-full items-center justify-between px-4 py-3 text-left font-medium transition-all hover:bg-accent [&[data-state=open]>svg]:rotate-180",
          className
        )}
        data-state={isOpen ? "open" : "closed"}
        {...props}
      >
        {children}
        <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200" />
      </button>
    )
  }
)
AccordionTrigger.displayName = "AccordionTrigger"

interface AccordionItemContextValue {
  value: string
}

const AccordionItemContext = React.createContext<AccordionItemContextValue | undefined>(undefined)

const AccordionItemWithContext = React.forwardRef<HTMLDivElement, AccordionItemProps>(
  ({ value, children, className, ...props }, ref) => {
    return (
      <AccordionItemContext.Provider value={{ value }}>
        <AccordionItem ref={ref} value={value} className={className} {...props}>
          {children}
        </AccordionItem>
      </AccordionItemContext.Provider>
    )
  }
)
AccordionItemWithContext.displayName = "AccordionItem"

export interface AccordionContentProps {
  children: React.ReactNode
  className?: string
}

const AccordionContent = React.forwardRef<HTMLDivElement, AccordionContentProps>(
  ({ children, className, ...props }, ref) => {
    const context = React.useContext(AccordionContext)
    if (!context) throw new Error("AccordionContent must be used within Accordion")

    const itemContext = React.useContext(AccordionItemContext)
    if (!itemContext) throw new Error("AccordionContent must be used within AccordionItem")

    const { value } = context
    const { value: itemValue } = itemContext

    const isOpen = value.includes(itemValue)

    return (
      <div
        ref={ref}
        className={cn(
          "overflow-hidden transition-all",
          isOpen ? "max-h-[2000px] opacity-100" : "max-h-0 opacity-0"
        )}
        {...props}
      >
        <div className={cn("px-4 py-3", className)}>{children}</div>
      </div>
    )
  }
)
AccordionContent.displayName = "AccordionContent"

export { Accordion, AccordionItemWithContext as AccordionItem, AccordionTrigger, AccordionContent }
