-- Create categories table to persist category colors across browsers
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  color TEXT NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, name) -- Each user can have a category name only once
);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_categories_user_id ON public.categories(user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_categories_updated_at 
  BEFORE UPDATE ON public.categories 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) policies
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- Users can view their own categories
CREATE POLICY "Users can view their own categories" 
  ON public.categories FOR SELECT 
  USING (auth.uid() = user_id);

-- Users can insert their own categories
CREATE POLICY "Users can insert their own categories" 
  ON public.categories FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own categories
CREATE POLICY "Users can update their own categories" 
  ON public.categories FOR UPDATE 
  USING (auth.uid() = user_id);

-- Users can delete their own categories
CREATE POLICY "Users can delete their own categories" 
  ON public.categories FOR DELETE 
  USING (auth.uid() = user_id);

-- Comment on table
COMMENT ON TABLE public.categories IS 
  'Stores user-defined categories with colors for task organization';
