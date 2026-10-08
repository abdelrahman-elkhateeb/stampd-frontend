"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { CameraIcon, LogOutIcon } from "lucide-react"
import { useTranslations } from "next-intl"
import { useTheme } from "next-themes"
import { useRef, useState, useSyncExternalStore } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"

import { MoreNav, THEMES } from "@/components/app-shell"
import { PasswordField, TextField } from "@/components/form-fields"
import { LocaleSwitcher } from "@/components/locale-switcher"
import { Link } from "@/i18n/navigation"
import { DEMO_USER } from "@/lib/demo-user"
import { codeErrorMap } from "@/lib/forms"
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

const user = DEMO_USER

export function ProfilePage() {
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
          <IdentityCard />
          <DetailsCard />
        </div>
        <div className="flex flex-col gap-4 lg:gap-6">
          <PreferencesCard />
          <PasswordCard />
        </div>
      </div>

      <MoreNav />

      {/* On desktop, log out is in the account menu. */}
      <Button variant="outline" className="text-destructive md:hidden" asChild>
        <Link href="/login">
          <LogOutIcon aria-hidden className="flip-rtl" />
          {tAuth("logout")}
        </Link>
      </Button>
    </div>
  )
}

const PHOTO_TYPES = ["image/jpeg", "image/png"]
const PHOTO_MAX_BYTES = 2 * 1024 * 1024

function IdentityCard() {
  const t = useTranslations("profile")
  const tRole = useTranslations("roles")
  const input = useRef<HTMLInputElement>(null)
  const [photo, setPhoto] = useState<string>()
  const [photoError, setPhotoError] = useState<string>()

  // ponytail: no crop step and no upload (BE-05); the photo shows locally until reload.
  function onPhoto(file: File | undefined) {
    if (!file) return
    if (!PHOTO_TYPES.includes(file.type)) {
      setPhotoError(t("photo.wrongType", { file: file.name }))
    } else if (file.size > PHOTO_MAX_BYTES) {
      setPhotoError(t("photo.tooBig", { file: file.name }))
    } else {
      setPhotoError(undefined)
      setPhoto(URL.createObjectURL(file))
      notify.success(t("photo.done"))
    }
    if (input.current) input.current.value = ""
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
            {user.jobTitle} · {tRole(user.role)}
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
        <Button
          variant="outline"
          size="sm"
          className="w-fit"
          onClick={() => input.current?.click()}
        >
          <CameraIcon aria-hidden />
          {t("photo.change")}
        </Button>
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

function DetailsCard() {
  const t = useTranslations("profile")
  const format = useFormat()
  const form = useForm({
    resolver: zodResolver(PhoneBody, codeErrorMap),
    defaultValues: { phone: user.phone },
  })

  // ponytail: no API yet (BE-05); the value stays until reload.
  const onSubmit = form.handleSubmit((body) => {
    form.reset(body)
    notify.success(t("details.phoneSaved"))
  })

  const rows = [
    [t("details.email"), user.email, "ltr"],
    [t("details.employeeCode"), user.employeeCode, "ltr"],
    [t("details.department"), user.department],
    [t("details.manager"), user.manager],
    [t("details.joined"), format.day(user.joinedOn, "long")],
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
          <Button type="submit" disabled={!form.formState.isDirty}>
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

const PasswordBody = z
  .object({ current: z.string().min(1), password: NewPassword })
  .refine(
    (body) => !passwordRulesIssue(body.password, [user.name, user.email]),
    { path: ["password"], message: "WEAK_PASSWORD" }
  )

function PasswordCard() {
  const t = useTranslations("profile.password")
  const form = useForm({
    resolver: zodResolver(PasswordBody, codeErrorMap),
    defaultValues: { current: "", password: "" },
  })

  // ponytail: no API yet (BE-02); the server checks the current password and signs out other sessions.
  const onSubmit = form.handleSubmit(() => {
    form.reset()
    notify.success(t("done"))
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
            personal={[user.name, user.email]}
          />
        </FieldGroup>
        <CardFooter>
          <Button type="submit">{t("submit")}</Button>
        </CardFooter>
      </form>
    </Card>
  )
}
