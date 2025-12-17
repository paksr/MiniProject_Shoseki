
import { Book, User, BookStatus, Booking, BookingStatus, Penalty, Reservation, LoanRecord } from '../types';

const USERS_KEY = 'shoseki_users';
const BOOKS_KEY_LEGACY = 'shoseki_books_v5'; // Kept for migration
const ACTIVE_USER_KEY = 'shoseki_active_user';
const BOOKINGS_KEY = 'shoseki_bookings_v3'; 
const PENALTIES_KEY = 'shoseki_penalties';
const RESERVATIONS_KEY = 'shoseki_reservations';
const LOANS_KEY = 'shoseki_loans';

// --- IndexedDB Configuration ---
const DB_NAME = 'ShosekiLibraryDB';
const DB_VERSION = 1;
const STORE_BOOKS = 'books';

const openDB = (): Promise<IDBDatabase> => {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = (event) => {
            const db = (event.target as IDBOpenDBRequest).result;
            if (!db.objectStoreNames.contains(STORE_BOOKS)) {
                db.createObjectStore(STORE_BOOKS, { keyPath: 'id' });
            }
        };

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
};

const dbOp = <T>(mode: IDBTransactionMode, callback: (store: IDBObjectStore) => IDBRequest<T> | void): Promise<T> => {
    return openDB().then(db => {
        return new Promise((resolve, reject) => {
            const tx = db.transaction(STORE_BOOKS, mode);
            const store = tx.objectStore(STORE_BOOKS);
            let req;
            try {
                req = callback(store);
            } catch (e) {
                reject(e);
                return;
            }
            tx.oncomplete = () => resolve(req ? req.result : undefined);
            tx.onerror = () => reject(tx.error);
        });
    });
};

// --- User Services (LocalStorage) ---

export const getActiveUser = (): User | null => {
  const stored = localStorage.getItem(ACTIVE_USER_KEY);
  return stored ? JSON.parse(stored) : null;
};

export const setActiveUser = (user: User | null) => {
  if (user) {
    localStorage.setItem(ACTIVE_USER_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(ACTIVE_USER_KEY);
  }
};

export const getUsers = (): User[] => {
  const stored = localStorage.getItem(USERS_KEY);
  let users: User[] = stored ? JSON.parse(stored) : [];

  // Seed default user 'Jayden' if no users exist
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
      localStorage.setItem(USERS_KEY, JSON.stringify(users));
  }
  
  return users;
};

export const createUser = (name: string, email: string, password?: string): User => {
  const users = getUsers();
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
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
  return newUser;
};

export const updateUserDetails = (userId: string, updates: Partial<User>): User => {
  const users = getUsers();
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
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
    
    const active = getActiveUser();
    if (active && active.id === userId) {
        localStorage.setItem(ACTIVE_USER_KEY, JSON.stringify(updatedUser));
    }
    
    return updatedUser;
  }
  throw new Error("User not found");
};

export const loginUser = (email: string, password?: string): User => {
  const users = getUsers();
  const user = users.find(u => u.email === email);
  if (!user) throw new Error("User not found");
  
  if (password && user.password && user.password !== password) {
      throw new Error("Invalid password");
  }

  setActiveUser(user);
  return user;
};

export const loginAdmin = (adminId: string, password: string): User => {
    if (adminId === '2404810' && password === 'password1234') {
        const adminUser: User = {
            id: 'admin-master',
            name: 'Administrator',
            email: 'admin@shoseki.com',
            role: 'admin',
            avatarUrl: 'https://ui-avatars.com/api/?name=Admin&background=3E2723&color=fff&font-size=0.5'
        };
        setActiveUser(adminUser);
        return adminUser;
    }
    throw new Error("Invalid Admin ID or Password");
};

// --- Book Services (IndexedDB) ---

const seedBooks = () => {
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

export const getBooks = async (): Promise<Book[]> => {
    try {
        let books = await dbOp<Book[]>('readonly', store => store.getAll());
        
        // Migration / Seeding Logic
        if (books.length === 0) {
            // Check legacy LocalStorage
            const legacy = localStorage.getItem(BOOKS_KEY_LEGACY);
            if (legacy) {
                books = JSON.parse(legacy);
            } else {
                books = seedBooks();
            }

            // Save to DB
            const db = await openDB();
            const tx = db.transaction(STORE_BOOKS, 'readwrite');
            const store = tx.objectStore(STORE_BOOKS);
            books.forEach(b => store.put(b));
            
            await new Promise<void>(resolve => { tx.oncomplete = () => resolve(); });
        }
        
        // Sort by addedAt desc
        return books.sort((a, b) => new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime());
    } catch (e) {
        console.error("DB Error", e);
        return [];
    }
};

export const addBook = async (book: Omit<Book, 'id' | 'addedAt'>): Promise<Book> => {
  const newBook: Book = {
    ...book,
    id: Date.now().toString(),
    addedAt: new Date().toISOString(),
  };
  await dbOp('readwrite', store => store.add(newBook));
  return newBook;
};

export const updateBookStatus = async (id: string, status: BookStatus) => {
    const db = await openDB();
    const tx = db.transaction(STORE_BOOKS, 'readwrite');
    const store = tx.objectStore(STORE_BOOKS);
    
    // Get, update, put
    const getReq = store.get(id);
    getReq.onsuccess = () => {
        const book = getReq.result as Book;
        if (book) {
            book.status = status;
            store.put(book);
        }
    };
    
    return new Promise<void>(resolve => { tx.oncomplete = () => resolve(); });
};

export const updateBookDetails = async (book: Book) => {
    await dbOp('readwrite', store => store.put(book));
};

export const deleteBook = async (id: string) => {
    await dbOp('readwrite', store => store.delete(id));
};

// --- Loans & Borrowing (Hybrid: Loans in LocalStorage, Books in IDB) ---

export const getLoans = (userId?: string): LoanRecord[] => {
    const stored = localStorage.getItem(LOANS_KEY);
    const loans: LoanRecord[] = stored ? JSON.parse(stored) : [];
    if (userId) {
        return loans.filter(l => l.userId === userId).sort((a,b) => new Date(b.borrowedAt).getTime() - new Date(a.borrowedAt).getTime());
    }
    return loans;
}

export const borrowBooks = async (userId: string, bookIds: string[]) => {
    // We need to fetch current books state first
    const allBooks = await getBooks();
    const loans = getLoans();
    
    // Process updates
    const db = await openDB();
    const tx = db.transaction(STORE_BOOKS, 'readwrite');
    const store = tx.objectStore(STORE_BOOKS);

    for (const book of allBooks) {
        if (bookIds.includes(book.id) && book.status === BookStatus.Available) {
            // Update Book in DB
            book.status = BookStatus.OnLoan;
            store.put(book);

            // Create Loan Record
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

    // Commit DB changes
    await new Promise<void>(resolve => { tx.oncomplete = () => resolve(); });

    // Save loans to LocalStorage
    localStorage.setItem(LOANS_KEY, JSON.stringify(loans));
};

export const returnBook = async (bookId: string) => {
    // 1. Update Loan in LocalStorage
    const loans = getLoans();
    const loanIndex = loans.findIndex(l => l.bookId === bookId && l.status === 'active');
    if (loanIndex !== -1) {
        loans[loanIndex].status = 'returned';
        loans[loanIndex].returnedAt = new Date().toISOString();
        localStorage.setItem(LOANS_KEY, JSON.stringify(loans));
    }

    // 2. Update Book in DB
    const db = await openDB();
    const tx = db.transaction(STORE_BOOKS, 'readwrite');
    const store = tx.objectStore(STORE_BOOKS);
    
    const getReq = store.get(bookId);
    getReq.onsuccess = () => {
        const book = getReq.result as Book;
        if (book) {
            book.status = BookStatus.Available;
            store.put(book);
        }
    };

    return new Promise<void>(resolve => { tx.oncomplete = () => resolve(); });
};

export const reserveBook = (userId: string, bookId: string, bookTitle: string) => {
    const reservations = getReservations();
    const newReservation: Reservation = {
        id: Date.now().toString(),
        userId,
        bookId,
        bookTitle,
        reservedAt: new Date().toISOString(),
        status: 'active'
    };
    reservations.push(newReservation);
    localStorage.setItem(RESERVATIONS_KEY, JSON.stringify(reservations));
    return newReservation;
};

export const getReservations = (): Reservation[] => {
    const stored = localStorage.getItem(RESERVATIONS_KEY);
    return stored ? JSON.parse(stored) : [];
}

// --- Bookings (LocalStorage) ---

export const getBookings = (): Booking[] => {
  const stored = localStorage.getItem(BOOKINGS_KEY);
  return stored ? JSON.parse(stored) : [];
};

export const addBooking = (booking: Omit<Booking, 'id' | 'createdAt' | 'status'>): Booking => {
  const bookings = getBookings();
  const newBooking: Booking = {
    ...booking,
    id: Date.now().toString(),
    createdAt: new Date().toISOString(),
    status: 'pending' // Default status
  };
  bookings.push(newBooking);
  localStorage.setItem(BOOKINGS_KEY, JSON.stringify(bookings));
  return newBooking;
};

export const cancelBooking = (id: string) => {
  const bookings = getBookings();
  const filtered = bookings.filter(b => b.id !== id);
  localStorage.setItem(BOOKINGS_KEY, JSON.stringify(filtered));
};

export const updateBookingStatus = (id: string, status: BookingStatus) => {
    const bookings = getBookings();
    const index = bookings.findIndex(b => b.id === id);
    if (index !== -1) {
        bookings[index].status = status;
        localStorage.setItem(BOOKINGS_KEY, JSON.stringify(bookings));
    }
}

// --- Penalties (LocalStorage) ---

export const getPenalties = (userId: string): Penalty[] => {
    const stored = localStorage.getItem(PENALTIES_KEY);
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
        localStorage.setItem(PENALTIES_KEY, JSON.stringify(penalties));
        return [mockPenalty];
    }

    return penalties.filter(p => p.userId === userId);
};

export const payPenalty = (id: string) => {
    const stored = localStorage.getItem(PENALTIES_KEY);
    if (!stored) return;
    const penalties: Penalty[] = JSON.parse(stored);
    
    const index = penalties.findIndex(p => p.id === id);
    if (index !== -1) {
        penalties[index].status = 'paid';
        localStorage.setItem(PENALTIES_KEY, JSON.stringify(penalties));
    }
};
