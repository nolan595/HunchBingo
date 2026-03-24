# PR: Dynamic Segments

## What Changed
Replaced the hardcoded `SheetSegment` enum (EASY/MEDIUM/HARD) with a fully dynamic `Segment` model. Admins can now create, rename, and delete custom segment names from a new **Segments** tab in the sidebar. Segments are then assigned to bingo sheets via a clickable selector in the SheetBuilder.

## Files Modified
| File | Change |
|------|--------|
| `prisma/schema.prisma` | Removed `SheetSegment` enum; added `Segment` model; `BingoSheet.segment` is now a nullable FK relation |
| `prisma/migrations/20260324000000_add_segments_model/migration.sql` | Custom migration — creates `segments` table, seeds Easy/Medium/Hard, migrates existing enum values, drops old column |
| `app/segments/actions.ts` | New — `createSegment`, `updateSegment`, `deleteSegment` server actions |
| `app/segments/page.tsx` | New — Segments list page (server component) |
| `app/segments/SegmentManager.tsx` | New — CRUD UI matching Difficulties manager style |
| `app/bingo-sheets/actions.ts` | `SheetSegment` → `segmentId: number \| null` in all three actions |
| `app/bingo-sheets/SheetBuilder.tsx` | Accepts `segments: Segment[]`; renders dynamic pill buttons with cycling colour palette |
| `app/bingo-sheets/BingoSheetList.tsx` | Reads `sheet.segment.name` from relation instead of enum |
| `app/bingo-sheets/page.tsx` | Added `segment: true` to Prisma include |
| `app/bingo-sheets/new/page.tsx` | Fetches segments and passes to SheetBuilder |
| `app/bingo-sheets/[id]/edit/page.tsx` | Fetches segments; passes `defaultSegmentId`; removed `SheetSegment` import |
| `components/layout/sidebar.tsx` | Added Segments nav link (Tag icon, between Events and Difficulties) |

## Migration Steps (required before deploy)

1. Run the migration against the Railway database:
   ```bash
   cd hunch-bingo
   npx prisma migrate deploy
   ```
   This will apply `20260324000000_add_segments_model` which:
   - Creates the `segments` table
   - Seeds Easy / Medium / Hard rows
   - Maps existing sheet `segment` enum values to FK references
   - Drops the old `segment` column and `SheetSegment` enum type

2. Regenerate the Prisma client:
   ```bash
   npx prisma generate
   ```

3. Deploy to Netlify (auto-deploys on push to main).

## Environment Variables
No new env vars required.

## Rollback Plan
If the migration needs to be reversed:
1. Restore from Railway's point-in-time backup (taken before migration)
2. Revert the code commit
3. Re-deploy

Manual rollback SQL (if backup unavailable — data loss on segment assignments):
```sql
-- Re-add the old enum
CREATE TYPE "SheetSegment" AS ENUM ('EASY', 'MEDIUM', 'HARD');
ALTER TABLE "bingo_sheets" ADD COLUMN "segment" "SheetSegment";
-- Drop new columns
ALTER TABLE "bingo_sheets" DROP COLUMN "segment_id";
DROP TABLE "segments";
```

## QA Notes
- Existing sheets with EASY/MEDIUM/HARD segments will automatically map to the seeded Easy/Medium/Hard segment rows — no data loss.
- Sheets with no segment remain unassigned.
- Deleting a segment sets `segmentId = NULL` on all sheets using it (ON DELETE SET NULL).
