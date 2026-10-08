import { Card } from "@workspace/ui/components/card"

/** The centred 400px auth card. A company logo (48, tenant ring) shows when the company is known. */
export function AuthCard({
  title,
  description,
  company,
  children,
}: {
  title: string
  description?: React.ReactNode
  company?: string
  children?: React.ReactNode
}) {
  return (
    <Card className="w-full max-w-100 gap-6 p-6 sm:p-8">
      {company ? (
        <span
          aria-hidden
          className="flex size-12 items-center justify-center rounded-md bg-inverse text-h4 font-bold text-inverse-foreground ring-2 ring-tenant ring-offset-2 ring-offset-card"
        >
          {company.charAt(0)}
        </span>
      ) : null}
      <div className="flex flex-col gap-1.5">
        <h1 className="text-h2 font-bold">{title}</h1>
        {description ? (
          <p className="text-body text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {children}
    </Card>
  )
}
