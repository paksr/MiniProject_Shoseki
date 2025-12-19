import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';
import { User, Book, BookStatus, LoanRecord, Reservation, Booking, BookingStatus } from '../types';
import * as FileSystem from 'expo-file-system';
import { decode } from 'base64-arraybuffer';

const ACTIVE_USER_KEY = 'shoseki_active_user';

// --- User Services with Supabase ---

export const getActiveUser = async (): Promise<User | null> => {
    try {
        const stored = await AsyncStorage.getItem(ACTIVE_USER_KEY);
        if (!stored) return null;

        const user = JSON.parse(stored);
        // Sanitize legacy invalid UUIDs
        if (user.id === 'admin-master') {
            user.id = '00000000-0000-0000-0000-000000000000';
            await AsyncStorage.setItem(ACTIVE_USER_KEY, JSON.stringify(user));
        }
        return user;
    } catch {
        return null;
    }
};

export const setActiveUser = async (user: User | null): Promise<void> => {
    try {
        if (user) {
            await AsyncStorage.setItem(ACTIVE_USER_KEY, JSON.stringify(user));
        } else {
            await AsyncStorage.removeItem(ACTIVE_USER_KEY);
        }
    } catch (e) {
        console.error('Error setting active user:', e);
    }
};

export const getUsers = async (): Promise<User[]> => {
    try {
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Supabase error:', error.message);
            return [];
        }

        // Map Supabase columns to your User type
        return (data || []).map(row => ({
            id: row.id,
            name: row.name,
            email: row.email,
            password: row.password,
            avatarUrl: row.avatar_url,
            role: row.role || 'user'
        }));
    } catch (e) {
        console.error('Error fetching users:', e);
        return [];
    }
};

export const createUser = async (name: string, email: string, password?: string): Promise<User> => {
    // Check if user already exists
    const { data: existing } = await supabase
        .from('users')
        .select('id')
        .eq('email', email)
        .single();

    if (existing) {
        throw new Error("User already exists");
    }

    const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=5D4037&color=fff`;

    const { data, error } = await supabase
        .from('users')
        .insert({
            name,
            email,
            password,
            avatar_url: avatarUrl,
            role: 'user'
        })
        .select()
        .single();

    if (error) {
        console.error('Supabase insert error:', error.message);
        throw new Error(error.message);
    }

    const newUser: User = {
        id: data.id,
        name: data.name,
        email: data.email,
        password: data.password,
        avatarUrl: data.avatar_url,
        role: data.role
    };

    // Auto-login after registration
    await setActiveUser(newUser);
    return newUser;
};

export const loginUser = async (email: string, password?: string): Promise<User> => {
    const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single();

    if (error || !data) {
        throw new Error("User not found");
    }

    if (password && data.password && data.password !== password) {
        throw new Error("Invalid password");
    }

    const user: User = {
        id: data.id,
        name: data.name,
        email: data.email,
        password: data.password,
        avatarUrl: data.avatar_url,
        role: data.role
    };

    await setActiveUser(user);
    return user;
};

export const loginAdmin = async (adminId: string, password: string): Promise<User> => {
    if (adminId === '2404810' && password === 'password1234') {
        const adminUser: User = {
            id: '00000000-0000-0000-0000-000000000000', // Valid UUID for Admin
            name: 'Administrator',
            email: 'admin@shoseki.com',
            role: 'admin',
            avatarUrl: 'https://ui-avatars.com/api/?name=Admin&background=3E2723&color=fff&font-size=0.5'
        };
        await setActiveUser(adminUser);
        return adminUser;
    }
    throw new Error("Invalid Admin ID or Password");
};

export const updateUserDetails = async (userId: string, updates: Partial<User>): Promise<User> => {
    // Prepare Supabase-compatible update object
    const supabaseUpdates: Record<string, any> = {};

    if (updates.name) supabaseUpdates.name = updates.name;
    if (updates.email) supabaseUpdates.email = updates.email;
    if (updates.password) supabaseUpdates.password = updates.password;
    if (updates.role) supabaseUpdates.role = updates.role;

    if (updates.avatarUrl) {
        supabaseUpdates.avatar_url = updates.avatarUrl;
    } else if (updates.name) {
        // Update avatar URL if name changed
        supabaseUpdates.avatar_url = `https://ui-avatars.com/api/?name=${encodeURIComponent(updates.name)}&background=5D4037&color=fff`;
    }

    const { data, error } = await supabase
        .from('users')
        .update(supabaseUpdates)
        .eq('id', userId)
        .select()
        .single();

    if (error || !data) {
        throw new Error(error?.message || "User not found");
    }

    const updatedUser: User = {
        id: data.id,
        name: data.name,
        email: data.email,
        password: data.password,
        avatarUrl: data.avatar_url,
        role: data.role
    };

    // Update local cache if this is the active user
    const active = await getActiveUser();
    if (active && active.id === userId) {
        await setActiveUser(updatedUser);
    }

    return updatedUser;
};

// --- Book Services with Supabase ---

// Helper to seed books if empty
const seedBooksToSupabase = async () => {
    // Removed BookStatus.OutOfStock from generation
    const statuses = [BookStatus.Available, BookStatus.OnLoan];
    const genres = ['Fiction', 'Mystery', 'Sci-Fi', 'Romance', 'History', 'Non-Fiction', 'Horror'];
    const books = [];

    for (let i = 1; i <= 25; i++) {
        books.push({
            title: `Book ${i}`,
            author: `Author ${i}`,
            cover_url: `https://picsum.photos/seed/${i + 50}/200/300`,
            description: `This is a generated description for Book ${i}. It creates a cozy atmosphere for reading.`,
            genre: genres[Math.floor(Math.random() * genres.length)],
            pages: Math.floor(Math.random() * 300) + 100,
            status: statuses[i % 2], // Only 2 statuses now
            rating: Math.floor(Math.random() * 5) + 1,
            location: `Shelf ${String.fromCharCode(65 + Math.floor(Math.random() * 6))}-${Math.floor(Math.random() * 12) + 1}`
        });
    }

    const { error } = await supabase.from('books').insert(books);
    if (error) console.error("Error seeding books:", error);
};

export const getBooks = async (): Promise<Book[]> => {
    try {
        let { data, error } = await supabase
            .from('books')
            .select('*')
            .order('added_at', { ascending: false });

        if (error) {
            console.error('Supabase error fetching books:', error.message);
            return [];
        }

        // If no books, seed them and fetch again
        if (!data || data.length === 0) {
            await seedBooksToSupabase();
            const result = await supabase
                .from('books')
                .select('*')
                .order('added_at', { ascending: false });
            data = result.data;
        }

        return (data || []).map(row => ({
            id: row.id,
            title: row.title,
            author: row.author,
            coverUrl: row.cover_url,
            description: row.description,
            genre: row.genre,
            pages: row.pages,
            // Override OutOfStock to Available
            status: (row.status === BookStatus.OutOfStock ? BookStatus.Available : row.status) as BookStatus,
            addedAt: row.added_at,
            rating: row.rating,
            location: row.location,
            isbn: row.isbn
        }));
    } catch (e) {
        console.error("Error fetching books:", e);
        return [];
    }
};

// Helper to upload image to Supabase Storage
const uploadImage = async (uri: string): Promise<string> => {
    try {
        if (!uri.startsWith('file://')) {
            return uri; // Already a remote URL
        }

        const base64 = await FileSystem.readAsStringAsync(uri, {
            encoding: FileSystem.EncodingType.Base64,
        });

        const fileExt = uri.split('.').pop() || 'jpg';
        const fileName = `${Date.now()}.${fileExt}`;
        const filePath = `${fileName}`;
        const contentType = `image/${fileExt}`;

        const { error } = await supabase.storage
            .from('book-covers')
            .upload(filePath, decode(base64), {
                contentType,
            });

        if (error) {
            // If bucket not found, try to create it (best effort for dev environments)
            if (error.message.includes('Bucket not found') || (error as any).error === 'Bucket not found') {
                console.log("Bucket not found, attempting to create 'book-covers'...");
                const { data: bucketData, error: createError } = await supabase.storage.createBucket('book-covers', {
                    public: true
                });

                if (createError) {
                    console.error("Failed to create bucket:", createError);
                    // Fall through to throw original error or custom one
                    throw new Error("Supabase Storage bucket 'book-covers' does not exist. Please create it in your Supabase Dashboard as a PUBLIC bucket.");
                }

                // Retry upload
                const { error: retryError } = await supabase.storage
                    .from('book-covers')
                    .upload(filePath, decode(base64), {
                        contentType,
                    });

                if (retryError) {
                    console.error("Retry upload failed:", retryError);
                    throw retryError;
                }
            } else {
                console.error('Error uploading image:', error);
                throw error;
            }
        }

        const { data } = supabase.storage.from('book-covers').getPublicUrl(filePath);
        return data.publicUrl;
    } catch (error) {
        console.error("Upload failed:", error);
        return uri; // Fallback to local URI if upload fails
    }
};

export const addBook = async (book: Omit<Book, 'id' | 'addedAt'>): Promise<Book> => {
    const publicCoverUrl = await uploadImage(book.coverUrl);

    const { data, error } = await supabase
        .from('books')
        .insert({
            title: book.title,
            author: book.author,
            isbn: book.isbn,
            genre: book.genre,
            pages: book.pages,
            location: book.location,
            cover_url: publicCoverUrl,
            description: book.description,
            status: book.status || 'Available',
            rating: book.rating || 4,
            // added_at is handled by default gen_random_uuid
        })
        .select()
        .single();

    if (error) {
        console.error('Supabase error adding book:', error.message);
        throw new Error(error.message);
    }

    return {
        id: data.id,
        title: data.title,
        author: data.author,
        coverUrl: data.cover_url,
        description: data.description,
        genre: data.genre,
        pages: data.pages,
        status: data.status,
        addedAt: data.added_at,
        rating: data.rating,
        location: data.location,
        isbn: data.isbn
    };
};

export const updateBookDetails = async (book: Book): Promise<void> => {
    const publicCoverUrl = await uploadImage(book.coverUrl);

    const { error } = await supabase
        .from('books')
        .update({
            title: book.title,
            author: book.author,
            isbn: book.isbn,
            genre: book.genre,
            pages: book.pages,
            location: book.location,
            cover_url: publicCoverUrl,
            description: book.description,
            status: book.status,
            rating: book.rating
        })
        .eq('id', book.id);

    if (error) {
        console.error('Supabase error updating book:', error.message);
        throw new Error(error.message);
    }
};

export const deleteBook = async (id: string): Promise<void> => {
    // 1. Delete associated loans
    const { error: loanError } = await supabase
        .from('loans')
        .delete()
        .eq('book_id', id);

    if (loanError) {
        console.error('Error deleting associated loans:', loanError.message);
        throw new Error("Failed to clean up book loans");
    }

    // 2. Delete associated reservations
    const { error: resError } = await supabase
        .from('reservations')
        .delete()
        .eq('book_id', id);

    if (resError) {
        console.error('Error deleting associated reservations:', resError.message);
        throw new Error("Failed to clean up book reservations");
    }

    // 3. Delete the book
    const { error } = await supabase
        .from('books')
        .delete()
        .eq('id', id);

    if (error) {
        console.error('Supabase error deleting book:', error.message);
        throw new Error(error.message);
    }
};

// --- Loans & Borrowing with Supabase ---

export const getLoans = async (userId?: string): Promise<LoanRecord[]> => {
    let query = supabase.from('loans').select('*');
    if (userId) {
        query = query.eq('user_id', userId);
    }

    const { data, error } = await query.order('borrowed_at', { ascending: false });

    if (error) {
        console.error('Supabase error fetching loans:', error.message);
        return [];
    }

    return (data || []).map(row => ({
        id: row.id,
        userId: row.user_id,
        bookId: row.book_id,
        bookTitle: row.book_title,
        coverUrl: row.cover_url,
        borrowedAt: row.borrowed_at,
        dueDate: row.due_date,
        returnedAt: row.returned_at,
        status: row.status
    }));
};

export const borrowBooks = async (userId: string, bookIds: string[]): Promise<void> => {
    // 1. Fetch books to get details
    const { data: books } = await supabase.from('books').select('*').in('id', bookIds);
    if (!books) return;

    for (const book of books) {
        // Double check status - allow both Available and OutOfStock (which is treated as Available)
        if (book.status !== BookStatus.Available && book.status !== BookStatus.OutOfStock) continue;

        // 2. Create Loan Record
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 14);

        const { error: loanError } = await supabase.from('loans').insert({
            user_id: userId,
            book_id: book.id,
            book_title: book.title,
            cover_url: book.cover_url,
            due_date: dueDate.toISOString(),
            status: 'active'
        });

        if (loanError) {
            console.error('Error creating loan:', loanError);
            continue;
        }

        // 3. Update Book Status
        await supabase.from('books').update({ status: BookStatus.OnLoan }).eq('id', book.id);
    }
};

export const returnBook = async (bookId: string): Promise<void> => {
    // Find active loan
    const { data: loans } = await supabase
        .from('loans')
        .select('*')
        .eq('book_id', bookId)
        .eq('status', 'active')
        .limit(1);

    if (loans && loans.length > 0) {
        // Update loan status
        await supabase.from('loans').update({
            status: 'returned',
            returned_at: new Date().toISOString()
        }).eq('id', loans[0].id);
    }

    // Update book status
    await supabase.from('books').update({ status: BookStatus.Available }).eq('id', bookId);
};

export const getReservations = async (): Promise<Reservation[]> => {
    const { data, error } = await supabase.from('reservations').select('*');
    if (error) return [];

    return (data || []).map(row => ({
        id: row.id,
        userId: row.user_id,
        bookId: row.book_id,
        bookTitle: row.book_title,
        bookAuthor: row.book_author,
        coverUrl: row.cover_url,
        reservedAt: row.reserved_at,
        status: row.status
    }));
};

export const reserveBook = async (userId: string, bookId: string, bookTitle: string, bookAuthor: string, coverUrl: string): Promise<Reservation> => {
    const { data, error } = await supabase.from('reservations').insert({
        user_id: userId,
        book_id: bookId,
        book_title: bookTitle,
        book_author: bookAuthor,
        cover_url: coverUrl,
        status: 'active'
    }).select().single();

    if (error) throw new Error(error.message);

    return {
        id: data.id,
        userId: data.user_id,
        bookId: data.book_id,
        bookTitle: data.book_title,
        bookAuthor: data.book_author,
        coverUrl: data.cover_url,
        reservedAt: data.reserved_at,
        status: data.status
    };
};

export const cancelReservation = async (reservationId: string): Promise<void> => {
    await supabase.from('reservations').update({ status: 'cancelled' }).eq('id', reservationId);
};

// --- Facilities Bookings with Supabase ---

export const getBookings = async (): Promise<Booking[]> => {
    const { data, error } = await supabase
        .from('bookings')
        .select('*, users (email)'); // Join with users table

    if (error) {
        console.error('Error fetching bookings:', error);
        return [];
    }
    return (data || []).map(row => ({
        id: row.id,
        userId: row.user_id,
        facilityId: row.facility_id,
        facilityName: row.facility_name,
        date: row.date,
        startTime: row.start_time,
        endTime: row.end_time,
        pax: row.pax,
        status: row.status,
        createdAt: row.created_at,
        userEmail: row.users?.email // Extract email from joined data
    }));
};

export const addBooking = async (booking: Omit<Booking, 'id' | 'createdAt' | 'status'>): Promise<Booking> => {
    const { data, error } = await supabase.from('bookings').insert({
        user_id: booking.userId,
        facility_id: booking.facilityId,
        facility_name: booking.facilityName,
        date: booking.date,
        start_time: booking.startTime,
        end_time: booking.endTime,
        pax: booking.pax,
        status: 'pending'
    }).select().single();

    if (error) throw new Error(error.message);

    return {
        id: data.id,
        userId: data.user_id,
        facilityId: data.facility_id,
        facilityName: data.facility_name,
        date: data.date,
        startTime: data.start_time,
        endTime: data.end_time,
        pax: data.pax,
        status: data.status,
        createdAt: data.created_at
    };
};

export const cancelBooking = async (id: string): Promise<void> => {
    await supabase.from('bookings').delete().eq('id', id);
};

export const updateBookingStatus = async (id: string, status: BookingStatus): Promise<void> => {
    await supabase.from('bookings').update({ status: status }).eq('id', id);
};
