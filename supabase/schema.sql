-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create boards table
CREATE TABLE IF NOT EXISTS public.boards (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create columns table
CREATE TABLE IF NOT EXISTS public.columns (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  board_id UUID REFERENCES public.boards(id) ON DELETE CASCADE NOT NULL,
  position INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create tasks table
CREATE TABLE IF NOT EXISTS public.tasks (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  column_id UUID REFERENCES public.columns(id) ON DELETE CASCADE NOT NULL,
  board_id UUID REFERENCES public.boards(id) ON DELETE CASCADE NOT NULL,
  position INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_boards_user_id ON public.boards(user_id);
CREATE INDEX IF NOT EXISTS idx_columns_board_id ON public.columns(board_id);
CREATE INDEX IF NOT EXISTS idx_tasks_column_id ON public.tasks(column_id);
CREATE INDEX IF NOT EXISTS idx_tasks_board_id ON public.tasks(board_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_boards_updated_at BEFORE UPDATE ON public.boards FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_columns_updated_at BEFORE UPDATE ON public.columns FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON public.tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) policies
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.boards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.columns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Boards policies
CREATE POLICY "Users can view their own boards" ON public.boards FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own boards" ON public.boards FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own boards" ON public.boards FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own boards" ON public.boards FOR DELETE USING (auth.uid() = user_id);

-- Columns policies
CREATE POLICY "Users can view columns of their boards" ON public.columns FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.boards 
    WHERE boards.id = columns.board_id AND boards.user_id = auth.uid()
  )
);
CREATE POLICY "Users can insert columns to their boards" ON public.columns FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.boards 
    WHERE boards.id = columns.board_id AND boards.user_id = auth.uid()
  )
);
CREATE POLICY "Users can update columns of their boards" ON public.columns FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.boards 
    WHERE boards.id = columns.board_id AND boards.user_id = auth.uid()
  )
);
CREATE POLICY "Users can delete columns of their boards" ON public.columns FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM public.boards 
    WHERE boards.id = columns.board_id AND boards.user_id = auth.uid()
  )
);

-- Tasks policies
CREATE POLICY "Users can view tasks of their boards" ON public.tasks FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.boards 
    WHERE boards.id = tasks.board_id AND boards.user_id = auth.uid()
  )
);
CREATE POLICY "Users can insert tasks to their boards" ON public.tasks FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.boards 
    WHERE boards.id = tasks.board_id AND boards.user_id = auth.uid()
  )
);
CREATE POLICY "Users can update tasks of their boards" ON public.tasks FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.boards 
    WHERE boards.id = tasks.board_id AND boards.user_id = auth.uid()
  )
);
CREATE POLICY "Users can delete tasks of their boards" ON public.tasks FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM public.boards 
    WHERE boards.id = tasks.board_id AND boards.user_id = auth.uid()
  )
);

-- Function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user registration
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
