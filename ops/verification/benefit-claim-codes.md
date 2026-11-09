# Coupon claim folios — 2026-11-04
Canonical wallet: /miscompras. Purchase receipts: /miscompras?vista=compras. Coupon details: /miscompras/cupones/:id.
Legacy account history/detail URLs redirect preserving the remaining query.
Superadmin: enable custom claim folio, enter unique uppercase 3–48 character code (letters/numbers/dash/underscore), save campaign. Codes may coexist with automatic event rules; omit event selection for code-only distribution.
Authenticated users claim in the wallet; claim does not redeem or consume uses. Existing coupon assignment is returned idempotently. Campaign activity, start/end, total cap and configured uses remain enforced. Ten attempts per user per 15 minutes. Codes are not included in athlete coupon JSON.
Appearance: background_color, text_color, button_background_color, button_text_color, button_label shared between card and detail.
Database verification: benefit-claim-codes.sql runs entirely in a transaction and rolls back fixtures. Last result PASS. Site and portal production builds passed.
