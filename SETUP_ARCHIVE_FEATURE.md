# Quick Setup Guide - Archive Feature

## 🚀 Setup Instructions

### Step 1: Run Database Migration

In your Supabase SQL Editor, run:

```sql
-- Add archived functionality to tasks table
ALTER TABLE public.tasks 
ADD COLUMN IF NOT EXISTS archived BOOLEAN DEFAULT FALSE NOT NULL;

ALTER TABLE public.tasks 
ADD COLUMN IF NOT EXISTS archived_at TIMESTAMP WITH TIME ZONE;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_tasks_archived ON public.tasks(archived);
CREATE INDEX IF NOT EXISTS idx_tasks_board_archived ON public.tasks(board_id, archived);

-- Add comments
COMMENT ON COLUMN public.tasks.archived IS 'Whether the task is archived (hidden from board)';
COMMENT ON COLUMN public.tasks.archived_at IS 'Timestamp when the task was archived';
```

### Step 2: Verify Installation

**Check the components are in place:**
- ✅ `components/archived-tasks-dialog.tsx` - Created
- ✅ `components/edit-task-dialog.tsx` - Updated with archive button
- ✅ `components/supabase-kanban-board.tsx` - Integrated archive functionality
- ✅ `lib/api/boards.ts` - Added archive/unarchive/getArchivedTasks functions

### Step 3: Test the Feature

1. **Start your dev server:**
   ```bash
   pnpm dev
   ```

2. **Navigate to your board**

3. **Archive a task:**
   - Click any task to edit it
   - Click the "Archive" button at the bottom
   - Confirm the action
   - Task should disappear from board

4. **View archived tasks:**
   - Click the "Archived" button (next to "Add Task")
   - You should see your archived task

5. **Restore a task:**
   - In the Archived dialog, click "Restore" on any task
   - Task should reappear on the board

---

## ✨ Features Available

### For Users:

- **Archive tasks** - Hide completed or unnecessary tasks without deletion
- **View all archived tasks** - Access from "Archived" button
- **Restore tasks** - Bring archived tasks back to the board
- **Permanently delete** - Remove archived tasks forever
- **Badge counter** - See how many archived tasks exist

### Technical Features:

- **Optimistic UI updates** - Instant feedback
- **Rate limiting** - 10 operations per minute per user
- **Error handling** - Automatic rollback on failure
- **Security** - RLS policies ensure data privacy
- **Input validation** - All operations validated
- **Logging** - Debug logs in development mode

---

## 🎨 UI Components

### Archived Button
- **Location:** Next to "Add Task" button
- **Badge:** Shows count of archived tasks
- **Icon:** Archive icon from Lucide

### Archive Dialog
- **Responsive:** Adapts to screen size
- **Scrollable:** Handles many archived tasks
- **Task Cards:** Show title, description, category, archive date
- **Actions:** Restore and Delete buttons per task

### Edit Dialog - Archive Button
- **Location:** Bottom left of dialog
- **Confirmation:** Prompts user before archiving
- **Icon:** Archive icon

---

## 📊 What Gets Archived

When you archive a task:
- ✅ Task removed from board view
- ✅ `archived` field set to `true`
- ✅ `archived_at` timestamp recorded
- ✅ Task remains in database
- ✅ Task retains all data (title, description, category, etc.)
- ✅ Can be restored at any time

---

## 🔒 Security & Performance

### Database Level:
- RLS policies enforce user access control
- Indexes optimize archive queries
- Timestamps track archive history

### Application Level:
- Rate limiting prevents abuse
- Input validation on all operations
- Optimistic updates for better UX
- Error recovery mechanisms

### API Functions:
- `archiveTask()` - Archive with rate limiting
- `unarchiveTask()` - Restore with rate limiting
- `getArchivedTasks()` - Fetch with sorting
- `getBoardWithData()` - Auto-filters archived tasks

---

## 🧪 Testing Scenarios

### Basic Flow:
1. ✅ Create a new task
2. ✅ Archive the task
3. ✅ Verify it's in archived view
4. ✅ Restore the task
5. ✅ Verify it's back on board

### Edge Cases:
- Archive task from different columns
- Archive multiple tasks
- Test rate limiting (try 15 archives quickly)
- Archive tasks with/without categories
- Archive tasks with long descriptions
- Switch boards (archives should be board-specific)

### Error Handling:
- Disconnect network during archive
- Try to archive non-existent task
- Exceed rate limit
- Invalid board ID

---

## 📝 Notes

- Archived tasks are **board-specific**
- Archived tasks **do not count** toward board display
- Archived tasks **retain their position** data (for potential future use)
- Deleting a board **cascades to archived tasks** (they get deleted too)
- Archived tasks can be **permanently deleted** from archive view

---

## ✅ Checklist

- [ ] Database migration completed
- [ ] Can archive tasks from edit dialog
- [ ] Can view archived tasks
- [ ] Can restore archived tasks
- [ ] Can delete archived tasks permanently
- [ ] Badge shows correct count
- [ ] Rate limiting works
- [ ] Error messages are clear
- [ ] Works across different boards

---

## 🎉 You're Done!

The archive feature is now fully functional. Users can:
- Keep their boards clean by archiving old tasks
- Review archived tasks anytime
- Restore tasks if needed
- Permanently delete when ready

**Documentation:** See `docs/ARCHIVE_FEATURE.md` for detailed technical docs.
