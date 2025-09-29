# Kanban Board Setup Instructions

## Prerequisites
- Node.js 18+ installed
- A Supabase account and project

## 1. Install Dependencies

```bash
# Install pnpm globally if not already installed
npm install -g pnpm

# Install project dependencies
pnpm install
```

## 2. Set up Supabase Database

1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Run the SQL schema from `supabase/schema.sql`

This will create:
- `profiles` table (extends auth.users)
- `boards` table (user's kanban boards)
- `columns` table (board columns like "To Do", "Doing", "Done")
- `tasks` table (individual tasks within columns)
- Row Level Security (RLS) policies
- Triggers for automatic profile creation

## 3. Configure Authentication

1. In your Supabase project, go to Authentication > Settings
2. Enable email authentication
3. Configure your site URL (e.g., `http://localhost:3000` for development)

## 4. Environment Variables

Your `.env.local` file should contain:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 5. Run the Development Server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## Features

### Authentication
- Email/password sign up and sign in
- Automatic profile creation
- User session management
- Protected routes

### Board Management
- Create multiple boards per user
- Board selector with dropdown
- Board titles and descriptions

### Task Management
- Drag and drop tasks between columns
- Create, edit, and delete tasks
- Task categories and sorting
- Real-time position updates

### Data Persistence
- All data stored in Supabase PostgreSQL
- Row Level Security ensures users only see their own data
- Automatic timestamps and position management

## Database Schema

```sql
profiles (extends auth.users)
├── id (UUID, references auth.users)
├── email (TEXT)
├── full_name (TEXT)
└── avatar_url (TEXT)

boards
├── id (UUID, primary key)
├── title (TEXT)
├── description (TEXT)
├── user_id (UUID, references profiles)
└── timestamps

columns
├── id (UUID, primary key)
├── title (TEXT)
├── board_id (UUID, references boards)
├── position (INTEGER)
└── timestamps

tasks
├── id (UUID, primary key)
├── title (TEXT)
├── description (TEXT)
├── category (TEXT)
├── column_id (UUID, references columns)
├── board_id (UUID, references boards)
├── position (INTEGER)
└── timestamps
```

## Next Steps

1. Run the SQL schema in your Supabase project
2. Start the development server
3. Create an account and start organizing your tasks!

The application will automatically create default columns ("To Do", "Doing", "Done") for each new board.
