

export interface User {
  id: string;
  name: string;
  email: string;
  password?: string;
  avatarUrl?: string;
  role?: 'user' | 'admin';
}

export enum BookStatus {
  Available = 'Available',
  OutOfStock = 'Out of Stock',
  OnLoan = 'On Loan',
  Missing = 'Missing',
  UnderRepair = 'Under Repair',
  LibraryUseOnly = 'Library Use Only',
}

export interface Book {
  id: string;
  title: string;
  author: string;
  coverUrl: string;
  description: string;
  genre: string;
  pages: number;
  status: BookStatus;
  addedAt: string;
  rating?: number;
  location?: string; // Shelf Location
  isbn?: string; // Added ISBN
}

export interface ReadingStat {
  month: string;
  booksRead: number;
  pagesRead: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
}

export type BookingStatus = 'pending' | 'approved' | 'rejected';

export interface Booking {
  id: string;
  facilityId: string;
  facilityName: string;
  date: string;
  startTime: string; // Changed from timeSlot
  endTime: string;   // Added
  pax: number;       // Added
  userId: string;
  createdAt: string;
  status: BookingStatus;
  capacity?: number;
}

export interface Penalty {
  id: string;
  userId: string;
  amount: number;
  reason: string; // e.g., "Late Return: Book Title"
  date: string;
  status: 'paid' | 'unpaid';
}

export interface Reservation {
  id: string;
  userId: string;
  bookId: string;
  bookTitle: string;
  reservedAt: string;
  status: 'active' | 'fulfilled' | 'cancelled';
}

export interface LoanRecord {
  id: string;
  userId: string;
  bookId: string;
  bookTitle: string;
  coverUrl: string;
  borrowedAt: string;
  dueDate: string;
  returnedAt?: string;
  status: 'active' | 'returned' | 'overdue';
}