# Archive Feature Documentation

## Overview

The archive feature allows users to hide tasks from their board without permanently deleting them. Archived tasks can be viewed and restored at any time.

---

## Database Schema Changes

### Migration: `add_archived_to_tasks.sql`

Two new columns added to the `tasks` table:

```sql
-- Boolean flag to indicate if task is archived
archived BOOLEAN DEFAULT FALSE NOT NULL

-- Timestamp of when task was archived
archived_at TIMESTAMP WITH TIME ZONE
```

**Indexes Created:**
- `idx_tasks_archived` - For filtering archived tasks
- `idx_tasks_board_archived` - For efficient queries combining board_id and archived status

---

## API Functions

### `archiveTask(taskId: string)`

Archives a task by setting `archived = true` and recording the timestamp.

**Features:**
- Rate limited (10 requests/minute)
- Requires authentication
- Sets `archived_at` to current timestamp

### `unarchiveTask(taskId: string)`

Restores an archived task back to the board.

**Features:**
- Rate limited (10 requests/minute)
- Requires authentication
- Clears `archived_at` timestamp

### `getArchivedTasks(boardId: string)`

Retrieves all archived tasks for a specific board.

**Returns:** Array of tasks sorted by `archived_at` (most recent first)

### `getBoardWithData(boardId: string)` - Updated

Now filters out archived tasks from the board view automatically.

---

## UI Components

### `ArchivedTasksDialog`

Modal dialog for viewing and managing archived tasks.

**Location:** Appears as "Archived" button next to "Add Task" button

**Features:**
- Lists all archived tasks with details
- Shows when task was archived
- Displays task category with color
- **Restore** button - Unarchives task back to board
- **Delete** button - Permanently deletes task
- Badge showing count of archived tasks
- Responsive design with scroll area

**Props:**
```typescript
{
  boardId: string              // Current board ID
  onTaskRestored: () => void   // Callback when task is restored
}
```

### `EditTaskDialog` - Updated

Now includes an **Archive** button in the footer.

**New Props:**
```typescript
{
  onArchiveTask?: (taskId: string) => void
}
```

**Archive Button:**
- Positioned on the left side of dialog footer
- Confirmation prompt before archiving
- Icon: Archive (from Lucide)

---

## User Workflow

### Archiving a Task

1. Click on any task card to open edit dialog
2. Click **Archive** button in dialog footer
3. Confirm the action in the prompt
4. Task disappears from board
5. Task is now accessible in "Archived" view

### Viewing Archived Tasks

1. Click **Archived** button (shows count badge if tasks exist)
2. Dialog opens showing all archived tasks
3. Each task displays:
   - Title
   - Description (if exists)
   - Category badge with color
   - Timestamp of when archived

### Restoring a Task

1. Open Archived Tasks dialog
2. Find the task you want to restore
3. Click **Restore** button
4. Task reappears on the board in its original column

### Permanently Deleting an Archived Task

1. Open Archived Tasks dialog
2. Find the task you want to delete
3. Click trash icon button
4. Confirm deletion (irreversible)
5. Task is permanently removed

---

## Security Features

### Rate Limiting
- Archive operations: 10 per minute per user
- Unarchive operations: 10 per minute per user
- Prevents abuse and API spam

### Authentication
- All archive operations require valid user session
- RLS policies ensure users can only archive/unarchive their own tasks

### Error Handling
- User-friendly error messages
- Automatic UI revert on failure
- Rate limit error messages with retry guidance

---

## Implementation Details

### Optimistic Updates

Both archive and unarchive operations use optimistic UI updates:

1. **Immediate UI Update** - Task removed/added instantly
2. **API Call** - Archive state updated in database
3. **Error Recovery** - If API fails, UI reverts to previous state

### Task Filtering

Archived tasks are filtered at the API level in `getBoardWithData()`:

```typescript
tasks: column.tasks
  .filter((task: Task) => !task.archived)
  .sort((a: Task, b: Task) => a.position - b.position)
```

This ensures archived tasks never appear in normal board view.

### Category Colors

Archived tasks retain their category colors by reading from localStorage, ensuring visual consistency when viewing archived tasks.

---

## Database Migration Instructions

### For Supabase

Run the migration in your Supabase SQL Editor:

```sql
-- Copy contents of supabase/migrations/add_archived_to_tasks.sql
```

### Verification

Check that the migration was successful:

```sql
-- Verify columns exist
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'tasks'
  AND column_name IN ('archived', 'archived_at');

-- Should return:
-- archived     | boolean   | NO  | false
-- archived_at  | timestamp | YES | NULL
```

---

## Testing Checklist

- [ ] Archive a task from edit dialog
- [ ] Verify task disappears from board
- [ ] Open archived tasks dialog
- [ ] Verify archived task appears in list
- [ ] Restore an archived task
- [ ] Verify task reappears on board
- [ ] Permanently delete an archived task
- [ ] Verify deletion confirmation prompt
- [ ] Test rate limiting by archiving 15 tasks rapidly
- [ ] Test with multiple boards (archived tasks should be board-specific)
- [ ] Test with tasks that have categories
- [ ] Test with tasks that have no category

---

## Future Enhancements

Potential improvements for the archive feature:

1. **Bulk Actions**
   - Archive multiple tasks at once
   - Restore multiple tasks at once

2. **Auto-Archive**
   - Automatically archive tasks after X days in "Done" column
   - Configurable per board

3. **Archive Search**
   - Search within archived tasks
   - Filter by category, date, etc.

4. **Export Archives**
   - Export archived tasks to CSV/JSON
   - For backup or analysis purposes

5. **Archive Statistics**
   - Show total archived tasks count
   - Archive history/timeline

---

## Troubleshooting

### Archived tasks not appearing in dialog

**Check:**
1. Database migration completed successfully
2. RLS policies allow reading archived tasks
3. Board ID is correct
4. Browser console for errors

### Cannot restore task

**Check:**
1. Rate limiting (wait 1 minute and try again)
2. User authentication is valid
3. Task still exists in database
4. Network connection

### Archive button not showing

**Check:**
1. `onArchiveTask` prop is passed to `EditTaskDialog`
2. User has permission to edit tasks
3. Component imported correctly

---

## Related Files

- **Migration:** `supabase/migrations/add_archived_to_tasks.sql`
- **API Functions:** `lib/api/boards.ts`
- **UI Component:** `components/archived-tasks-dialog.tsx`
- **Edit Dialog:** `components/edit-task-dialog.tsx`
- **Main Board:** `components/supabase-kanban-board.tsx`
- **Documentation:** `docs/ARCHIVE_FEATURE.md` (this file)

---

## Support

For questions or issues with the archive feature:
1. Check this documentation
2. Review database migration logs
3. Check browser console for errors
4. Verify Supabase RLS policies
