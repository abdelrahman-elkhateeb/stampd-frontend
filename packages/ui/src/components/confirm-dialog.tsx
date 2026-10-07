"use client"

import * as React from "react"
import { cn } from "@workspace/ui/lib/utils"
import { CircleAlertIcon, TriangleAlertIcon } from "lucide-react"
import { AlertDialog as AlertDialogPrimitive } from "radix-ui"

import { Button } from "@workspace/ui/components/button"
import { ErrorState } from "@workspace/ui/components/error-state"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"

// docs/design-system/components/confirm-dialog.md + patterns/destructive-confirm.md
type ConfirmDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** The question with the specific object: "Reject Khalid's WFH request?" */
  title: string
  /** The consequence, and what the other person will see. */
  description: string
  /** Restates the outcome: "Reject request". */
  confirmLabel: string
  /** The safe way out: "Keep pending". */
  cancelLabel: string
  /** Rejecting keeps the dialog open and shows `errorMessage`. */
  onConfirm: (input?: string) => Promise<void> | void
  variant?: "destructive" | "neutral" | "type-to-confirm"
  requireInput?: {
    label: string
    placeholder?: string
    /** type-to-confirm: the exact text to type (e.g. the employee's name). */
    match?: string
    /** Shown under the field when it's empty or doesn't match. */
    errorMessage: string
  }
  impact?: React.ReactNode
  /** Shown as a section error when onConfirm fails. */
  errorMessage?: string
}

function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  cancelLabel,
  onConfirm,
  variant = "destructive",
  requireInput,
  impact,
  errorMessage = "That didn't work. Try again.",
}: ConfirmDialogProps) {
  const inputId = React.useId()
  const [value, setValue] = React.useState("")
  const [inputError, setInputError] = React.useState(false)
  const [failed, setFailed] = React.useState(false)
  const [pending, setPending] = React.useState(false)
  const safeRef = React.useRef<HTMLButtonElement>(null)
  const inputRef = React.useRef<HTMLInputElement>(null)

  function reset(nextOpen: boolean) {
    if (pending) return
    if (!nextOpen) {
      setValue("")
      setInputError(false)
      setFailed(false)
    }
    onOpenChange(nextOpen)
  }

  async function confirm() {
    if (requireInput) {
      const ok = requireInput.match
        ? value.trim() === requireInput.match
        : value.trim() !== ""
      if (!ok) {
        // The button stays enabled; the error tells everyone (screen readers too) what's missing.
        setInputError(true)
        inputRef.current?.focus()
        return
      }
    }
    setPending(true)
    setFailed(false)
    try {
      await onConfirm(requireInput ? value.trim() : undefined)
      setPending(false)
      reset(false)
    } catch {
      setPending(false)
      setFailed(true)
    }
  }

  const Icon = variant === "neutral" ? TriangleAlertIcon : CircleAlertIcon

  return (
    <AlertDialogPrimitive.Root open={open} onOpenChange={reset}>
      <AlertDialogPrimitive.Portal>
        <AlertDialogPrimitive.Overlay className="fixed inset-0 z-50 bg-(--scrim) data-[state=open]:animate-in data-[state=open]:fade-in-0" />
        <AlertDialogPrimitive.Content
          onOpenAutoFocus={(event) => {
            event.preventDefault()
            ;(requireInput ? inputRef.current : safeRef.current)?.focus()
          }}
          className={cn(
            "fixed start-1/2 top-1/2 z-50 flex w-[calc(100%-2rem)] max-w-100 -translate-x-1/2 -translate-y-1/2 flex-col gap-4 rtl:translate-x-1/2",
            "rounded-xl border-[1.5px] border-border-strong bg-card p-6 text-card-foreground shadow-hard-lg",
            "duration-(--dur-slow) ease-enter data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95"
          )}
        >
          {variant !== "neutral" ? (
            <span className="flex size-11 items-center justify-center rounded-pill bg-error-bg text-error">
              <Icon aria-hidden className="size-5" />
            </span>
          ) : null}
          <div className="flex flex-col gap-2">
            <AlertDialogPrimitive.Title className="text-h4 font-bold">
              {title}
            </AlertDialogPrimitive.Title>
            <AlertDialogPrimitive.Description className="text-body text-muted-foreground">
              {description}
            </AlertDialogPrimitive.Description>
          </div>

          {impact ? (
            <div className="rounded-md bg-muted p-3 text-body-sm">{impact}</div>
          ) : null}

          {requireInput ? (
            <div className="flex flex-col gap-1.5">
              <Label
                htmlFor={inputId}
                className={cn(inputError && "text-error")}
              >
                {requireInput.label}
              </Label>
              <Input
                ref={inputRef}
                id={inputId}
                value={value}
                placeholder={requireInput.placeholder}
                aria-invalid={inputError || undefined}
                aria-describedby={inputError ? `${inputId}-error` : undefined}
                autoComplete="off"
                onChange={(event) => {
                  setValue(event.target.value)
                  setInputError(false)
                }}
                // Enter never triggers the destructive action.
                onKeyDown={(event) =>
                  event.key === "Enter" && event.preventDefault()
                }
              />
              {inputError ? (
                <p
                  id={`${inputId}-error`}
                  className="flex items-center gap-1.5 text-body-sm text-error"
                >
                  <CircleAlertIcon aria-hidden className="size-3.5" />
                  {requireInput.errorMessage}
                </p>
              ) : null}
            </div>
          ) : null}

          {failed ? <ErrorState variant="inline" title={errorMessage} /> : null}

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <AlertDialogPrimitive.Cancel asChild>
              <Button
                ref={safeRef}
                variant="outline"
                size="sm"
                disabled={pending}
              >
                {cancelLabel}
              </Button>
            </AlertDialogPrimitive.Cancel>
            <Button
              variant="destructive"
              size="sm"
              loading={pending}
              onClick={(event) => {
                event.preventDefault()
                void confirm()
              }}
            >
              {confirmLabel}
            </Button>
          </div>
        </AlertDialogPrimitive.Content>
      </AlertDialogPrimitive.Portal>
    </AlertDialogPrimitive.Root>
  )
}

export { ConfirmDialog, type ConfirmDialogProps }
