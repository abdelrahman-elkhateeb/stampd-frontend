"use client"

import * as React from "react"
import { cn } from "@workspace/ui/lib/utils"
import { Avatar as AvatarPrimitive } from "radix-ui"

function Avatar({
  className,
  size = "default",
  ...props
}: React.ComponentProps<typeof AvatarPrimitive.Root> & {
  size?: "default" | "sm" | "lg"
}) {
  return (
    <AvatarPrimitive.Root
      data-slot="avatar"
      data-size={size}
      className={cn(
        "group/avatar relative flex size-8 shrink-0 rounded-full select-none after:absolute after:inset-0 after:rounded-full after:border after:border-border after:mix-blend-darken data-[size=lg]:size-10 data-[size=sm]:size-6 dark:after:mix-blend-lighten",
        className
      )}
      {...props}
    />
  )
}

function AvatarImage({
  className,
  ...props
}: React.ComponentProps<typeof AvatarPrimitive.Image>) {
  return (
    <AvatarPrimitive.Image
      data-slot="avatar-image"
      className={cn(
        "aspect-square size-full rounded-full object-cover",
        className
      )}
      {...props}
    />
  )
}

function AvatarFallback({
  className,
  ...props
}: React.ComponentProps<typeof AvatarPrimitive.Fallback>) {
  return (
    <AvatarPrimitive.Fallback
      data-slot="avatar-fallback"
      className={cn(
        "flex size-full items-center justify-center rounded-full bg-muted text-sm text-muted-foreground group-data-[size=sm]/avatar:text-xs",
        className
      )}
      {...props}
    />
  )
}

function AvatarBadge({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="avatar-badge"
      className={cn(
        "absolute end-0 bottom-0 z-10 inline-flex items-center justify-center rounded-full bg-primary text-primary-foreground bg-blend-color ring-2 ring-background select-none",
        "group-data-[size=sm]/avatar:size-2 group-data-[size=sm]/avatar:[&>svg]:hidden",
        "group-data-[size=default]/avatar:size-2.5 group-data-[size=default]/avatar:[&>svg]:size-2",
        "group-data-[size=lg]/avatar:size-3 group-data-[size=lg]/avatar:[&>svg]:size-2",
        className
      )}
      {...props}
    />
  )
}

function AvatarGroup({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="avatar-group"
      className={cn(
        "group/avatar-group flex -space-x-2 *:data-[slot=avatar]:ring-2 *:data-[slot=avatar]:ring-background",
        className
      )}
      {...props}
    />
  )
}

function AvatarGroupCount({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="avatar-group-count"
      className={cn(
        "relative flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-sm text-muted-foreground ring-2 ring-background group-has-data-[size=lg]/avatar-group:size-10 group-has-data-[size=sm]/avatar-group:size-6 [&>svg]:size-4 group-has-data-[size=lg]/avatar-group:[&>svg]:size-5 group-has-data-[size=sm]/avatar-group:[&>svg]:size-3",
        className
      )}
      {...props}
    />
  )
}

const AVATAR_TONES = [
  "bg-avatar-1",
  "bg-avatar-2",
  "bg-avatar-3",
  "bg-avatar-4",
  "bg-avatar-5",
  "bg-avatar-6",
] as const

const SIZES = {
  24: "size-6 text-[0.625rem]",
  32: "size-8 text-caption",
  40: "size-10 text-body-sm",
  56: "size-14 text-body-lg",
} as const

/** Same person, same colour: hash(userId) % 6. The colour carries no meaning. */
function avatarTone(userId: string) {
  let hash = 0
  for (const char of userId) hash = (hash * 31 + char.charCodeAt(0)) | 0
  return AVATAR_TONES[Math.abs(hash) % AVATAR_TONES.length]!
}

/** First letter of the first and last name; Arabic letters get a thin space between them. */
function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  const letters = [
    parts[0],
    parts.length > 1 ? parts[parts.length - 1] : undefined,
  ]
    .filter((part): part is string => Boolean(part))
    .map((part) => part.charAt(0))
  const arabic = /[\u0600-\u06ff]/.test(name)
  return arabic ? letters.join("\u2009") : letters.join("").toUpperCase()
}

type PersonAvatarProps = {
  name: string
  userId: string
  src?: string
  size?: keyof typeof SIZES
  /** Presence dot colour class, e.g. "bg-status-present". The name or nearby text must say it too. */
  presenceClassName?: string
  tenantRing?: boolean
  /** True when the visible name is right next to it (the default). */
  decorative?: boolean
  className?: string
}

// docs/design-system/components/avatar.md
function PersonAvatar({
  name,
  userId,
  src,
  size = 32,
  presenceClassName,
  tenantRing = false,
  decorative = true,
  className,
}: PersonAvatarProps) {
  return (
    <AvatarPrimitive.Root
      data-slot="avatar"
      role={decorative ? undefined : "img"}
      aria-label={decorative ? undefined : name}
      aria-hidden={decorative || undefined}
      className={cn(
        "relative inline-flex shrink-0 rounded-pill font-bold select-none",
        SIZES[size],
        tenantRing && "ring-2 ring-tenant ring-offset-2 ring-offset-card",
        className
      )}
    >
      {src ? (
        <AvatarPrimitive.Image
          src={src}
          alt=""
          loading="lazy"
          className="size-full rounded-pill object-cover"
        />
      ) : null}
      <AvatarPrimitive.Fallback
        className={cn(
          "flex size-full items-center justify-center rounded-pill text-avatar-foreground",
          avatarTone(userId)
        )}
      >
        {initials(name)}
      </AvatarPrimitive.Fallback>
      {presenceClassName ? (
        <span
          className={cn(
            "absolute -end-0.5 -bottom-0.5 size-2.5 rounded-pill ring-2 ring-card",
            presenceClassName
          )}
        />
      ) : null}
    </AvatarPrimitive.Root>
  )
}

function PersonAvatarGroup({
  people,
  max = 3,
  size = 32,
  moreLabel,
}: {
  people: Omit<PersonAvatarProps, "size" | "decorative">[]
  max?: number
  size?: 24 | 32
  /** Accessible text for the overflow, e.g. "and 4 more". */
  moreLabel?: (count: number) => string
}) {
  const shown = people.slice(0, max)
  const rest = people.length - shown.length
  return (
    <span className="inline-flex items-center">
      {shown.map((person, index) => (
        <PersonAvatar
          key={person.userId}
          {...person}
          size={size}
          className={cn("ring-2 ring-card", index > 0 && "-ms-2")}
        />
      ))}
      {rest > 0 ? (
        <span
          className={cn(
            "-ms-2 inline-flex items-center justify-center rounded-pill bg-inverse font-bold text-inverse-foreground ring-2 ring-card",
            SIZES[size]
          )}
        >
          <span aria-hidden>+{rest}</span>
          {moreLabel ? (
            <span className="sr-only">{moreLabel(rest)}</span>
          ) : null}
        </span>
      ) : null}
    </span>
  )
}

export {
  avatarTone,
  initials,
  PersonAvatar,
  PersonAvatarGroup,
  Avatar,
  AvatarImage,
  AvatarFallback,
  AvatarGroup,
  AvatarGroupCount,
  AvatarBadge,
}
