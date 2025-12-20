-- Run this in Supabase SQL Editor

-- ==========================================
-- 7. PENALTIES TABLE (NEW)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.penalties (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id),
  amount DECIMAL(10, 2) NOT NULL,
  reason TEXT,
  status TEXT DEFAULT 'unpaid', -- 'paid' or 'unpaid'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.penalties ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all access for penalties" ON public.penalties;
CREATE POLICY "Enable all access for penalties" ON public.penalties FOR ALL USING (true);
