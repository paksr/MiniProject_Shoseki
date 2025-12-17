import AsyncStorage from '@react-native-async-storage/async-storage';
import { Book, User, BookStatus, Booking, BookingStatus, Penalty, Reservation, LoanRecord } from '../types';

const USERS_KEY = 'shoseki_users';
const BOOKS_KEY = 'shoseki_books';
const ACTIVE_USER_KEY = 'shoseki_active_user';
const BOOKINGS_KEY = 'shoseki_bookings';
const PENALTIES_KEY = 'shoseki_penalties';
const RESERVATIONS_KEY = 'shoseki_reservations';
const LOANS_KEY = 'shoseki_loans';

// --- Seed Data ---
const seedBooks = (): Book[] => {
    const books: Book[] = [];
    const statuses = [BookStatus.Available, BookStatus.OnLoan, BookStatus.OutOfStock];
    const genres = ['Fiction', 'Mystery', 'Sci-Fi', 'Romance', 'History', 'Non-Fiction', 'Horror'];

    for (let i = 1; i <= 25; i++) {
        books.push({
            id: i.toString(),
            title: `Book ${i}`,
            author: `Author ${i}`,
            coverUrl: `https://picsum.photos/seed/${i + 50}/200/300`,
            description: `This is a generated description for Book ${i}. It creates a cozy atmosphere for reading.`,
            genre: genres[Math.floor(Math.random() * genres.length)],
            pages: Math.floor(Math.random() * 300) + 100,
            status: statuses[i % 3],
            addedAt: new Date(Date.now() - Math.floor(Math.random() * 10000000000)).toISOString(),
            rating: Math.floor(Math.random() * 5) + 1,
            location: `Shelf ${String.fromCharCode(65 + Math.floor(Math.random() * 6))}-${Math.floor(Math.random() * 12) + 1}`
        });
    }
    return books;
};

// --- User Services ---

export const getActiveUser = async (): Promise<User | null> => {
    try {
        const stored = await AsyncStorage.getItem(ACTIVE_USER_KEY);
        return stored ? JSON.parse(stored) : null;
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
        const stored = await AsyncStorage.getItem(USERS_KEY);
        let users: User[] = stored ? JSON.parse(stored) : [];

        if (users.length === 0) {
            const jayden: User = {
                id: 'seed-jayden',
                name: 'Jayden',
                email: 'p@gmail.com',
                password: 'password',
                avatarUrl: `https://ui-avatars.com/api/?name=Jayden&background=5D4037&color=fff`,
                role: 'user'
            };
            users = [jayden];
            await AsyncStorage.setItem(USERS_KEY, JSON.stringify(users));
        }

        return users;
    } catch {
        return [];
    }
};

export const createUser = async (name: string, email: string, password?: string): Promise<User> => {
    const users = await getUsers();
    const existing = users.find(u => u.email === email);
    if (existing) throw new Error("User already exists");

    const newUser: User = {
        id: Date.now().toString(),
        name,
        email,
        password,
        avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=5D4037&color=fff`,
        role: 'user'
    };

    users.push(newUser);
    await AsyncStorage.setItem(USERS_KEY, JSON.stringify(users));
    return newUser;
};

export const updateUserDetails = async (userId: string, updates: Partial<User>): Promise<User> => {
    const users = await getUsers();
    const index = users.findIndex(u => u.id === userId);

    if (index !== -1) {
        const updatedUser = { ...users[index], ...updates };

        if (updates.name && updatedUser.avatarUrl?.includes('ui-avatars.com')) {
            updatedUser.avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(updatedUser.name)}&background=5D4037&color=fff`;
        }
        if (updates.avatarUrl) {
            updatedUser.avatarUrl = updates.avatarUrl;
        }

        users[index] = updatedUser;
        await AsyncStorage.setItem(USERS_KEY, JSON.stringify(users));

        const active = await getActiveUser();
        if (active && active.id === userId) {
            await AsyncStorage.setItem(ACTIVE_USER_KEY, JSON.stringify(updatedUser));
        }

        return updatedUser;
    }
    throw new Error("User not found");
};

export const loginUser = async (email: string, password?: string): Promise<User> => {
    const users = await getUsers();
    const user = users.find(u => u.email === email);
    if (!user) throw new Error("User not found");

    if (password && user.password && user.password !== password) {
        throw new Error("Invalid password");
    }

    await setActiveUser(user);
    return user;
};

export const loginAdmin = async (adminId: string, password: string): Promise<User> => {
    if (adminId === '2404810' && password === 'password1234') {
        const adminUser: User = {
            id: 'admin-master',
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

// --- Book Services ---

export const getBooks = async (): Promise<Book[]> => {
    try {
        const stored = await AsyncStorage.getItem(BOOKS_KEY);
        let books: Book[] = stored ? JSON.parse(stored) : [];

        if (books.length === 0) {
            books = seedBooks();
            await AsyncStorage.setItem(BOOKS_KEY, JSON.stringify(books));
        }

        return books.sort((a, b) => new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime());
    } catch (e) {
        console.error("Storage Error", e);
        return [];
    }
};

export const addBook = async (book: Omit<Book, 'id' | 'addedAt'>): Promise<Book> => {
    const books = await getBooks();
    const newBook: Book = {
        ...book,
        id: Date.now().toString(),
        addedAt: new Date().toISOString(),
    };
    books.push(newBook);
    await AsyncStorage.setItem(BOOKS_KEY, JSON.stringify(books));
    return newBook;
};

export const updateBookStatus = async (id: string, status: BookStatus): Promise<void> => {
    const books = await getBooks();
    const index = books.findIndex(b => b.id === id);
    if (index !== -1) {
        books[index].status = status;
        await AsyncStorage.setItem(BOOKS_KEY, JSON.stringify(books));
    }
};

export const updateBookDetails = async (book: Book): Promise<void> => {
    const books = await getBooks();
    const index = books.findIndex(b => b.id === book.id);
    if (index !== -1) {
        books[index] = book;
        await AsyncStorage.setItem(BOOKS_KEY, JSON.stringify(books));
    }
};

export const deleteBook = async (id: string): Promise<void> => {
    const books = await getBooks();
    const filtered = books.filter(b => b.id !== id);
    await AsyncStorage.setItem(BOOKS_KEY, JSON.stringify(filtered));
};

// --- Loans & Borrowing ---

export const getLoans = async (userId?: string): Promise<LoanRecord[]> => {
    try {
        const stored = await AsyncStorage.getItem(LOANS_KEY);
        const loans: LoanRecord[] = stored ? JSON.parse(stored) : [];
        if (userId) {
            return loans.filter(l => l.userId === userId).sort((a, b) =>
                new Date(b.borrowedAt).getTime() - new Date(a.borrowedAt).getTime()
            );
        }
        return loans;
    } catch {
        return [];
    }
};

export const borrowBooks = async (userId: string, bookIds: string[]): Promise<void> => {
    const allBooks = await getBooks();
    const loans = await getLoans();

    for (const book of allBooks) {
        if (bookIds.includes(book.id) && book.status === BookStatus.Available) {
            book.status = BookStatus.OnLoan;

            const dueDate = new Date();
            dueDate.setDate(dueDate.getDate() + 14);

            const newLoan: LoanRecord = {
                id: `loan-${Date.now()}-${book.id}`,
                userId,
                bookId: book.id,
                bookTitle: book.title,
                coverUrl: book.coverUrl,
                borrowedAt: new Date().toISOString(),
                dueDate: dueDate.toISOString(),
                status: 'active'
            };
            loans.push(newLoan);
        }
    }

    await AsyncStorage.setItem(BOOKS_KEY, JSON.stringify(allBooks));
    await AsyncStorage.setItem(LOANS_KEY, JSON.stringify(loans));
};

export const returnBook = async (bookId: string): Promise<void> => {
    const loans = await getLoans();
    const loanIndex = loans.findIndex(l => l.bookId === bookId && l.status === 'active');
    if (loanIndex !== -1) {
        loans[loanIndex].status = 'returned';
        loans[loanIndex].returnedAt = new Date().toISOString();
        await AsyncStorage.setItem(LOANS_KEY, JSON.stringify(loans));
    }

    await updateBookStatus(bookId, BookStatus.Available);
};

export const reserveBook = async (userId: string, bookId: string, bookTitle: string): Promise<Reservation> => {
    const reservations = await getReservations();
    const newReservation: Reservation = {
        id: Date.now().toString(),
        userId,
        bookId,
        bookTitle,
        reservedAt: new Date().toISOString(),
        status: 'active'
    };
    reservations.push(newReservation);
    await AsyncStorage.setItem(RESERVATIONS_KEY, JSON.stringify(reservations));
    return newReservation;
};

export const getReservations = async (): Promise<Reservation[]> => {
    try {
        const stored = await AsyncStorage.getItem(RESERVATIONS_KEY);
        return stored ? JSON.parse(stored) : [];
    } catch {
        return [];
    }
};

// --- Bookings ---

export const getBookings = async (): Promise<Booking[]> => {
    try {
        const stored = await AsyncStorage.getItem(BOOKINGS_KEY);
        return stored ? JSON.parse(stored) : [];
    } catch {
        return [];
    }
};

export const addBooking = async (booking: Omit<Booking, 'id' | 'createdAt' | 'status'>): Promise<Booking> => {
    const bookings = await getBookings();
    const newBooking: Booking = {
        ...booking,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
        status: 'pending'
    };
    bookings.push(newBooking);
    await AsyncStorage.setItem(BOOKINGS_KEY, JSON.stringify(bookings));
    return newBooking;
};

export const cancelBooking = async (id: string): Promise<void> => {
    const bookings = await getBookings();
    const filtered = bookings.filter(b => b.id !== id);
    await AsyncStorage.setItem(BOOKINGS_KEY, JSON.stringify(filtered));
};

export const updateBookingStatus = async (id: string, status: BookingStatus): Promise<void> => {
    const bookings = await getBookings();
    const index = bookings.findIndex(b => b.id === id);
    if (index !== -1) {
        bookings[index].status = status;
        await AsyncStorage.setItem(BOOKINGS_KEY, JSON.stringify(bookings));
    }
};

// --- Penalties ---

export const getPenalties = async (userId: string): Promise<Penalty[]> => {
    try {
        const stored = await AsyncStorage.getItem(PENALTIES_KEY);
        let penalties: Penalty[] = stored ? JSON.parse(stored) : [];

        const userPenalties = penalties.filter(p => p.userId === userId);
        if (userPenalties.length === 0) {
            const mockPenalty: Penalty = {
                id: `pen-${Date.now()}`,
                userId: userId,
                amount: 5.50,
                reason: 'Late Return: "The Great Gatsby" (3 days overdue)',
                date: new Date(Date.now() - 86400000 * 2).toISOString(),
                status: 'unpaid'
            };
            penalties.push(mockPenalty);
            await AsyncStorage.setItem(PENALTIES_KEY, JSON.stringify(penalties));
            return [mockPenalty];
        }

        return userPenalties;
    } catch {
        return [];
    }
};

export const payPenalty = async (id: string): Promise<void> => {
    try {
        const stored = await AsyncStorage.getItem(PENALTIES_KEY);
        if (!stored) return;
        const penalties: Penalty[] = JSON.parse(stored);

        const index = penalties.findIndex(p => p.id === id);
        if (index !== -1) {
            penalties[index].status = 'paid';
            await AsyncStorage.setItem(PENALTIES_KEY, JSON.stringify(penalties));
        }
    } catch (e) {
        console.error('Error paying penalty:', e);
    }
};
