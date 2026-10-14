"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { CameraIcon, LogOutIcon, Trash2Icon } from "lucide-react"
import { useTranslations } from "next-intl"
import { useTheme } from "next-themes"
import { useRef, useState, useSyncExternalStore } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"

import { MoreNav, THEMES } from "@/components/app-shell"
import { PasswordField, TextField } from "@/components/form-fields"
import { LocaleSwitcher } from "@/components/locale-switcher"
import { useUser } from "@/components/user-provider"
import { logout } from "@/features/auth/actions"
import {
  changePassword,
  removePhoto,
  savePhone,
  uploadPhoto,
} from "@/features/profile/actions"
import type { Profile } from "@/features/profile/profile-data"
import { codeErrorMap, showProblem } from "@/lib/forms"
import { NewPassword, passwordRulesIssue } from "@/lib/password"
import { useFormat } from "@/lib/use-format"
import { PersonAvatar } from "@workspace/ui/components/avatar"
import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { FieldGroup } from "@workspace/ui/components/field"
import { notify } from "@workspace/ui/components/sonner"
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@workspace/ui/components/toggle-group"

export function ProfilePage({ profile }: { profile: Profile }) {
  const t = useTranslations("profile")
  const tAuth = useTranslations("auth")

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-h2 font-bold">{t("title")}</h1>
        <p className="text-muted-foreground">{t("description")}</p>
      </div>

      <div className="grid items-start gap-4 lg:grid-cols-2 lg:gap-6">
        <div className="flex flex-col gap-4 lg:gap-6">
          <IdentityCard profile={profile} />
          <DetailsCard profile={profile} />
        </div>
        <div className="flex flex-col gap-4 lg:gap-6">
          <PreferencesCard />
          <PasswordCard />
        </div>
      </div>

      <MoreNav />

      {/* On desktop, log out is in the account menu. */}
      <Button
        variant="outline"
        className="text-destructive md:hidden"
        onClick={() => logout()}
      >
        <LogOutIcon aria-hidden className="flip-rtl" />
        {tAuth("logout")}
      </Button>
    </div>
  )
}

const PHOTO_TYPES = ["image/jpeg", "image/png"]
const PHOTO_MAX_BYTES = 2 * 1024 * 1024

function IdentityCard({ profile }: { profile: Profile }) {
  const t = useTranslations("profile")
  const tRole = useTranslations("roles")
  const user = { ...useUser(), ...profile }
  const input = useRef<HTMLInputElement>(null)
  const [photo, setPhoto] = useState(profile.photoUrl)
  const [photoError, setPhotoError] = useState<string>()
  const [busy, setBusy] = useState<"upload" | "remove">()

  // ponytail: no crop step (spec: square crop); the API stores the image as sent.
  async function onPhoto(file: File | undefined) {
    if (input.current) input.current.value = ""
    if (!file) return
    const tooBig = () => t("photo.tooBig", { file: file.name })
    const wrongType = () => t("photo.wrongType", { file: file.name })
    if (!PHOTO_TYPES.includes(file.type)) return setPhotoError(wrongType())
    if (file.size > PHOTO_MAX_BYTES) return setPhotoError(tooBig())

    setPhotoError(undefined)
    setBusy("upload")
    const data = new FormData()
    data.set("file", file)
    const result = await uploadPhoto(data).finally(() => setBusy(undefined))
    if ("photoUrl" in result) {
      setPhoto(result.photoUrl)
      notify.success(t("photo.done"))
    } else {
      const code = result.problem.fieldErrors[0]?.code
      setPhotoError(
        code === "FILE_TOO_LARGE"
          ? tooBig()
          : code === "UNSUPPORTED_FILE_TYPE"
            ? wrongType()
            : t("failed")
      )
    }
  }

  async function onRemove() {
    setPhotoError(undefined)
    setBusy("remove")
    const problem = await removePhoto().finally(() => setBusy(undefined))
    if (problem) return setPhotoError(t("failed"))
    setPhoto(undefined)
    notify.success(t("photo.removed"))
  }

  return (
    <Card variant="hero" aria-labelledby="profile-name" className="gap-5">
      <div className="flex items-center gap-4">
        <PersonAvatar
          name={user.name}
          userId={user.id}
          src={photo}
          size={56}
          tenantRing
        />
        <div className="min-w-0 flex-1">
          <h2 id="profile-name" className="truncate text-h3 font-bold">
            <bdi>{user.name}</bdi>
          </h2>
          <p className="truncate text-body text-muted-foreground">
            {[user.jobTitle, tRole(user.role)].filter(Boolean).join(" · ")}
          </p>
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <input
          ref={input}
          type="file"
          accept=".jpg,.jpeg,.png,image/jpeg,image/png"
          className="sr-only"
          tabIndex={-1}
          aria-hidden
          onChange={(event) => onPhoto(event.target.files?.[0])}
        />
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            loading={busy === "upload"}
            disabled={!!busy}
            onClick={() => input.current?.click()}
          >
            <CameraIcon aria-hidden />
            {t("photo.change")}
          </Button>
          {photo ? (
            <Button
              variant="ghost"
              size="sm"
              className="text-destructive"
              loading={busy === "remove"}
              disabled={!!busy}
              onClick={onRemove}
            >
              <Trash2Icon aria-hidden />
              {t("photo.remove")}
            </Button>
          ) : null}
        </div>
        <p className="text-caption text-muted-foreground">{t("photo.hint")}</p>
        {photoError ? (
          <p role="alert" className="text-body-sm text-error">
            {photoError}
          </p>
        ) : null}
      </div>
    </Card>
  )
}

const PhoneBody = z.object({
  phone: z.string().regex(/^\+?[0-9][0-9 ]{6,18}$/),
})

function DetailsCard({ profile }: { profile: Profile }) {
  const t = useTranslations("profile")
  const format = useFormat()
  const user = { ...useUser(), ...profile }
  const form = useForm({
    resolver: zodResolver(PhoneBody, codeErrorMap),
    defaultValues: { phone: user.phone },
  })

  const onSubmit = form.handleSubmit(async (body) => {
    const problem = await savePhone(body.phone)
    if (problem) {
      showProblem(form, problem)
      if (form.formState.errors.root) notify.error(t("failed"))
      return
    }
    form.reset(body)
    notify.success(t("details.phoneSaved"))
  })

  const rows = [
    [t("details.email"), user.email, "ltr"],
    [t("details.employeeCode"), user.employeeCode, "ltr"],
    [t("details.department"), user.department],
    [t("details.manager"), user.manager],
    [t("details.joined"), user.joinedOn && format.day(user.joinedOn, "long")],
  ] as const

  return (
    <Card aria-labelledby="details-title">
      <CardHeader>
        <CardTitle id="details-title">{t("details.title")}</CardTitle>
        <CardDescription>{t("details.description")}</CardDescription>
      </CardHeader>
      <dl className="grid gap-x-4 gap-y-3 text-body sm:grid-cols-[auto_1fr]">
        {rows.map(([label, value, dir]) => (
          <div key={label} className="contents">
            <dt className="text-muted-foreground">{label}</dt>
            <dd className="min-w-0 truncate font-medium max-sm:-mt-2">
              <bdi dir={dir}>{value}</bdi>
            </dd>
          </div>
        ))}
      </dl>
      <form
        onSubmit={onSubmit}
        noValidate
        className="flex flex-col gap-3 border-t pt-4"
      >
        <FieldGroup>
          <TextField
            form={form}
            name="phone"
            label={t("details.phone")}
            type="tel"
            autoComplete="tel"
            inputMode="tel"
            dir="ltr"
          />
        </FieldGroup>
        <CardFooter>
          <Button
            type="submit"
            disabled={!form.formState.isDirty}
            loading={form.formState.isSubmitting}
          >
            {t("details.savePhone")}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}

// next-themes only knows the stored theme on the client.
const noop = () => () => {}
function useMounted() {
  return useSyncExternalStore(
    noop,
    () => true,
    () => false
  )
}

/** Mobile only: the top bar carries language and theme on desktop. */
function PreferencesCard() {
  const t = useTranslations()
  const { theme = "system", setTheme } = useTheme()
  const mounted = useMounted()

  return (
    <Card aria-labelledby="prefs-title" className="md:hidden">
      <CardTitle id="prefs-title">{t("profile.preferences")}</CardTitle>
      <div className="flex items-center justify-between gap-3">
        <span className="text-body font-medium">{t("locale.label")}</span>
        <LocaleSwitcher />
      </div>
      <div className="flex items-center justify-between gap-3">
        <span id="theme-label" className="text-body font-medium">
          {t("theme.label")}
        </span>
        <ToggleGroup
          type="single"
          aria-labelledby="theme-label"
          value={mounted ? theme : ""}
          onValueChange={(value) => value && setTheme(value)}
          spacing={0}
          className="rounded-pill bg-muted p-0.5"
        >
          {THEMES.map((value) => (
            <ToggleGroupItem
              key={value}
              value={value}
              className="h-auto rounded-pill! px-3 py-1 text-body-sm font-medium text-subtle-foreground data-[state=on]:bg-inverse data-[state=on]:font-bold data-[state=on]:text-inverse-foreground"
            >
              {t(`theme.${value}`)}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>
    </Card>
  )
}

const passwordBody = (personal: string[]) =>
  z
    .object({ current: z.string().min(1), password: NewPassword })
    .refine((body) => !passwordRulesIssue(body.password, personal), {
      path: ["password"],
      message: "WEAK_PASSWORD",
    })

function PasswordCard() {
  const t = useTranslations("profile.password")
  const tProfile = useTranslations("profile")
  const tAuth = useTranslations("auth")
  const user = useUser()
  const personal = [user.name, user.email]
  const form = useForm({
    resolver: zodResolver(passwordBody(personal), codeErrorMap),
    defaultValues: { current: "", password: "" },
  })

  const onSubmit = form.handleSubmit(async (body) => {
    const problem = await changePassword(body)
    if (!problem) {
      form.reset()
      return notify.success(t("done"))
    }
    if (problem.code === "TOO_MANY_ATTEMPTS")
      return notify.error(tAuth("login.errors.locked"))
    showProblem(form, problem, {
      currentPassword: "current",
      newPassword: "password",
    })
    if (form.formState.errors.root) notify.error(tProfile("failed"))
  })

  return (
    <Card aria-labelledby="password-title">
      <CardHeader>
        <CardTitle id="password-title">{t("title")}</CardTitle>
        <CardDescription>{t("description")}</CardDescription>
      </CardHeader>
      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
        <FieldGroup>
          <PasswordField
            form={form}
            name="current"
            label={t("current")}
            variant="current"
          />
          <PasswordField
            form={form}
            name="password"
            label={t("new")}
            variant="new"
            personal={personal}
          />
        </FieldGroup>
        <CardFooter>
          <Button type="submit" loading={form.formState.isSubmitting}>
            {t("submit")}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
