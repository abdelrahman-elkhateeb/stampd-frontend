"use client"

import { useTranslations } from "next-intl"
import { useId, useState } from "react"

import { Status } from "@/components/status"
import { PersonAvatar } from "@workspace/ui/components/avatar"
import { Button } from "@workspace/ui/components/button"
import { ConfirmDialog } from "@workspace/ui/components/confirm-dialog"
import {
  Dialog,
  DialogBody,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@workspace/ui/components/dialog"
import { Field, FieldLabel } from "@workspace/ui/components/field"
import { Input } from "@workspace/ui/components/input"
import {
  Sheet,
  SheetBody,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@workspace/ui/components/sheet"
import { notify } from "@workspace/ui/components/sonner"

import { Demo } from "../demo"

const wait = (ms: number) =>
  new Promise((resolve) => window.setTimeout(resolve, ms))

export function OverlaysSection() {
  const t = useTranslations("common")
  const nameId = useId()
  const [reject, setReject] = useState(false)
  const [deactivate, setDeactivate] = useState(false)
  const [discard, setDiscard] = useState(false)

  return (
    <div className="flex flex-col gap-8">
      <Demo title="Modal · sm / md / lg">
        {(["sm", "md", "lg"] as const).map((size) => (
          <Dialog key={size}>
            <DialogTrigger asChild>
              <Button variant="outline">Open {size} modal</Button>
            </DialogTrigger>
            <DialogContent size={size} closeLabel={t("close")}>
              <DialogHeader>
                <DialogTitle>Add holiday</DialogTitle>
                <DialogDescription>
                  Employees won't be expected to work on this day.
                </DialogDescription>
              </DialogHeader>
              <DialogBody>
                <Field>
                  <FieldLabel htmlFor={`${nameId}-${size}`}>
                    Holiday name
                  </FieldLabel>
                  <Input id={`${nameId}-${size}`} placeholder="National Day" />
                </Field>
              </DialogBody>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline">{t("cancel")}</Button>
                </DialogClose>
                <Button>Add holiday</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        ))}
      </Demo>

      <Demo title="Drawer · default / wide (opens from inline-end)">
        {(["default", "wide"] as const).map((size) => (
          <Sheet key={size}>
            <SheetTrigger asChild>
              <Button variant="outline">Open {size} drawer</Button>
            </SheetTrigger>
            <SheetContent size={size} closeLabel={t("close")}>
              <SheetHeader>
                <PersonAvatar name="Khalid Noor" userId="u-5" size={40} />
                <div className="flex flex-col">
                  <SheetTitle>Khalid Noor · WFH request</SheetTitle>
                  <SheetDescription>
                    Thu 8 Oct · submitted 2 days ago
                  </SheetDescription>
                </div>
              </SheetHeader>
              <SheetBody>
                <Status status="pending" />
                <p className="text-body">
                  Working from home to receive a delivery.
                </p>
              </SheetBody>
              <SheetFooter>
                <SheetClose asChild>
                  <Button variant="outline">Reject</Button>
                </SheetClose>
                <Button>Approve</Button>
              </SheetFooter>
            </SheetContent>
          </Sheet>
        ))}
      </Demo>

      <Demo title="Confirm dialog · destructive, type-to-confirm, neutral">
        <Button
          variant="outline"
          className="text-destructive"
          onClick={() => setReject(true)}
        >
          Reject request
        </Button>
        <ConfirmDialog
          open={reject}
          onOpenChange={setReject}
          title="Reject Khalid's WFH request?"
          description="Thu 8 Oct. Khalid will be notified with your reason and can resubmit."
          confirmLabel="Reject request"
          cancelLabel="Keep pending"
          requireInput={{
            label: "Reason",
            placeholder: "Tell Khalid why",
            errorMessage: "Add a reason so Khalid knows what to change",
          }}
          onConfirm={async () => {
            await wait(800)
            notify.success("Rejected Khalid's WFH request")
          }}
        />

        <Button
          variant="outline"
          className="text-destructive"
          onClick={() => setDeactivate(true)}
        >
          Deactivate employee
        </Button>
        <ConfirmDialog
          open={deactivate}
          onOpenChange={setDeactivate}
          variant="type-to-confirm"
          title="Deactivate Omar Khalid?"
          description="Omar can't log in any more. Their history stays in reports."
          confirmLabel="Deactivate"
          cancelLabel="Keep active"
          requireInput={{
            label: "Type Omar Khalid to confirm",
            match: "Omar Khalid",
            errorMessage: "Type the name exactly as shown",
          }}
          impact={
            <p>
              2 pending requests will be cancelled. 1 direct report needs a new
              manager.
            </p>
          }
          onConfirm={async () => {
            await wait(800)
            throw new Error("Simulated failure")
          }}
          errorMessage="Couldn't deactivate Omar. Try again."
        />

        <Button variant="outline" onClick={() => setDiscard(true)}>
          Discard changes
        </Button>
        <ConfirmDialog
          open={discard}
          onOpenChange={setDiscard}
          variant="neutral"
          title="Discard your changes?"
          description="The settings you changed won't be saved."
          confirmLabel="Discard changes"
          cancelLabel="Keep editing"
          onConfirm={() => undefined}
        />
      </Demo>

      <Demo title="Toast · success, undo, error, info, progress">
        <Button
          variant="outline"
          onClick={() => notify.success("Saved your changes")}
        >
          Success
        </Button>
        <Button
          variant="outline"
          onClick={() =>
            notify.success("Approved Sara's leave", {
              label: "Undo",
              onClick: () => notify.info("Approval undone"),
            })
          }
        >
          Success with Undo
        </Button>
        <Button
          variant="outline"
          onClick={() =>
            notify.error(
              "Couldn't send. Check your connection and try again.",
              { label: "Retry", onClick: () => undefined }
            )
          }
        >
          Error
        </Button>
        <Button
          variant="outline"
          onClick={() =>
            notify.info("Export started. We'll tell you when it's ready.")
          }
        >
          Info
        </Button>
        <Button
          variant="outline"
          onClick={() =>
            notify.progress(wait(2000), {
              loading: "Preparing CSV…",
              success: "Export ready",
              error: "Export failed",
            })
          }
        >
          Progress
        </Button>
      </Demo>
    </div>
  )
}
