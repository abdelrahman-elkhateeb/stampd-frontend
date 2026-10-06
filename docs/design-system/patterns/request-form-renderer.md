# Pattern · Metadata-driven request form · v0.4

**Purpose.** FE-08: "a new request type added on the backend with metadata can be submitted from the hub without a new screen". One renderer turns BE-11 type metadata into a form.

## Metadata (contract with BE-11)
```json
{
  "key": "business_trip",
  "label": { "en": "Business trip", "ar": "رحلة عمل" },
  "description": { "en": "Travel for work", "ar": "سفر لأغراض العمل" },
  "category": "trip",
  "approver": "manager",
  "enabled": true,
  "fields": [
    { "key": "dates", "type": "date-range", "required": true },
    { "key": "destination", "type": "text", "label": { "en": "Destination", "ar": "الوجهة" }, "maxLength": 80, "required": true },
    { "key": "purpose", "type": "textarea", "label": { "en": "Purpose", "ar": "الغرض" }, "maxLength": 500, "required": true }
  ]
}
```
- `category` ∈ `leave | wfh | trip | permission | correction` selects the `--cat-*` colour and the icon. Unknown categories fall back to a neutral chip + `FileText`.
- `approver: "hr"` shows the note "Reviewed by HR" at the top of the form (FE-08).

## Field type → component
| type | Component | Notes |
|---|---|---|
| `date` | Date picker | plain date |
| `date-range` | Date-range picker | `leave` variant when the category is leave (preview + balance) |
| `time` / `time-range` | Time input | company time, with duration for ranges |
| `text` | Input | `maxLength` → counter |
| `textarea` | Textarea | `reason` variant when the key is `reason` |
| `select` | Select / Combobox | `options` inline or `optionsUrl` |
| `number` | Number stepper | `min/max/step/unit` |
| `boolean` | Checkbox | |

## Rules
1. Build a zod schema from the metadata: required, min/max, maxLength, pattern, and date constraints (`notBefore: "today"`).
2. Layout: the type header (category chip + description) → fields in metadata order → the live preview, if the type supports one → actions. Follows `forms-validation.md`.
3. Server errors map by field `key`. Errors for unknown keys go to the section alert.
4. **Fail closed:** an unknown field type means the form shows "This request type can't be submitted here yet. Contact your admin." with no submit, and logs it.
5. i18n: labels and descriptions come from the metadata in the user's language, falling back to English with a logged missing-translation warning.
6. The type picker (New request) lists only `enabled` types (FE-08 AC). Leave opens the dedicated FE-07 flow.
