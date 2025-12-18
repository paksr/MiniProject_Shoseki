-- Run this entire script in your Supabase SQL Editor (https://supabase.com/dashboard/project/_/sql)

-- ==========================================
-- 1. USERS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS public.users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT, 
  avatar_url TEXT,
  role TEXT DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable insert for everyone" ON public.users;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.users;
DROP POLICY IF EXISTS "Enable update for all users" ON public.users;
CREATE POLICY "Enable insert for everyone" ON public.users FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable read access for all users" ON public.users FOR SELECT USING (true);
CREATE POLICY "Enable update for all users" ON public.users FOR UPDATE USING (true);

-- ==========================================
-- 2. BOOKS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS public.books (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  author TEXT NOT NULL,
  isbn TEXT,
  genre TEXT,
  pages INTEGER,
  location TEXT, 
  cover_url TEXT,
  description TEXT,
  status TEXT DEFAULT 'Available',
  rating INTEGER DEFAULT 4,
  added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.books ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable read access for all books" ON public.books;
DROP POLICY IF EXISTS "Enable write access for all users" ON public.books;
DROP POLICY IF EXISTS "Enable update access for all users" ON public.books;
DROP POLICY IF EXISTS "Enable delete access for all users" ON public.books;
CREATE POLICY "Enable read access for all books" ON public.books FOR SELECT USING (true);
CREATE POLICY "Enable write access for all users" ON public.books FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON public.books FOR UPDATE USING (true);
CREATE POLICY "Enable delete access for all users" ON public.books FOR DELETE USING (true);

-- ==========================================
-- 3. LOANS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS public.loans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id),
  book_id UUID REFERENCES public.books(id),
  book_title TEXT,
  cover_url TEXT,
  borrowed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  due_date TIMESTAMP WITH TIME ZONE,
  returned_at TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'active'
);

ALTER TABLE public.loans ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all access for loans" ON public.loans;
CREATE POLICY "Enable all access for loans" ON public.loans FOR ALL USING (true);

-- ==========================================
-- 4. RESERVATIONS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS public.reservations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id),
  book_id UUID REFERENCES public.books(id),
  book_title TEXT,
  book_author TEXT,
  cover_url TEXT,
  reserved_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT DEFAULT 'active'
);

ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all access for reservations" ON public.reservations;
CREATE POLICY "Enable all access for reservations" ON public.reservations FOR ALL USING (true);

-- ==========================================
-- 5. BOOKINGS TABLE (NEW)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.bookings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id),
  facility_id TEXT NOT NULL,
  facility_name TEXT NOT NULL,
  date TEXT NOT NULL,
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  pax INTEGER NOT NULL,
  status TEXT DEFAULT 'pending', -- pending, approved, rejected
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all access for bookings" ON public.bookings;
CREATE POLICY "Enable all access for bookings" ON public.bookings FOR ALL USING (true);
