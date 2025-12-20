-- 1. Reset: Drop the table if it exists to ensure a clean slate with correct columns
DROP TABLE IF EXISTS public.ratings CASCADE;

-- 2. Create Ratings Table
CREATE TABLE public.ratings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id),
  book_id UUID REFERENCES public.books(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, book_id)
);

-- 3. Security Policies
ALTER TABLE public.ratings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all access for ratings" ON public.ratings;
CREATE POLICY "Enable all access for ratings" ON public.ratings FOR ALL USING (true);

-- 4. Reset all book ratings to 0 (Requested by user)
UPDATE public.books SET rating = 0;

-- 5. Set default for future books
ALTER TABLE public.books ALTER COLUMN rating SET DEFAULT 0;
