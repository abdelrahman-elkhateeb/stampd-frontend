"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import {
  Building2Icon,
  EllipsisVerticalIcon,
  PencilIcon,
  PlusIcon,
  Trash2Icon,
} from "lucide-react"
import { useTranslations } from "next-intl"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"

import { TextField } from "@/components/form-fields"
import { Link } from "@/i18n/navigation"
import { codeErrorMap } from "@/lib/forms"
import { useFormat } from "@/lib/use-format"
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
import { EmptyState } from "@workspace/ui/components/empty-state"
import { FieldGroup } from "@workspace/ui/components/field"
import { notify } from "@workspace/ui/components/sonner"
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table"

import type { Department } from "./demo-data"
import { updateStore, useEmployeesStore } from "./store"

const DepartmentBody = z.object({ name: z.string().trim().min(2).max(60) })
type DepartmentInput = z.infer<typeof DepartmentBody>

export function DepartmentsPage() {
  const t = useTranslations("employees.departments")
  const format = useFormat()
  const { departments, employees } = useEmployeesStore()
  const [editing, setEditing] = useState<Department | "new" | null>(null)
  const [deleting, setDeleting] = useState<Department | null>(null)
  const headcount = (id: string) =>
    employees.filter(
      (employee) =>
        employee.departmentId === id && employee.status !== "deactivated"
    ).length
  const sorted = [...departments].sort((a, b) => a.name.localeCompare(b.name))

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="text-h3 font-bold">{t("title")}</h2>
        <Button size="sm" className="ms-auto" onClick={() => setEditing("new")}>
          <PlusIcon aria-hidden />
          {t("add")}
        </Button>
      </div>

      <Card className="gap-0 overflow-hidden p-0">
        {sorted.length ? (
          <Table>
            <TableCaption className="sr-only">{t("title")}</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>{t("name")}</TableHead>
                <TableHead className="text-end">{t("people")}</TableHead>
                <TableHead className="w-12">
                  <span className="sr-only">{t("actions")}</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sorted.map((department) => (
                <TableRow key={department.id} className="group">
                  <TableCell className="w-full max-w-0 truncate font-medium">
                    <Link
                      href={`/employees?dept=${department.id}`}
                      className="underline-offset-4 hover:underline"
                    >
                      <bdi title={department.name}>{department.name}</bdi>
                    </Link>
                  </TableCell>
                  <TableCell className="tabular text-end">
                    {format.number(headcount(department.id))}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label={t("actionsFor", {
                            name: department.name,
                          })}
                          className="opacity-40 group-hover:opacity-100 focus-visible:opacity-100 data-[state=open]:opacity-100 pointer-coarse:opacity-100"
                        >
                          <EllipsisVerticalIcon aria-hidden />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onSelect={() => setEditing(department)}
                        >
                          <PencilIcon aria-hidden />
                          {t("rename")}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          variant="destructive"
                          onSelect={() => setDeleting(department)}
                        >
                          <Trash2Icon aria-hidden />
                          {t("delete")}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <EmptyState
            icon={Building2Icon}
            title={t("empty.title")}
            body={t("empty.body")}
          />
        )}
      </Card>

      <DepartmentDialog
        key={
          editing === null ? "closed" : editing === "new" ? "new" : editing.id
        }
        editing={editing}
        departments={departments}
        onClose={() => setEditing(null)}
      />

      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(open) => !open && setDeleting(null)}
        title={t("deleteDialog.title", { name: deleting?.name ?? "" })}
        description={t("deleteDialog.description", {
          count: deleting ? headcount(deleting.id) : 0,
        })}
        cancelLabel={t("deleteDialog.keep")}
        confirmLabel={t("deleteDialog.confirm")}
        onConfirm={() => {
          if (!deleting) return
          updateStore((current) => ({
            ...current,
            departments: current.departments.filter(
              (item) => item.id !== deleting.id
            ),
            employees: current.employees.map((employee) =>
              employee.departmentId === deleting.id
                ? { ...employee, departmentId: null }
                : employee
            ),
          }))
          notify.success(t("deleted", { name: deleting.name }))
        }}
      />
    </div>
  )
}

function DepartmentDialog({
  editing,
  departments,
  onClose,
}: {
  editing: Department | "new" | null
  departments: Department[]
  onClose: () => void
}) {
  const t = useTranslations("employees.departments")
  const tCommon = useTranslations("common")
  const existing = editing !== null && editing !== "new" ? editing : null
  const form = useForm<DepartmentInput>({
    resolver: zodResolver(DepartmentBody, codeErrorMap),
    mode: "onTouched",
    defaultValues: { name: existing?.name ?? "" },
  })

  const onSubmit = form.handleSubmit(({ name }) => {
    const trimmed = name.trim()
    if (
      departments.some(
        (item) =>
          item.id !== existing?.id &&
          item.name.toLowerCase() === trimmed.toLowerCase()
      )
    ) {
      form.setError("name", { message: "DEPARTMENT_TAKEN" })
      return
    }
    updateStore((current) => ({
      ...current,
      departments: existing
        ? current.departments.map((item) =>
            item.id === existing.id ? { ...item, name: trimmed } : item
          )
        : [...current.departments, { id: crypto.randomUUID(), name: trimmed }],
    }))
    notify.success(t(existing ? "renamed" : "added", { name: trimmed }))
    onClose()
  })

  return (
    <Dialog open={editing !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent size="sm" closeLabel={tCommon("close")}>
        <form onSubmit={onSubmit} noValidate className="flex min-h-0 flex-col">
          <DialogHeader>
            <DialogTitle>
              {t(existing ? "renameTitle" : "addTitle")}
            </DialogTitle>
            <DialogDescription>{t("dialogDescription")}</DialogDescription>
          </DialogHeader>
          <DialogBody>
            <FieldGroup>
              <TextField form={form} name="name" label={t("name")} />
            </FieldGroup>
          </DialogBody>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              {tCommon("cancel")}
            </Button>
            <Button type="submit">
              {t(existing ? "saveRename" : "saveNew")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
