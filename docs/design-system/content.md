# Content & voice

## Tone
Plain, warm and brief, like a helpful colleague. Sentence case everywhere. Address the reader as "you", never "the employee". No jokes in errors. No exclamation marks except the check-in success toast. The product UI never uses the marketing voice (no mascots, puns or all-caps).

## English microcopy
- Buttons are verb-first, at most 2 words (3 when a noun is needed: "Request leave").
- Labels are nouns, with no colon. Helper text is one sentence.
- Numbers are digits ("3 days"). Dates and times always come from `formatting.md`.
- **Banned:** invalid, error (alone), failed (alone), oops, kindly, user, submit (except "Submit request").

## Arabic microcopy
- Modern Standard Arabic. Never dialect, never machine translation: every string gets a native review.
- Buttons use the **verbal noun (مصدر)**, which is gender-neutral: «تسجيل الحضور», not «سجّل حضورك».
- Use the Arabic comma ، and question mark ؟. Wrap names, IDs, emails and times inside Arabic sentences in `<bdi>`.
- Plurals go through ICU MessageFormat (Arabic has 6 forms: zero/one/two/few/many/other).

## Error message formula
**[What is wrong, in the user's terms] + [the fix, using their data]**

- Field error: under the field, one sentence, linked with `aria-describedby`.
- Page or section error: title (what failed) + body (what still works + next step) + action. An optional support code sits beside it, never inside the sentence.
- Never show raw API text.

| Instead of | English | العربية |
|---|---|---|
| Invalid date | End date must be on or after Wed 14 Oct | يجب أن يكون تاريخ الانتهاء في الأربعاء 14 أكتوبر أو بعده |
| Insufficient balance | You have 2 days available | رصيدك المتاح يومان |
| Overlap error | You already have approved leave on 12 Oct | لديك إجازة معتمدة يوم 12 أكتوبر |
| Login failed | Email or password is incorrect | البريد الإلكتروني أو كلمة المرور غير صحيحة |
| Field required | Add a reason so HR can review it | أضف سببًا ليتمكن قسم الموارد البشرية من مراجعته |
| Time invalid | Check-out must be after check-in (08:02) | يجب أن يكون الانصراف بعد الحضور (08:02) |
| Network error | Couldn't send. Check your connection and try again. | تعذّر الإرسال. تحقّق من اتصالك وحاول مجددًا. |

## Status names (identical everywhere, FE-15)

| English | العربية | i18n key |
|---|---|---|
| Present | حاضر | `status.present` |
| Late | متأخر | `status.late` |
| Absent | غائب | `status.absent` |
| WFH | عمل عن بُعد | `status.wfh` |
| On Leave | في إجازة | `status.onLeave` |
| Business Trip | رحلة عمل | `status.businessTrip` |
| Holiday | عطلة رسمية | `status.holiday` |
| Missing Checkout | انصراف غير مسجّل | `status.missingCheckout` |
| Not yet checked in | لم يسجّل الحضور بعد | `status.notYet` |
| Out | خارج العمل | `status.out` |
| Pending | قيد الانتظار | `request.pending` |
| Approved | مقبول | `request.approved` |
| Rejected | مرفوض | `request.rejected` |
| Withdrawn | مسحوب | `request.withdrawn` |
| Cancellation requested | طُلب الإلغاء | `request.cancelRequested` |
| Cancelled | ملغى | `request.cancelled` |
| Invited / Active / Deactivated | مدعو / نشط / موقوف | `account.*` |

## Button labels

| English | العربية | English | العربية |
|---|---|---|---|
| Check in | تسجيل الحضور | Check out | تسجيل الانصراف |
| Request leave | طلب إجازة | New request | طلب جديد |
| Submit request | إرسال الطلب | Request correction | طلب تصحيح |
| Approve | موافقة | Reject | رفض |
| Withdraw | سحب الطلب | Request cancellation | طلب الإلغاء |
| Accept cancellation | قبول الإلغاء | Decline cancellation | رفض الإلغاء |
| Save changes | حفظ التغييرات | Save correction | حفظ التصحيح |
| Cancel | إلغاء | Keep editing | متابعة التعديل |
| Discard changes | تجاهل التغييرات | Keep pending | إبقاء الطلب معلّقًا |
| Export CSV | تصدير CSV | Import CSV | استيراد CSV |
| Send invite | إرسال الدعوة | Resend invite | إعادة إرسال الدعوة |
| Deactivate | إيقاف الحساب | Reactivate | إعادة التفعيل |
| Archive | أرشفة | Mark all read | تحديد الكل كمقروء |
| Try again | إعادة المحاولة | Clear filters | مسح عوامل التصفية |
| Log in | تسجيل الدخول | Log out | تسجيل الخروج |

## Empty-state copy

| Where | English (title · body) | العربية |
|---|---|---|
| My requests | No pending requests · Requests you send appear here until they're decided. | لا توجد طلبات قيد الانتظار · تظهر هنا طلباتك حتى يُبتّ فيها. |
| Approvals | You're all caught up · New requests from your team will show here. | لا شيء بانتظارك · ستظهر هنا الطلبات الجديدة من فريقك. |
| Dashboard (FE-09) | No time off coming up · Plan ahead: request leave in under a minute. + "Request leave" | لا إجازات قادمة · خطّط مسبقًا واطلب إجازتك في أقل من دقيقة. |
| Filtered list | No matches · {restate filters in words} + "Clear filters" | لا نتائج · … |
| New company (FE-13) | Your workspace is ready · Add holidays and invite your team to see live data. | مساحة العمل جاهزة · أضف العطلات وادعُ فريقك لعرض البيانات. |
| Notifications | Nothing new · Decisions on your requests will appear here. | لا جديد · ستظهر هنا القرارات المتعلقة بطلباتك. |
| Calendar | Everyone's in · Nobody is out on these dates. | الجميع موجود · لا أحد خارج العمل في هذه التواريخ. |
| Reports (FE-14) | No data for these filters · Try a wider date range or another department. | لا بيانات لهذه التصفية · جرّب نطاقًا زمنيًا أوسع أو قسمًا آخر. |
| Chart, < 5 points | Trends appear after your first week | تظهر الاتجاهات بعد أسبوعك الأول |

## Notification copy
Formula: **[Actor] [past-tense verb] [your thing] · [dates]**, max 90 characters, deep link required. Never include a colleague's leave type or reason unless the recipient is their approver or HR.

| To | English | العربية |
|---|---|---|
| Employee | Khalid approved your WFH · Sun 11 Oct | وافق خالد على عملك عن بُعد · الأحد 11 أكتوبر |
| Employee | Khalid rejected your leave · 11–15 Oct. Reason: {reason} | رفض خالد إجازتك · 11–15 أكتوبر. السبب: {reason} |
| Employee | You didn't check out on Mon 5 Oct. Request a correction | لم تسجّل الانصراف يوم الإثنين 5 أكتوبر. اطلب تصحيحًا |
| Employee | HR corrected your attendance · Mon 5 Oct | صحّح قسم الموارد البشرية حضورك · الإثنين 5 أكتوبر |
| Manager | Sara requested annual leave · 11–15 Oct | طلبت سارة إجازة سنوية · 11–15 أكتوبر |
| Manager | Omar asked to cancel approved leave · 20 Oct | طلب عمر إلغاء إجازة معتمدة · 20 أكتوبر |
| HR | Fatima requested an attendance correction · Mon 5 Oct | طلبت فاطمة تصحيح الحضور · الإثنين 5 أكتوبر |
| HR | 3 requests are waiting more than 3 days | 3 طلبات تنتظر منذ أكثر من 3 أيام |
| Teammate | Noura is out · 11–15 Oct | نورة خارج العمل · 11–15 أكتوبر |
