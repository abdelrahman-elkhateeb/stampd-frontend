"use client"

import { useTranslations } from "next-intl"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

import { ConfirmDialog } from "@workspace/ui/components/confirm-dialog"

/**
 * patterns/forms-validation.md › Unsaved changes. While `dirty`, in-app link clicks ask
 * "Discard changes?" first, and closing or reloading the tab gets the native prompt.
 * ponytail: browser back/forward isn't intercepted (the App Router has no blocking API).
 */
export function UnsavedChangesGuard({ dirty }: { dirty: boolean }) {
  const t = useTranslations("unsavedChanges")
  const router = useRouter()
  const [target, setTarget] = useState<string | null>(null)

  useEffect(() => {
    if (!dirty) return
    const onBeforeUnload = (event: BeforeUnloadEvent) => event.preventDefault()
    const onClick = (event: MouseEvent) => {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      )
        return
      const link = (event.target as Element | null)?.closest?.("a[href]")
      if (!(link instanceof HTMLAnchorElement) || link.target === "_blank")
        return
      const url = new URL(link.href)
      if (
        url.origin !== location.origin ||
        url.pathname + url.search === location.pathname + location.search
      )
        return
      // Capture phase on document: runs before React, so the Link never navigates.
      event.preventDefault()
      event.stopPropagation()
      setTarget(url.pathname + url.search + url.hash)
    }
    window.addEventListener("beforeunload", onBeforeUnload)
    document.addEventListener("click", onClick, true)
    return () => {
      window.removeEventListener("beforeunload", onBeforeUnload)
      document.removeEventListener("click", onClick, true)
    }
  }, [dirty])

  return (
    <ConfirmDialog
      open={target !== null}
      onOpenChange={(open) => !open && setTarget(null)}
      variant="neutral"
      title={t("title")}
      description={t("description")}
      cancelLabel={t("keep")}
      confirmLabel={t("discard")}
      onConfirm={() => router.push(target!)}
    />
  )
}
