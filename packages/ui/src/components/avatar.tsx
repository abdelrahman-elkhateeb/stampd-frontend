"use client"

import { cn } from "@workspace/ui/lib/utils"
import { Avatar as AvatarPrimitive } from "radix-ui"

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

export { avatarTone, initials, PersonAvatar, PersonAvatarGroup }
