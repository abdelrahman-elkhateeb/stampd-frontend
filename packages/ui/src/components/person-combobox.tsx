"use client"

import * as React from "react"
import { ChevronsUpDownIcon } from "lucide-react"
import { cn } from "@workspace/ui/lib/utils"

import { PersonAvatar } from "@workspace/ui/components/avatar"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@workspace/ui/components/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@workspace/ui/components/popover"

// docs/design-system/components/select.md › combobox: people pickers search by name and title.
// Used for the manager (FE-05) and "on behalf of" (FE-08).
// ponytail: popover only; the mobile bottom-sheet variant comes when a phone screen needs it.

type Person = { id: string; name: string; detail?: string }

type PersonComboboxProps = {
  id?: string
  value: string
  onChange: (id: string) => void
  people: Person[]
  /** Shown when nothing matches the value; also the "none" option's label when `noneValue` is set. */
  placeholder: string
  searchPlaceholder: string
  emptyText: string
  /** Adds a first option meaning "nobody" with this value. */
  noneValue?: string
  invalid?: boolean
  describedBy?: string
  onBlur?: () => void
}

function PersonCombobox({
  ref,
  id,
  value,
  onChange,
  people,
  placeholder,
  searchPlaceholder,
  emptyText,
  noneValue,
  invalid,
  describedBy,
  onBlur,
}: PersonComboboxProps & { ref?: React.Ref<HTMLButtonElement> }) {
  const [open, setOpen] = React.useState(false)
  const selected = people.find((person) => person.id === value)

  function choose(next: string) {
    onChange(next)
    onBlur?.()
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          ref={ref}
          id={id}
          type="button"
          role="combobox"
          aria-expanded={open}
          aria-invalid={invalid || undefined}
          aria-describedby={describedBy}
          className={cn(
            "flex h-control w-full items-center gap-2 rounded-md border border-input bg-card px-3 text-start text-ui outline-none hover:border-input-hover focus-visible:border-border-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring focus-visible:outline-solid aria-expanded:border-border-strong aria-invalid:border-[1.5px] aria-invalid:border-error",
            !selected && "text-muted-foreground"
          )}
        >
          {selected ? (
            <>
              <PersonAvatar
                name={selected.name}
                userId={selected.id}
                size={24}
              />
              <bdi className="truncate">{selected.name}</bdi>
            </>
          ) : (
            placeholder
          )}
          <ChevronsUpDownIcon
            aria-hidden
            className="ms-auto size-4 shrink-0 text-muted-foreground"
          />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-(--radix-popover-trigger-width) min-w-64 gap-0 border border-border p-0 shadow-pop"
      >
        <Command>
          <CommandInput placeholder={searchPlaceholder} />
          <CommandList>
            <CommandEmpty>{emptyText}</CommandEmpty>
            <CommandGroup>
              {noneValue !== undefined ? (
                <CommandItem
                  value={noneValue}
                  keywords={[placeholder]}
                  data-checked={value === noneValue}
                  onSelect={() => choose(noneValue)}
                >
                  {placeholder}
                </CommandItem>
              ) : null}
              {people.map((person) => (
                <CommandItem
                  key={person.id}
                  value={person.id}
                  keywords={[person.name, person.detail ?? ""]}
                  data-checked={value === person.id}
                  onSelect={() => choose(person.id)}
                >
                  <PersonAvatar
                    name={person.name}
                    userId={person.id}
                    size={24}
                  />
                  <span className="flex min-w-0 flex-col">
                    <bdi className="truncate">{person.name}</bdi>
                    {person.detail ? (
                      <span className="truncate text-caption text-muted-foreground">
                        <bdi>{person.detail}</bdi>
                      </span>
                    ) : null}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

export { PersonCombobox, type Person, type PersonComboboxProps }
