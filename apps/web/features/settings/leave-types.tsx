"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import {
  ArchiveIcon,
  EllipsisVerticalIcon,
  PencilIcon,
  PlusIcon,
  Trash2Icon,
} from "lucide-react"
import { useTranslations } from "next-intl"
import { useId, useState } from "react"
import { Controller, useForm, useWatch } from "react-hook-form"
import { z } from "zod"

import {
  CheckboxField,
  StepperField,
  TextField,
  useFieldError,
} from "@/components/form-fields"
import { codeErrorMap, invert, showProblem } from "@/lib/forms"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import { Card } from "@workspace/ui/components/card"
import { ConfirmDialog } from "@workspace/ui/components/confirm-dialog"
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu"
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@workspace/ui/components/field"
import {
  IconPicker,
  LEAVE_ICONS,
  LeaveIcon,
  type LeaveIconKey,
} from "@workspace/ui/components/icon-picker"
import { notify } from "@workspace/ui/components/sonner"

import { deleteLeaveType, saveLeaveType } from "./actions"
import type { LeaveType } from "./settings-data"

const LeaveTypeBody = z.object({
  name: z.string().trim().min(1).max(60),
  icon: z.enum(Object.keys(LEAVE_ICONS) as [LeaveIconKey, ...LeaveIconKey[]]),
  paid: z.boolean(),
  tracked: z.boolean(),
  allowance: z
    .number()
    .multipleOf(0.5)
    .min(0, { error: "NEGATIVE_ALLOWANCE" })
    .max(365),
  allowNegative: z.boolean(),
  halfDays: z.boolean(),
  reasonRequired: z.boolean(),
})
type LeaveTypeInput = z.input<typeof LeaveTypeBody>

const BLANK: LeaveTypeInput = {
  name: "",
  // Set by the picker; the schema reports it as required until then.
  icon: undefined as unknown as LeaveIconKey,
  paid: true,
  tracked: true,
  allowance: 0,
  allowNegative: false,
  halfDays: false,
  reasonRequired: false,
}

/** The API's names for the dialog's fields; also maps field errors back. */
const API_FIELDS = {
  name: "name",
  icon: "icon",
  paid: "paid",
  tracked: "tracksBalance",
  allowance: "defaultAllowanceDays",
  allowNegative: "allowNegativeBalance",
  halfDays: "halfDaysAllowed",
  reasonRequired: "requiresReason",
} as const satisfies Record<keyof LeaveTypeInput, string>

const FORM_FIELDS = invert(API_FIELDS)

export function LeaveTypesPage({ types }: { types: LeaveType[] }) {
  const t = useTranslations("settings.leaveTypes")
  const [editing, setEditing] = useState<LeaveType | "new" | null>(null)
  const [removing, setRemoving] = useState<LeaveType | null>(null)
  const active = types.filter((type) => !type.archived)
  const archived = types.filter((type) => type.archived)

  async function onRemove(type: LeaveType) {
    const problem = type.inUse
      ? await saveLeaveType({ archived: true }, type.id)
      : await deleteLeaveType(type.id)
    // Used since the page loaded: it can only be archived now.
    if (problem?.code === "LEAVE_TYPE_IN_USE") {
      setRemoving({ ...type, inUse: true })
      return
    }
    if (problem) notify.error(t("failed"))
    else
      notify.success(
        t(type.inUse ? "archived" : "deleted", { name: type.name })
      )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="text-h3 font-bold">{t("title")}</h2>
        <Button className="ms-auto" onClick={() => setEditing("new")}>
          <PlusIcon aria-hidden />
          {t("add")}
        </Button>
      </div>
      <p className="-mt-2 text-body-sm text-muted-foreground">
        {t("description")}
      </p>

      <ul className="grid gap-3 md:grid-cols-2">
        {active.map((type) => (
          <LeaveTypeRow
            key={type.id}
            type={type}
            onEdit={() => setEditing(type)}
            onRemove={() => setRemoving(type)}
          />
        ))}
      </ul>

      {archived.length ? (
        <section
          aria-labelledby="archived-title"
          className="flex flex-col gap-3"
        >
          <h3 id="archived-title" className="label-overline">
            {t("archivedTitle")}
          </h3>
          <ul className="grid gap-3 md:grid-cols-2">
            {archived.map((type) => (
              <LeaveTypeRow key={type.id} type={type} />
            ))}
          </ul>
        </section>
      ) : null}

      <LeaveTypeDialog
        key={
          editing === null ? "closed" : editing === "new" ? "new" : editing.id
        }
        editing={editing}
        types={types}
        onClose={() => setEditing(null)}
      />

      <ConfirmDialog
        open={removing !== null}
        onOpenChange={(open) => !open && setRemoving(null)}
        title={t(
          removing?.inUse ? "archiveDialog.title" : "deleteDialog.title",
          {
            name: removing?.name ?? "",
          }
        )}
        description={t(
          removing?.inUse
            ? "archiveDialog.description"
            : "deleteDialog.description"
        )}
        cancelLabel={t("keep")}
        confirmLabel={t(
          removing?.inUse ? "archiveDialog.confirm" : "deleteDialog.confirm"
        )}
        onConfirm={() => {
          if (removing) void onRemove(removing)
        }}
      />
    </div>
  )
}

function LeaveTypeRow({
  type,
  onEdit,
  onRemove,
}: {
  type: LeaveType
  onEdit?: () => void
  onRemove?: () => void
}) {
  const t = useTranslations("settings.leaveTypes")
  const facts = [
    t(type.paid ? "paid" : "unpaid"),
    type.tracked
      ? t("allowanceShort", { count: type.allowance })
      : t("noBalance"),
    type.halfDays ? t("halfDaysShort") : null,
    type.reasonRequired ? t("reasonShort") : null,
  ].filter(Boolean)

  return (
    <li>
      <Card
        className="flex-row items-start gap-3 data-[archived=true]:bg-muted"
        data-archived={type.archived}
      >
        <LeaveIcon icon={type.icon} className="size-10 [&_svg]:size-5" />
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <p className="flex flex-wrap items-center gap-2 text-body font-bold">
            <bdi className="truncate">{type.name}</bdi>
            {type.archived ? <Badge>{t("archivedBadge")}</Badge> : null}
          </p>
          <p className="text-body-sm text-muted-foreground">
            {facts.join(" · ")}
          </p>
        </div>
        {onEdit && onRemove ? (
          <div className="flex shrink-0 items-center gap-1">
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={t("editFor", { name: type.name })}
              onClick={onEdit}
            >
              <PencilIcon aria-hidden />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={t("moreFor", { name: type.name })}
                >
                  <EllipsisVerticalIcon aria-hidden />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {/* A used type can only be archived (FE-04 AC). */}
                <DropdownMenuItem variant="destructive" onSelect={onRemove}>
                  {type.inUse ? (
                    <ArchiveIcon aria-hidden />
                  ) : (
                    <Trash2Icon aria-hidden />
                  )}
                  {t(type.inUse ? "archive" : "delete")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ) : null}
      </Card>
    </li>
  )
}

function LeaveTypeDialog({
  editing,
  types,
  onClose,
}: {
  editing: LeaveType | "new" | null
  types: LeaveType[]
  onClose: () => void
}) {
  const t = useTranslations("settings.leaveTypes")
  const tCommon = useTranslations("common")
  const tIcons = useTranslations("settings.leaveTypes.icons")
  const existing = editing !== null && editing !== "new" ? editing : null
  const form = useForm<LeaveTypeInput>({
    resolver: zodResolver(LeaveTypeBody, codeErrorMap),
    mode: "onTouched",
    defaultValues: existing ?? BLANK,
  })
  const iconId = useId()
  const iconError = useFieldError(form, "icon", iconId)
  const tracked = useWatch({ control: form.control, name: "tracked" })
  const hasErrors = Object.keys(form.formState.errors).length > 0

  // Two active types can't share an icon; archived types release theirs.
  const usedBy = Object.fromEntries(
    types
      .filter((type) => !type.archived && type.id !== existing?.id)
      .map((type) => [type.icon, type.name])
  )

  const onSubmit = form.handleSubmit(async (body) => {
    const tracked = body.tracked
    const problem = await saveLeaveType(
      {
        name: body.name.trim(),
        icon: body.icon,
        paid: body.paid,
        tracksBalance: tracked,
        defaultAllowanceDays: tracked ? body.allowance : 0,
        allowNegativeBalance: tracked && body.allowNegative,
        halfDaysAllowed: body.halfDays,
        requiresReason: body.reasonRequired,
      },
      existing?.id
    )
    if (problem) {
      showProblem(form, problem, FORM_FIELDS)
      if (form.formState.errors.root) notify.error(t("failed"))
      return
    }
    onClose()
    notify.success(
      t(existing ? "updated" : "created", { name: body.name.trim() })
    )
  })

  return (
    <Dialog open={editing !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent closeLabel={tCommon("close")}>
        <form onSubmit={onSubmit} noValidate className="flex min-h-0 flex-col">
          <DialogHeader>
            <DialogTitle>
              {existing
                ? t("editTitle", { name: existing.name })
                : t("addTitle")}
            </DialogTitle>
            <DialogDescription>{t("dialogDescription")}</DialogDescription>
          </DialogHeader>
          <DialogBody>
            <FieldGroup>
              <TextField form={form} name="name" label={t("name")} />
              <Field data-invalid={iconError ? true : undefined}>
                <FieldLabel htmlFor={iconId}>{t("icon")}</FieldLabel>
                <Controller
                  control={form.control}
                  name="icon"
                  render={({ field }) => (
                    <IconPicker
                      id={iconId}
                      value={field.value ?? null}
                      onChange={(icon) => {
                        field.onChange(icon)
                        field.onBlur()
                      }}
                      usedBy={usedBy}
                      iconNames={
                        Object.fromEntries(
                          Object.keys(LEAVE_ICONS).map((key) => [
                            key,
                            tIcons(key as LeaveIconKey),
                          ])
                        ) as Record<LeaveIconKey, string>
                      }
                      labels={{
                        placeholder: t("iconPlaceholder"),
                        group: t("icon"),
                        inUse: (name) => t("iconInUse", { name }),
                        footnote: t("iconFootnote"),
                      }}
                      invalid={Boolean(iconError)}
                      describedBy={iconError?.id}
                    />
                  )}
                />
                {iconError ? (
                  <FieldError id={iconError.id}>{iconError.text}</FieldError>
                ) : null}
              </Field>
              <CheckboxField form={form} name="paid" label={t("paidLabel")} />
              <CheckboxField
                form={form}
                name="tracked"
                label={t("trackedLabel")}
              />
              {tracked ? (
                <>
                  <StepperField
                    form={form}
                    name="allowance"
                    label={t("allowance")}
                    description={t("allowanceHint")}
                    unit={t("daysUnit")}
                    max={365}
                  />
                  <CheckboxField
                    form={form}
                    name="allowNegative"
                    label={t("allowNegativeLabel")}
                  />
                </>
              ) : null}
              <CheckboxField
                form={form}
                name="halfDays"
                label={t("halfDaysLabel")}
              />
              <CheckboxField
                form={form}
                name="reasonRequired"
                label={t("reasonLabel")}
              />
            </FieldGroup>
          </DialogBody>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              {tCommon("cancel")}
            </Button>
            <Button
              type="submit"
              disabled={hasErrors}
              loading={form.formState.isSubmitting}
            >
              {t(existing ? "saveEdit" : "saveNew")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
