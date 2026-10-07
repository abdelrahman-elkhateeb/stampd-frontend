/** A labelled row of examples inside a section. */
export function Demo({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-caption font-semibold text-muted-foreground">
        {title}
      </h3>
      <div className="flex flex-wrap items-start gap-3">{children}</div>
    </div>
  )
}
