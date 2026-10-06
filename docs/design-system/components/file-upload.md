# File upload / dropzone · v0.4

**Purpose.** Upload files: CSV import (FE-05), company logo (FE-04), profile photo (FE-03).

**Anatomy.** Dropzone (1.5px dashed `--input`, radius lg, height 120): upload icon, "**Choose a file** or drag it here" (the button is underlined), constraints line ("{types} · up to {size}") · file row after selection (file icon, name, size, progress or status, actions).

**Variants.** `csv` (types .csv; 5 MB; 1,000 rows; "Download template" link above) · `image` (PNG/SVG/JPG; logo 1 MB, photo 2 MB; square crop step with a preview before upload; result shown as the avatar or logo tile) · `compact` (a button only, for tight spaces).

**States.** idle · drag-over (`--brand-subtle` + 2px dashed `--border-strong`, text "Drop to upload") · validating · uploading (determinate progress `sm` + cancel ×) · done (file row: Replace · Remove) · error (inline alert: "{file} isn't supported. Use PNG, SVG or JPG." / "{file} is larger than 5 MB."). A failed file is not kept.

**Behaviour.**
- The real control is a visually hidden `<input type="file" accept>` behind a labelled button. Drag-and-drop is an enhancement only.
- Validate type (by MIME and extension) and size on the client, and again on the server.
- One file at a time.
- SVG logos are sanitised on the server.
- Uploads go to a signed URL with progress events. Cancel aborts.

**Accessibility.** The dropzone is not focusable; its button is. Status changes go through a polite live region ("Uploading, 64%" every 25%; "Upload complete"; errors use `role="alert"`).

**RTL.** The layout mirrors. File names are wrapped in `<bdi>`.

**Props.**
```ts
interface FileUploadProps { variant: 'csv' | 'image' | 'compact'; accept: string[]; maxBytes: number; onUpload: (file: File, onProgress: (pct: number) => void, signal: AbortSignal) => Promise<{ url?: string }>; value?: { name: string; size: number; url?: string }; onRemove?: () => void; templateHref?: string; crop?: { aspect: 1 }; }
```

**Tokens.** `--input`, `--brand-subtle`, `--border-strong`, `--card`, `--border`, `--foreground` (progress), `--error`, `--error-bg`, `--radius-lg`.
