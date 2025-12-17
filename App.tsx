
import React, { useState, useEffect, useRef } from 'react';
import { HashRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Library, 
  LogOut, 
  Plus, 
  Search, 
  User as UserIcon, 
  Menu,
  Book as BookIcon,
  BookOpen,
  CalendarDays,
  Settings,
  Monitor,
  Users,
  Armchair,
  Trash2,
  Bell,
  Moon,
  ChevronRight,
  ChevronLeft,
  Home,
  ArrowUpDown,
  Ban,
  Shield,
  Database,
  CreditCard,
  ShoppingBag,
  CheckCircle,
  XCircle,
  Filter,
  History,
  Clock,
  AlertCircle,
  Map as MapIcon,
  Navigation,
  Mail,
  Eye,
  ArrowUp,
  Camera,
  Save,
  X,
  MessageSquare,
  Check
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

import { User, Book, BookStatus, Booking, Penalty, BookingStatus, LoanRecord } from './types';
import { 
    getActiveUser, setActiveUser, createUser, loginUser, loginAdmin, 
    getBooks, addBook, updateBookStatus, deleteBook, updateBookDetails,
    getBookings, addBooking, cancelBooking, updateBookingStatus,
    getUsers, 
    getPenalties, payPenalty, 
    borrowBooks, reserveBook, getLoans, returnBook,
    updateUserDetails
} from './services/storage';
import Button from './components/Button';
import BookCard from './components/BookCard';
import AddBookModal from './components/AddBookModal';
import BookDetailsModal from './components/BookDetailsModal';
import AILibrarian from './components/AILibrarian';

// --- Phone Frame Component ---
const PhoneFrame = ({ children, className = "" }: { children?: React.ReactNode, className?: string }) => {
  return (
    <div className="min-h-screen w-full bg-[#f2f1ea] dark:bg-[#111] flex items-center justify-center p-4 sm:p-8 overflow-hidden font-sans">
        {/* Bezel / Chassis */}
        <div className="relative w-[440px] h-[956px] bg-[#000] rounded-[64px] shadow-2xl ring-[6px] ring-[#d1d1d6] dark:ring-[#444] border-[8px] border-[#1a1a1a] flex flex-col overflow-hidden shrink-0 transition-all duration-300">
            {/* Dynamic Island */}
            <div className="absolute top-[18px] left-1/2 transform -translate-x-1/2 w-[126px] h-[36px] bg-black rounded-[20px] z-[60] pointer-events-none transition-all duration-300"></div>
            
            {/* Inner Screen */}
            <div className={`w-full h-full bg-stone-100 dark:bg-black rounded-[56px] overflow-hidden flex flex-col relative ${className}`}>
                 {/* Status Bar Area Spacer */}
                 <div className="w-full h-[54px] shrink-0 bg-transparent z-40 pointer-events-none"></div>
                 
                 {/* Content */}
                 {children}
                 
                 {/* Home Indicator */}
                 <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 w-[140px] h-[5px] bg-black/20 dark:bg-white/20 rounded-full z-[60] pointer-events-none"></div>
            </div>
        </div>
    </div>
  );
};

// --- Auth Component ---
const LoginScreen = ({ onLogin }: { onLogin: (user: User) => void }) => {
  // Mode: 'login' | 'register' | 'admin'
  const [mode, setMode] = useState<'login' | 'register' | 'admin'>('login');
  
  // Fields
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [adminId, setAdminId] = useState('');
  
  const [error, setError] = useState('');
  const [savedUsers, setSavedUsers] = useState<User[]>([]);

  useEffect(() => {
    setSavedUsers(getUsers());
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      let user: User;
      if (mode === 'admin') {
          user = loginAdmin(adminId, password);
      } else if (mode === 'register') {
          user = createUser(name, email, password);
      } else {
          // login
          user = loginUser(email, password);
      }
      onLogin(user);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleQuickLogin = (savedEmail: string) => {
    try {
        // Quick login bypasses password for ease of use in this demo
        const user = loginUser(savedEmail);
        onLogin(user);
    } catch (err: any) {
        setError(err.message);
    }
  }

  const handleAdminQuickLogin = () => {
    try {
        const user = loginAdmin('2404810', 'password1234');
        onLogin(user);
    } catch (err: any) {
        setError(err.message);
    }
  }

  // Helper to switch modes and clear error
  const switchMode = (newMode: 'login' | 'register' | 'admin') => {
      setMode(newMode);
      setError('');
  }

  const isStudent = mode === 'login' || mode === 'register';
  const isAdmin = mode === 'admin';

  const handlePortalSwitch = (target: 'student' | 'admin') => {
      if (target === 'student') {
          setMode('login');
      } else {
          setMode('admin');
      }
      setError('');
  };

  return (
    <PhoneFrame className="bg-white dark:bg-stone-900">
      <div className="flex-1 flex flex-col p-8 overflow-y-auto no-scrollbar relative">
           <div className="text-center mb-8 mt-12 animate-fade-in">
             <div className="w-24 h-24 bg-shoseki-brown rounded-3xl flex items-center justify-center mx-auto mb-6 text-white shadow-xl shadow-shoseki-brown/20 dark:bg-stone-800 dark:shadow-none transition-all duration-500">
                {isAdmin ? <Shield size={48} /> : <BookIcon size={48} />}
             </div>
             <h1 className="font-serif text-4xl font-bold text-shoseki-darkBrown dark:text-stone-100 mb-2">
                 Shoseki
             </h1>
             <p className="text-stone-500 dark:text-stone-400 text-base">
                 Your quiet reading sanctuary
             </p>
           </div>
           
           <form onSubmit={handleSubmit} className="space-y-5 pb-24 animate-slide-up">
             
             {/* Register Fields */}
             {mode === 'register' && (
                <div>
                  <input 
                    required 
                    type="text" 
                    value={name} 
                    onChange={e => setName(e.target.value)} 
                    className="w-full px-5 py-3.5 rounded-2xl bg-stone-50 border border-stone-200 focus:ring-2 focus:ring-shoseki-brown focus:outline-none transition-all text-base placeholder:text-stone-400 dark:bg-stone-950 dark:border-stone-800 dark:text-white dark:focus:ring-stone-600" 
                    placeholder="Student ID"
                    name="username"
                    autoComplete="username"
                  />
                </div>
             )}

             {/* User Login/Register Fields */}
             {isStudent && (
                 <>
                    <div>
                        <input 
                            required 
                            type="email" 
                            value={email} 
                            onChange={e => setEmail(e.target.value)} 
                            className="w-full px-5 py-3.5 rounded-2xl bg-stone-50 border border-stone-200 focus:ring-2 focus:ring-shoseki-brown focus:outline-none transition-all text-base placeholder:text-stone-400 dark:bg-stone-950 dark:border-stone-800 dark:text-white dark:focus:ring-stone-600" 
                            placeholder="Student Email"
                            name="email"
                            autoComplete="email"
                            list="saved-users-list"
                        />
                        <datalist id="saved-users-list">
                            {savedUsers.map(u => (
                                <option key={u.id} value={u.email}>{u.name}</option>
                            ))}
                        </datalist>
                    </div>
                    <div>
                        <input 
                            required 
                            type="password" 
                            value={password} 
                            onChange={e => setPassword(e.target.value)} 
                            className="w-full px-5 py-3.5 rounded-2xl bg-stone-50 border border-stone-200 focus:ring-2 focus:ring-shoseki-brown focus:outline-none transition-all text-base placeholder:text-stone-400 dark:bg-stone-950 dark:border-stone-800 dark:text-white dark:focus:ring-stone-600" 
                            placeholder="Password"
                            name="password"
                            autoComplete={mode === 'login' ? "current-password" : "new-password"}
                        />
                    </div>
                 </>
             )}

             {/* Admin Login Fields */}
             {isAdmin && (
                 <>
                    <div>
                        <input 
                            required 
                            type="text" 
                            value={adminId} 
                            onChange={e => setAdminId(e.target.value)} 
                            className="w-full px-5 py-3.5 rounded-2xl bg-stone-50 border border-stone-200 focus:ring-2 focus:ring-shoseki-brown focus:outline-none transition-all text-base placeholder:text-stone-400 dark:bg-stone-950 dark:border-stone-800 dark:text-white dark:focus:ring-stone-600" 
                            placeholder="Admin ID"
                            name="adminId"
                            autoComplete="off"
                        />
                    </div>
                    <div>
                        <input 
                            required 
                            type="password" 
                            value={password} 
                            onChange={e => setPassword(e.target.value)} 
                            className="w-full px-5 py-3.5 rounded-2xl bg-stone-50 border border-stone-200 focus:ring-2 focus:ring-shoseki-brown focus:outline-none transition-all text-base placeholder:text-stone-400 dark:bg-stone-950 dark:border-stone-800 dark:text-white dark:focus:ring-stone-600" 
                            placeholder="Password"
                            name="password"
                            autoComplete="current-password"
                        />
                    </div>
                 </>
             )}
             
             {error && <p className="text-red-500 text-sm text-center bg-red-50 py-2 rounded-xl font-medium dark:bg-red-900/20 dark:text-red-400">{error}</p>}
             
             <div className="pt-4 space-y-3">
                 <Button type="submit" className="w-full py-3.5 text-base font-bold rounded-2xl shadow-lg shadow-shoseki-brown/30 hover:shadow-xl transform hover:-translate-y-0.5 transition-all dark:shadow-none dark:bg-stone-800 dark:hover:bg-stone-700">
                   {isAdmin ? 'Login as Admin' : (mode === 'login' ? 'Enter Library' : 'Create Account')}
                 </Button>

                 {/* User Login/Register Toggle */}
                 {isStudent && (
                    <Button 
                    type="button" 
                    variant={mode === 'login' ? 'primary' : 'ghost'}
                    className={`w-full rounded-2xl transition-all ${
                        mode === 'login'
                        ? 'py-3.5 text-base font-bold shadow-lg shadow-shoseki-brown/30 hover:shadow-xl transform hover:-translate-y-0.5 dark:shadow-none dark:bg-stone-800 dark:hover:bg-stone-700' 
                        : 'py-3 text-base font-medium text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-950 dark:text-stone-500'
                    }`}
                    onClick={() => switchMode(mode === 'login' ? 'register' : 'login')}
                    >
                    {mode === 'login' ? "Create Account" : "Back to Login"}
                    </Button>
                 )}

                 {/* Admin Quick Login Button */}
                 {isAdmin && (
                    <Button 
                        type="button" 
                        variant="ghost"
                        className="w-full py-3 text-base font-medium text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-950 dark:text-stone-500"
                        onClick={handleAdminQuickLogin}
                    >
                        Quick Admin Demo
                    </Button>
                 )}
             </div>
           </form>

           {/* Saved Accounts Section (Only visible in User Login Mode) */}
           {mode === 'login' && savedUsers.length > 0 && (
             <div className="mt-auto pt-6 border-t border-stone-100 dark:border-stone-800 animate-fade-in">
               <p className="text-stone-400 text-sm text-center mb-4 font-medium uppercase tracking-wider dark:text-stone-600">Quick Login</p>
               <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide no-scrollbar justify-center">
                 {savedUsers.map(u => (
                   <button 
                     key={u.id}
                     onClick={() => handleQuickLogin(u.email)}
                     className="flex flex-col items-center flex-shrink-0 w-20 group"
                   >
                     <div className="w-14 h-14 rounded-full border-2 border-stone-200 dark:border-stone-800 p-0.5 group-hover:border-shoseki-brown dark:group-hover:border-stone-600 transition-colors">
                        <img src={u.avatarUrl} alt={u.name} className="w-full h-full rounded-full object-cover" />
                     </div>
                     <span className="text-xs text-stone-600 dark:text-stone-400 mt-2 truncate w-full text-center group-hover:text-shoseki-brown font-medium">{u.name.split(' ')[0]}</span>
                   </button>
                 ))}
               </div>
             </div>
           )}

            {/* Portal Toggle Switch - Absolute Bottom */}
            <div className="absolute bottom-6 left-0 right-0 flex justify-center z-10">
            <div className="flex bg-stone-100 dark:bg-stone-800 p-1 rounded-full w-[180px] shadow-lg border border-stone-200 dark:border-stone-700">
                    <button
                        type="button"
                        onClick={() => handlePortalSwitch('student')}
                        className={`flex-1 py-1.5 rounded-full text-[10px] font-bold transition-all duration-300 flex items-center justify-center gap-1 ${isStudent ? 'bg-white dark:bg-stone-600 shadow-sm text-shoseki-brown dark:text-white' : 'text-stone-400 dark:text-stone-500 hover:text-stone-600'}`}
                    >
                    <UserIcon size={12} /> Student
                    </button>
                    <button
                        type="button"
                        onClick={() => handlePortalSwitch('admin')}
                        className={`flex-1 py-1.5 rounded-full text-[10px] font-bold transition-all duration-300 flex items-center justify-center gap-1 ${isAdmin ? 'bg-white dark:bg-stone-600 shadow-sm text-shoseki-brown dark:text-white' : 'text-stone-400 dark:text-stone-500 hover:text-stone-600'}`}
                    >
                    <Shield size={12} /> Admin
                    </button>
            </div>
            </div>
      </div>
    </PhoneFrame>
  );
};

// --- Main Layout ---
interface DashboardLayoutProps {
  children?: React.ReactNode;
  user: User;
  onLogout: () => void;
}

const DashboardLayout = ({ children, user, onLogout }: DashboardLayoutProps) => {
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = [
    { icon: Library, label: 'Discover', path: '/' },
    { icon: Search, label: 'Search', path: '/search-map' }, 
    { icon: CalendarDays, label: 'Facilities', path: '/facilities' },
    // Replaced Settings with Account, serving as the main Dashboard
    { icon: UserIcon, label: 'Account', path: '/account' },
  ];

  return (
    <PhoneFrame>
        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 pb-32 no-scrollbar">
            {children}
        </main>

        {/* Floating Segmentation Tab Bar */}
        <div className="absolute bottom-6 left-0 w-full px-4 z-50 pointer-events-none">
            <nav className="pointer-events-auto bg-white/85 dark:bg-stone-900/85 backdrop-blur-xl border border-stone-200/50 dark:border-stone-800 shadow-2xl shadow-stone-200/50 dark:shadow-black/50 rounded-full p-1.5 flex justify-between items-center transition-all duration-300">
                {navItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                    <button
                    key={item.path}
                    onClick={() => navigate(item.path)}
                    className={`relative flex-1 flex items-center justify-center py-3 rounded-full transition-all duration-300 group outline-none ${
                        isActive 
                        ? 'text-shoseki-brown dark:text-stone-100' 
                        : 'text-stone-400 hover:text-stone-600 dark:text-stone-500 dark:hover:text-stone-300'
                    }`}
                    aria-label={item.label}
                    >
                    {/* Active Background Pill (Segmented Control Style) */}
                    {isActive && (
                        <div className="absolute inset-0 bg-stone-100 dark:bg-stone-800 rounded-full shadow-sm mx-1 animate-fade-in transition-all" />
                    )}
                    
                    {/* Icon */}
                    <item.icon 
                        size={20} 
                        strokeWidth={isActive ? 2.5 : 2} 
                        className={`relative z-10 transition-transform duration-300 ${isActive ? 'scale-105' : 'group-hover:scale-110'}`} 
                    />
                    </button>
                )
                })}
            </nav>
        </div>
        
        <AILibrarian />
    </PhoneFrame>
  );
};

// --- Module: Search Map ---

const LocationSearchPage = ({ books, onBookClick }: { books: Book[], onBookClick: (book: Book) => void }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedBook, setSelectedBook] = useState<Book | null>(null);
    
    // Grid Configuration
    const rows = ['A', 'B', 'C', 'D', 'E', 'F'];
    const cols = 12; // 1 to 12

    const handleSelectBook = (book: Book) => {
        setSelectedBook(book);
        setSearchTerm(''); // Clear search to show map clearly
    };

    // Parse location "Shelf A-5" -> { row: 'A', col: 5 }
    const getCoordinates = (locStr?: string) => {
        if (!locStr) return null;
        // Expected format "Shelf A-1" to "Shelf F-12"
        const match = locStr.match(/Shelf ([A-F])-(\d+)/);
        if (match) {
            return { row: match[1], col: parseInt(match[2]) };
        }
        return null;
    };

    const targetCoords = selectedBook ? getCoordinates(selectedBook.location) : null;

    const searchResults = searchTerm 
        ? books.filter(b => b.title.toLowerCase().includes(searchTerm.toLowerCase()) || b.author.toLowerCase().includes(searchTerm.toLowerCase()))
        : [];

    return (
        <div className="space-y-6 h-full flex flex-col">
            <div className="mt-2 shrink-0">
                <h1 className="text-3xl font-serif font-bold text-shoseki-darkBrown dark:text-stone-100">Floor Plan</h1>
                <p className="text-stone-500 dark:text-stone-400 text-sm">Find books and shelves location</p>
            </div>

            {/* Search Input */}
            <div className="relative shrink-0 z-20">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-stone-400" size={18} />
                <input 
                    type="text" 
                    placeholder="Search book to locate..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-shoseki-brown/30 dark:text-white"
                />
                
                {/* Dropdown Results */}
                {searchTerm && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-stone-900 rounded-xl shadow-xl border border-stone-100 dark:border-stone-800 max-h-60 overflow-y-auto no-scrollbar z-30">
                        {searchResults.length === 0 ? (
                            <div className="p-4 text-center text-stone-500 text-xs">No books found matching "{searchTerm}"</div>
                        ) : (
                            searchResults.map(book => (
                                <button 
                                    key={book.id}
                                    onClick={() => handleSelectBook(book)}
                                    className="w-full text-left px-4 py-3 hover:bg-stone-50 dark:hover:bg-stone-800 border-b border-stone-50 dark:border-stone-800 last:border-0 flex justify-between items-center"
                                >
                                    <div>
                                        <p className="font-bold text-sm text-stone-800 dark:text-stone-200 line-clamp-1">{book.title}</p>
                                        <p className="text-xs text-stone-500">{book.author}</p>
                                    </div>
                                    <span className="text-[10px] bg-stone-100 dark:bg-stone-700 px-2 py-1 rounded text-stone-600 dark:text-stone-400 font-mono">
                                        {book.location || 'N/A'}
                                    </span>
                                </button>
                            ))
                        )}
                    </div>
                )}
            </div>

            {/* Selected Book Info Card - Updated to be Clickable */}
            {selectedBook && (
                <div 
                    onClick={() => onBookClick(selectedBook)}
                    className="bg-white dark:bg-stone-900 p-4 rounded-xl shadow-sm border border-l-4 border-l-shoseki-brown border-y-stone-100 border-r-stone-100 dark:border-y-stone-800 dark:border-r-stone-800 shrink-0 flex justify-between items-center animate-slide-up cursor-pointer hover:bg-stone-50 dark:hover:bg-stone-800/50 transition-colors group"
                >
                    <div>
                        <div className="flex items-center gap-2">
                             <h3 className="font-bold text-shoseki-darkBrown dark:text-stone-100">{selectedBook.title}</h3>
                             <div className="text-[10px] text-shoseki-brown bg-shoseki-sand/20 px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">View Details</div>
                        </div>
                        <p className="text-xs text-stone-500 mb-1">{selectedBook.author}</p>
                        <div className="flex items-center gap-1 text-shoseki-brown dark:text-amber-500 text-sm font-bold">
                            <MapIcon size={14} />
                            <span>Location: {selectedBook.location}</span>
                        </div>
                    </div>
                    <img src={selectedBook.coverUrl} alt="Cover" className="w-12 h-16 object-cover rounded shadow-sm group-hover:shadow-md transition-shadow" />
                </div>
            )}

            {/* Visual Map (Cinema Seat Style) */}
            <div className="flex-1 bg-white dark:bg-stone-900 rounded-2xl shadow-inner border border-stone-200 dark:border-stone-800 p-4 overflow-hidden flex flex-col items-center justify-center relative min-h-[400px]">
                <div className="absolute top-2 left-4 text-[10px] text-stone-400 font-mono uppercase tracking-widest">Library Map</div>
                
                {/* Legend */}
                <div className="flex gap-4 mb-6">
                    <div className="flex items-center gap-1.5">
                        <div className="w-3 h-3 bg-stone-300 dark:bg-stone-700 rounded-sm"></div>
                        <span className="text-[10px] text-stone-500 uppercase">Shelf</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="w-3 h-3 bg-shoseki-brown dark:bg-amber-600 rounded-sm shadow-sm ring-2 ring-shoseki-brown/20"></div>
                        <span className="text-[10px] text-shoseki-brown dark:text-amber-500 font-bold uppercase">Target</span>
                    </div>
                </div>

                <div className="w-full overflow-x-auto pb-4 no-scrollbar">
                    <div className="min-w-max flex flex-col gap-3 mx-auto px-4">
                        {rows.map(row => (
                            <div key={row} className="flex items-center gap-3">
                                {/* Row Label */}
                                <div className="w-6 h-6 flex items-center justify-center font-bold text-stone-400 text-xs bg-stone-100 dark:bg-stone-800 rounded-full">
                                    {row}
                                </div>
                                {/* Shelves */}
                                <div className="flex gap-1.5">
                                    {Array.from({ length: cols }, (_, i) => i + 1).map(col => {
                                        const isTarget = targetCoords?.row === row && targetCoords?.col === col;
                                        return (
                                            <div 
                                                key={`${row}-${col}`}
                                                className={`
                                                    w-5 h-7 rounded-sm transition-all duration-300 relative group
                                                    ${isTarget 
                                                        ? 'bg-shoseki-brown dark:bg-amber-600 scale-125 shadow-lg ring-2 ring-offset-1 ring-shoseki-brown dark:ring-amber-600 dark:ring-offset-stone-900 z-10' 
                                                        : 'bg-stone-300 dark:bg-stone-700 hover:bg-stone-400 dark:hover:bg-stone-600'
                                                    }
                                                `}
                                            >
                                                {/* Tooltip */}
                                                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 bg-black/80 text-white text-[9px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-20">
                                                    Shelf {row}-{col}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="mt-4 text-center">
                    <p className="text-[10px] text-stone-400 italic">Front Desk Entrance ↓</p>
                    <div className="h-1 w-24 bg-stone-200 dark:bg-stone-800 mx-auto mt-1 rounded-full"></div>
                </div>
            </div>
        </div>
    );
};

// --- Customer Dashboard Components (Module 5) ---

const CustomerDashboard = ({ user }: { user: User }) => {
    const navigate = useNavigate();
    const [loans, setLoans] = useState<LoanRecord[]>([]);
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [penalties, setPenalties] = useState<Penalty[]>([]);

    useEffect(() => {
        setLoans(getLoans(user.id));
        setBookings(getBookings().filter(b => b.userId === user.id));
        setPenalties(getPenalties(user.id));
    }, [user.id]);

    const activeLoans = loans.filter(l => l.status === 'active');
    const unpaidPenalties = penalties.filter(p => p.status === 'unpaid');

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header removed and moved to UnifiedDashboard */}

            {/* Status Overview Cards */}
            <div className="grid grid-cols-2 gap-4">
                 <div className="bg-white dark:bg-stone-900 p-4 rounded-2xl shadow-sm border border-stone-100 dark:border-stone-800">
                    <div className="flex items-center gap-2 mb-2 text-shoseki-brown dark:text-amber-500">
                        <BookOpen size={18} />
                        <span className="font-bold text-sm">Active Loans</span>
                    </div>
                    <p className="text-3xl font-bold text-stone-800 dark:text-white">{activeLoans.length}</p>
                    <p className="text-xs text-stone-400 mt-1">{activeLoans.length > 0 ? 'Due soon' : 'No books borrowed'}</p>
                 </div>
                 <div className="bg-white dark:bg-stone-900 p-4 rounded-2xl shadow-sm border border-stone-100 dark:border-stone-800">
                    <div className="flex items-center gap-2 mb-2 text-red-500">
                        <AlertCircle size={18} />
                        <span className="font-bold text-sm">Penalties</span>
                    </div>
                    <p className="text-3xl font-bold text-stone-800 dark:text-white">MYR {unpaidPenalties.reduce((sum, p) => sum + p.amount, 0).toFixed(2)}</p>
                    <p className="text-xs text-stone-400 mt-1">{unpaidPenalties.length > 0 ? 'Please pay at counter' : 'Good standing'}</p>
                 </div>
            </div>

            {/* Current Loans List */}
            <div>
                <h3 className="font-bold text-stone-700 dark:text-stone-300 mb-3 flex items-center justify-between">
                    <span>Currently Reading</span>
                    <Button variant="ghost" className="text-xs" onClick={() => navigate('/history')}>View History</Button>
                </h3>
                <div className="space-y-3">
                    {activeLoans.length === 0 ? (
                        <div className="text-center p-8 border-2 border-dashed border-stone-200 dark:border-stone-800 rounded-xl text-stone-400">
                            You haven't borrowed any books yet.
                        </div>
                    ) : (
                        activeLoans.map(loan => (
                            <div key={loan.id} className="bg-white dark:bg-stone-900 p-3 rounded-xl shadow-sm flex gap-3 border border-stone-100 dark:border-stone-800">
                                <img src={loan.coverUrl} className="w-12 h-16 object-cover rounded" alt="Cover" />
                                <div className="flex-1">
                                    <h4 className="font-bold text-sm text-stone-800 dark:text-white line-clamp-1">{loan.bookTitle}</h4>
                                    <p className="text-xs text-stone-500">Due: {new Date(loan.dueDate).toLocaleDateString()}</p>
                                    <div className="mt-2 text-xs font-medium text-amber-600 bg-amber-50 dark:bg-amber-900/30 dark:text-amber-400 px-2 py-1 rounded w-fit">
                                        On Loan
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Upcoming Bookings */}
             <div>
                <h3 className="font-bold text-stone-700 dark:text-stone-300 mb-3">Upcoming Bookings</h3>
                <div className="space-y-3">
                    {bookings.filter(b => new Date(b.date) >= new Date()).length === 0 ? (
                         <div className="text-center p-4 bg-stone-50 dark:bg-stone-900 rounded-xl text-stone-400 text-xs">
                            No upcoming facility bookings.
                        </div>
                    ) : (
                        bookings.filter(b => new Date(b.date) >= new Date()).map(booking => (
                            <div key={booking.id} className="bg-white dark:bg-stone-900 p-3 rounded-xl shadow-sm border border-stone-100 dark:border-stone-800 flex justify-between items-center">
                                <div>
                                    <p className="font-bold text-sm text-stone-800 dark:text-white">{booking.facilityName}</p>
                                    <p className="text-xs text-stone-500">{new Date(booking.date).toLocaleDateString() • {booking.startTime} - {booking.endTime}}</p>
                                </div>
                                <span className={`text-[10px] px-2 py-1 rounded font-bold uppercase ${
                                    booking.status === 'approved' ? 'bg-emerald-100 text-emerald-600' :
                                    booking.status === 'rejected' ? 'bg-red-100 text-red-600' :
                                    'bg-amber-100 text-amber-600'
                                }`}>
                                    {booking.status}
                                </span>
                            </div>
                        ))
                    )}
                </div>
             </div>
        </div>
    )
}

// --- Edit Profile Modal ---
const EditProfileModal = ({ user, onClose, onSave }: { user: User, onClose: () => void, onSave: (updates: Partial<User>) => void }) => {
    const [name, setName] = useState(user.name);
    const [avatarUrl, setAvatarUrl] = useState(user.avatarUrl || '');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({ name, avatarUrl });
        onClose();
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                if (typeof reader.result === 'string') {
                    setAvatarUrl(reader.result);
                }
            };
            reader.readAsDataURL(file);
        }
    };

    return (
        <div className="absolute inset-0 z-[70] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
            <div className="bg-white dark:bg-stone-900 rounded-3xl shadow-2xl w-full max-w-[320px] overflow-hidden flex flex-col border border-stone-200 dark:border-stone-800">
                <div className="p-4 border-b border-stone-100 dark:border-stone-800 flex justify-between items-center">
                    <h3 className="font-bold text-lg text-stone-800 dark:text-white">Edit Profile</h3>
                    <button onClick={onClose} className="p-1 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-full transition-colors">
                        <X size={20} className="text-stone-500" />
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="flex flex-col items-center mb-4">
                        <div 
                            className="w-24 h-24 rounded-full overflow-hidden border-2 border-stone-200 dark:border-stone-700 mb-3 relative group cursor-pointer shadow-md"
                            onClick={() => fileInputRef.current?.click()}
                            title="Click to upload new photo"
                        >
                            <img src={avatarUrl || user.avatarUrl} alt="Avatar Preview" className="w-full h-full object-cover transition-opacity group-hover:opacity-70" />
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/30">
                                <Camera size={24} className="text-white drop-shadow-md" />
                            </div>
                        </div>
                        <input 
                            type="file" 
                            ref={fileInputRef} 
                            className="hidden" 
                            accept="image/*" 
                            onChange={handleFileChange}
                        />
                        <p className="text-xs text-stone-400 font-medium">Tap photo to upload</p>
                    </div>
                    
                    <div>
                        <label className="block text-xs font-bold text-stone-500 uppercase mb-1">Username</label>
                        <input 
                            type="text" 
                            required
                            value={name} 
                            onChange={e => setName(e.target.value)} 
                            className="w-full px-4 py-2 bg-stone-50 border border-stone-200 rounded-xl dark:bg-stone-800 dark:border-stone-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-shoseki-brown/50"
                        />
                    </div>

                    <Button type="submit" className="w-full rounded-xl mt-2">
                        <Save size={16} /> Save Changes
                    </Button>
                </form>
            </div>
        </div>
    )
}

const HistoryPage = ({ user }: { user: User }) => {
    const navigate = useNavigate();
    const [history, setHistory] = useState<LoanRecord[]>([]);

    useEffect(() => {
        setHistory(getLoans(user.id));
    }, [user.id]);

    return (
        <div className="flex flex-col h-full animate-fade-in pb-24">
             {/* Header */}
             <div className="flex items-center gap-2 px-1 py-4 mb-2 sticky top-0 bg-stone-100 dark:bg-black z-30 transition-colors">
                  <button 
                    onClick={() => navigate(-1)} 
                    className="p-2 -ml-2 hover:bg-stone-200 dark:hover:bg-stone-800 rounded-full transition-colors text-shoseki-brown dark:text-stone-300"
                  >
                      <ChevronLeft size={24} />
                  </button>
                  <h2 className="text-[28px] font-bold font-serif text-stone-900 dark:text-white leading-none">History</h2>
              </div>

             <div className="space-y-4">
                {history.length === 0 ? (
                    <div className="text-center text-stone-400 mt-10">No borrowing history yet.</div>
                ) : (
                    history.map(loan => (
                        <div key={loan.id} className="bg-white dark:bg-stone-900 p-4 rounded-xl shadow-sm border border-stone-100 dark:border-stone-800 flex gap-4">
                             <div className="w-16 h-24 shrink-0 bg-stone-200 rounded-md overflow-hidden">
                                <img src={loan.coverUrl} className="w-full h-full object-cover" alt={loan.bookTitle} />
                             </div>
                             <div className="flex-1 min-w-0">
                                <h4 className="font-bold text-stone-800 dark:text-white line-clamp-2 text-sm mb-1">{loan.bookTitle}</h4>
                                <div className="space-y-1 mb-2">
                                    <p className="text-xs text-stone-500">Borrowed: {new Date(loan.borrowedAt).toLocaleDateString()}</p>
                                    <p className="text-xs text-stone-500">Due: {new Date(loan.dueDate).toLocaleDateString()}</p>
                                    {loan.returnedAt && (
                                        <p className="text-xs text-emerald-600 font-medium">Returned: {new Date(loan.returnedAt).toLocaleDateString()}</p>
                                    )}
                                </div>
                                <div>
                                     <span className={`text-[10px] px-2 py-1 rounded font-bold uppercase tracking-wider ${
                                        loan.status === 'active' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                                        loan.status === 'returned' ? 'bg-stone-100 text-stone-500 dark:bg-stone-800 dark:text-stone-400' :
                                        'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
                                    }`}>
                                        {loan.status === 'active' ? 'On Loan' : loan.status}
                                    </span>
                                </div>
                             </div>
                        </div>
                    ))
                )}
             </div>
        </div>
    )
}

// --- Page Components ---

const UnifiedDashboard = ({ books, isAdmin, user, onLogout, onUpdateUser }: { books: Book[], isAdmin: boolean, user: User, onLogout: () => void, onUpdateUser: (u: Partial<User>) => void }) => {
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);

  // Merged "Home" and "Settings" content
  const stats = [
    { label: 'Available', value: books.filter(b => b.status === BookStatus.Available).length, color: '#10b981', icon: CheckCircle },
    { label: 'On Loan', value: books.filter(b => b.status === BookStatus.OnLoan).length, color: '#f59e0b', icon: Clock },
    { label: 'Out of Stock', value: books.filter(b => b.status === BookStatus.OutOfStock).length, color: '#ef4444', icon: XCircle },
  ];

  const readingData: {name: string, pages: number}[] = [
      { name: 'Jan', pages: 120 }, { name: 'Feb', pages: 200 }, { name: 'Mar', pages: 150 },
      { name: 'Apr', pages: 300 }, { name: 'May', pages: 250 }, { name: 'Jun', pages: 400 },
  ];

  return (
    <div className="space-y-6 animate-fade-in pb-24">
      {/* Combined Header: Profile + Logout */}
      <div className="flex items-center justify-between mb-8 mt-4">
        <div>
            <h1 className="text-3xl font-serif font-bold text-shoseki-darkBrown dark:text-stone-100">
                {isAdmin ? 'Admin Portal' : `Hello, ${user.name.split(' ')[0]}`}
            </h1>
            <p className="text-stone-500 dark:text-stone-400 text-sm">
                {isAdmin ? 'System Overview' : 'Your library dashboard'}
            </p>
        </div>
        <div className="flex items-center gap-3">
            <button 
                onClick={onLogout}
                className="p-2.5 bg-white dark:bg-stone-800 text-stone-400 hover:text-red-500 dark:hover:text-red-400 rounded-full shadow-sm border border-stone-100 dark:border-stone-700 transition-colors"
                aria-label="Log out"
            >
                <LogOut size={20} />
            </button>
            <button
                onClick={() => setIsEditProfileOpen(true)}
                className="w-12 h-12 rounded-full overflow-hidden border-2 border-white dark:border-stone-700 shadow-md relative group"
            >
                <img src={user.avatarUrl} alt="Profile" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Settings size={16} className="text-white" />
                </div>
            </button>
        </div>
      </div>

      {isEditProfileOpen && (
          <EditProfileModal 
            user={user} 
            onClose={() => setIsEditProfileOpen(false)} 
            onSave={onUpdateUser}
          />
      )}

      {/* Main Content */}
      {!isAdmin ? (
          <CustomerDashboard user={user} /> 
      ) : (
          /* Admin Dashboard (Module 1) */
          <div className="space-y-6">
              {/* Stats Cards */}
              <div className="grid grid-cols-3 gap-3">
                {stats.map((stat, idx) => (
                  <div key={idx} className="bg-white dark:bg-stone-900 p-4 rounded-2xl shadow-sm border border-stone-100 dark:border-stone-800 flex flex-col items-center text-center">
                    <div className="p-2 rounded-full mb-2 bg-opacity-10 dark:bg-opacity-20" style={{ backgroundColor: stat.color, color: stat.color }}>
                        <stat.icon size={20} />
                    </div>
                    <span className="text-2xl font-bold text-stone-800 dark:text-stone-200">{stat.value}</span>
                    <span className="text-[10px] text-stone-500 dark:text-stone-400 uppercase tracking-wider font-bold mt-1">{stat.label}</span>
                  </div>
                ))}
              </div>

              {/* Chart */}
              <div className="bg-white dark:bg-stone-900 p-6 rounded-3xl shadow-sm border border-stone-100 dark:border-stone-800">
                <h3 className="font-bold text-stone-700 dark:text-stone-300 mb-6">Monthly Lending Activity</h3>
                <div className="h-48 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={readingData}>
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} />
                      <Tooltip cursor={{fill: 'transparent'}} contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'}} />
                      <Bar dataKey="pages" radius={[4, 4, 0, 0]}>
                        {readingData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#5D4037' : '#8D6E63'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
          </div>
      )}

      {/* Settings Footer */}
      <div className="text-center pt-8 border-t border-stone-100 dark:border-stone-800 mt-8">
           <p className="text-xs text-stone-300 dark:text-stone-700 font-mono">Shoseki v2.5.0</p>
      </div>
    </div>
  );
};

const LibraryPage = ({ books, onStatusChange, onDelete, onEdit, isAdmin, onAddToCart, onReserve, cartItems, onBookClick }: { books: Book[], onStatusChange: any, onDelete: any, onEdit: any, isAdmin: boolean, onAddToCart?: any, onReserve?: any, cartItems?: Book[], onBookClick: (book: Book) => void }) => {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  // Dynamic Category Generation from available books
  // 1. Get all unique genres from books
  const allGenres = Array.from(new Set(books.map(b => b.genre).filter(Boolean)));
  
  // 2. Define standard genres to show first
  const standardGenres = ["Fiction", "Sci-Fi", "Romance", "Horror", "History", "Non-Fiction", "Mystery"];
  
  // 3. Find genres that are not in standard list
  const otherGenres = allGenres.filter(g => !standardGenres.includes(g));
  
  // 4. Combine: Standard (only if they exist in books? Or always show? Let's show all standard + others)
  // Actually, better UX: Show standard first, then others.
  const categories = [...standardGenres, ...otherGenres];

  // Filter global books by search
  const searchedBooks = books.filter(book => 
      book.title.toLowerCase().includes(search.toLowerCase()) || 
      book.author.toLowerCase().includes(search.toLowerCase()) ||
      (book.isbn && book.isbn.includes(search))
  );

  // --- Category Detail View (See All) ---
  if (activeCategory) {
      const categoryBooks = searchedBooks.filter(b => b.genre === activeCategory);
      return (
          <div className="flex flex-col h-full animate-fade-in">
              {/* Header */}
              <div className="flex items-center gap-2 px-1 py-4 mb-2 sticky top-0 bg-[#f2f1ea] dark:bg-[#111] z-30 transition-colors">
                  <button 
                    onClick={() => setActiveCategory(null)} 
                    className="p-2 -ml-2 hover:bg-stone-200 dark:hover:bg-stone-800 rounded-full transition-colors text-shoseki-brown dark:text-stone-300"
                  >
                      <ChevronLeft size={24} />
                  </button>
                  <h2 className="text-[28px] font-bold font-serif text-stone-900 dark:text-white leading-none">{activeCategory}</h2>
              </div>

              {/* List of Books */}
              <div className="flex-col pb-32 space-y-1">
                  {categoryBooks.length > 0 ? (
                      categoryBooks.map(book => (
                          <BookCard 
                              key={book.id} 
                              book={book} 
                              onStatusChange={onStatusChange} 
                              onDelete={onDelete}
                              onEdit={onEdit}
                              onClick={onBookClick}
                              isAdmin={isAdmin}
                              onAddToCart={onAddToCart}
                              onReserve={onReserve}
                              isInCart={cartItems?.some(i => i.id === book.id)}
                              variant="list"
                          />
                      ))
                  ) : (
                      <div className="text-center text-stone-400 mt-10">
                          <p>No books found in this category.</p>
                      </div>
                  )}
              </div>
          </div>
      )
  }

  // --- Main Discovery View ---
  return (
    <div className="flex flex-col pt-2 w-full pb-32 space-y-8 animate-fade-in">
      {/* Header Section */}
      <div className="px-1 mt-2 space-y-4">
          <h2 className="text-[34px] font-sans font-bold text-stone-900 dark:text-white leading-none tracking-tight">Discover</h2>
          
          <div className="relative z-20">
              <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-stone-400" size={17} />
                  <input 
                    type="text" 
                    placeholder="Search by title, author, or ISBN..." 
                    className="w-full pl-10 pr-4 py-2 bg-stone-200/60 dark:bg-stone-800 border-none rounded-[10px] focus:outline-none focus:ring-0 text-[17px] placeholder:text-stone-500 dark:text-white"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
              </div>
          </div>
      </div>

      {/* New Arrivals Section - Only show when not searching */}
      {!search && (
          <div className="space-y-3">
              <div className="flex justify-between items-end px-1 border-b border-stone-200 dark:border-stone-800 pb-2">
                    <h3 className="text-xl font-bold font-serif text-stone-900 dark:text-white leading-none">
                        New Arrivals
                    </h3>
              </div>
              <div className="flex flex-row overflow-x-auto gap-3 px-1 pb-2 snap-x no-scrollbar items-start">
                  {books.slice(0, 6).map(book => (
                      <div key={book.id}>
                          <BookCard 
                              book={book} 
                              onStatusChange={onStatusChange} 
                              onDelete={onDelete}
                              onEdit={onEdit}
                              onClick={onBookClick}
                              isAdmin={isAdmin}
                              onAddToCart={onAddToCart}
                              onReserve={onReserve}
                              isInCart={cartItems?.some(i => i.id === book.id)}
                              variant="portrait"
                          />
                      </div>
                  ))}
              </div>
          </div>
      )}

      {/* Categories Sections */}
      <div className="space-y-6">
        {categories.map(category => {
            const categoryBooks = searchedBooks.filter(b => b.genre === category);
            
            if (categoryBooks.length === 0) return null;

            return (
                <div key={category} className="space-y-3">
                    <div className="flex justify-between items-end px-1 border-b border-stone-200 dark:border-stone-800 pb-2">
                        <h3 className="text-xl font-bold font-serif text-stone-900 dark:text-white leading-none">
                            {category}
                        </h3>
                        <button 
                            onClick={() => setActiveCategory(category)}
                            className="text-shoseki-brown dark:text-amber-500 text-xs font-bold uppercase tracking-wider hover:opacity-70 transition-opacity"
                        >
                            See All
                        </button>
                    </div>

                    {/* Horizontal Scroll Container */}
                    <div className="flex flex-row overflow-x-auto gap-3 px-1 pb-2 snap-x no-scrollbar items-start">
                        {categoryBooks.slice(0, 6).map(book => (
                            <div key={book.id}>
                                <BookCard 
                                    book={book} 
                                    onStatusChange={onStatusChange} 
                                    onDelete={onDelete}
                                    onEdit={onEdit}
                                    onClick={onBookClick}
                                    isAdmin={isAdmin}
                                    onAddToCart={onAddToCart}
                                    onReserve={onReserve}
                                    isInCart={cartItems?.some(i => i.id === book.id)}
                                    variant="portrait"
                                />
                            </div>
                        ))}
                    </div>
                </div>
            );
        })}
      </div>

      {searchedBooks.length === 0 && (
          <div className="text-center text-stone-400 mt-10">
              <p>No books found matching your search.</p>
          </div>
      )}
    </div>
  );
};

const FacilitiesPage = ({ user, isAdmin }: { user: User, isAdmin: boolean }) => {
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [preselectedFacility, setPreselectedFacility] = useState('');
    const [allUsers, setAllUsers] = useState<User[]>([]);
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

    useEffect(() => {
        setBookings(getBookings());
        if (isAdmin) {
            setAllUsers(getUsers());
        }
    }, [isAdmin]);

    const handleBooking = (facility: string, date: string, start: string, end: string, pax: number) => {
        // 1. Time Logic Validation
        if (start >= end) {
            alert("End time must be after start time.");
            return;
        }

        // 2. Conflict Check
        // Overlap formula: (StartA < EndB) and (EndA > StartB)
        const hasConflict = bookings.some(b => {
            // Ignore if different facility or different day or if the existing booking was rejected
            if (b.facilityName !== facility || b.date !== date || b.status === 'rejected') {
                return false;
            }

            // Check if the requested time range overlaps with this booking's time range
            // Using string comparison for HH:MM format works correctly (e.g. "09:00" < "10:00")
            const overlap = (start < b.endTime) && (end > b.startTime);
            return overlap;
        });

        if (hasConflict) {
            alert("This facility is already booked for the selected time slot. Please choose another time.");
            return;
        }

        // 3. Proceed with booking
        addBooking({
            facilityId: facility.toLowerCase().replace(/\s/g, '-'),
            facilityName: facility,
            date,
            startTime: start,
            endTime: end,
            pax,
            userId: user.id,
            capacity: 4 // default
        });
        setBookings(getBookings());
        setIsModalOpen(false);
        setPreselectedFacility('');
    };

    const handleStatusUpdate = (id: string, status: any) => {
        updateBookingStatus(id, status);
        setBookings(getBookings());
    };

    const openBookingModal = (facilityName: string = '') => {
        setPreselectedFacility(facilityName);
        setIsModalOpen(true);
    };

    const facilitiesList = [
        { name: 'Meeting Room A', type: 'Conference', capacity: '6 Pax', icon: Users, color: 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400' },
        { name: 'Meeting Room B', type: 'Conference', capacity: '4 Pax', icon: Users, color: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' },
        { name: 'Quiet Desk 1', type: 'Individual', capacity: '1 Pax', icon: Armchair, color: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' },
        { name: 'Quiet Desk 2', type: 'Individual', capacity: '1 Pax', icon: Armchair, color: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' },
        { name: 'Discussion Pod', type: 'Collab', capacity: '2 Pax', icon: MessageSquare, color: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400' },
    ];

    const getTodayString = () => {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    };

    const generateTimeSlots = () => {
        const slots = [];
        for (let i = 9; i <= 22; i++) {
            slots.push(`${i.toString().padStart(2, '0')}:00`);
            if (i !== 22) slots.push(`${i.toString().padStart(2, '0')}:30`);
        }
        return slots;
    };

    const getAvailableTimeSlots = () => {
        const slots = generateTimeSlots();
        const todayStr = getTodayString();
        
        if (selectedDate === todayStr) {
            const now = new Date();
            const currentMinutes = now.getHours() * 60 + now.getMinutes();
            return slots.filter(slot => {
                const [h, m] = slot.split(':').map(Number);
                const slotMinutes = h * 60 + m;
                return slotMinutes > currentMinutes;
            });
        }
        return slots;
    };

    const availableTimeSlots = getAvailableTimeSlots();

    // Filter logic
    const displayedBookings = isAdmin 
        ? bookings.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()) 
        : bookings.filter(b => b.userId === user.id);

    const getUserName = (userId: string) => {
        return allUsers.find(u => u.id === userId)?.name || userId;
    };

    return (
        <div className="space-y-6 animate-fade-in pb-24">
             <div className="flex justify-between items-end mt-2 px-1">
                 <div>
                    <h2 className="text-[34px] font-sans font-bold text-stone-900 dark:text-white leading-none">Facilities</h2>
                    <p className="text-stone-500 dark:text-stone-400 mt-1">
                        {isAdmin ? 'Manage bookings & rooms' : 'Book rooms & desks'}
                    </p>
                 </div>
                 {!isAdmin && (
                    <Button onClick={() => setIsModalOpen(true)} className="rounded-full h-10 w-10 p-0 flex items-center justify-center"><Plus size={24}/></Button>
                 )}
             </div>

             {/* Facilities Grid */}
             <div className="grid grid-cols-2 gap-3">
                {facilitiesList.map((facility) => (
                    <button 
                        key={facility.name}
                        onClick={() => openBookingModal(facility.name)}
                        className="bg-white dark:bg-stone-900 p-4 rounded-2xl shadow-sm border border-stone-100 dark:border-stone-800 flex flex-col items-start gap-3 hover:shadow-md transition-all text-left group"
                    >
                        <div className={`p-2.5 rounded-full ${facility.color}`}>
                            <facility.icon size={20} />
                        </div>
                        <div>
                            <h3 className="font-bold text-stone-800 dark:text-white text-sm leading-tight mb-1 group-hover:text-shoseki-brown dark:group-hover:text-amber-500 transition-colors">{facility.name}</h3>
                            <p className="text-[10px] text-stone-500 uppercase font-bold tracking-wider">{facility.capacity}</p>
                        </div>
                    </button>
                ))}
             </div>
             
             {/* List of Bookings */}
             <div>
                 <h3 className="font-bold text-stone-700 dark:text-stone-300 mb-3 flex items-center gap-2">
                    <Clock size={16} /> {isAdmin ? 'All Bookings Management' : 'Upcoming Bookings'}
                 </h3>
                 <div className="space-y-3">
                     {displayedBookings.length === 0 ? (
                         <div className="text-center p-8 border-2 border-dashed border-stone-200 dark:border-stone-800 rounded-xl text-stone-400">
                             {isAdmin ? 'No active bookings found.' : 'No bookings yet.'}
                         </div>
                     ) : (
                         displayedBookings.map(b => (
                             <div key={b.id} className="bg-white dark:bg-stone-900 p-4 rounded-xl shadow-sm border border-stone-100 dark:border-stone-800 flex flex-col gap-2">
                                 <div className="flex justify-between items-start">
                                     <div>
                                         <p className="font-bold text-stone-800 dark:text-white">{b.facilityName}</p>
                                         <p className="text-xs text-stone-500">
                                            {new Date(b.date).toLocaleDateString()} • {b.startTime}-{b.endTime}
                                         </p>
                                         {isAdmin && (
                                            <p className="text-xs font-medium text-shoseki-brown dark:text-amber-500 mt-1">
                                                Booked by: {getUserName(b.userId)}
                                            </p>
                                         )}
                                     </div>
                                     <div className="flex flex-col items-end gap-2">
                                         <span className={`text-[10px] px-2 py-1 rounded font-bold uppercase ${
                                             b.status === 'approved' ? 'bg-emerald-100 text-emerald-600' :
                                             b.status === 'rejected' ? 'bg-red-100 text-red-600' :
                                             'bg-amber-100 text-amber-600'
                                         }`}>{b.status}</span>
                                     </div>
                                 </div>

                                 {/* Admin Actions */}
                                 {isAdmin && b.status === 'pending' && (
                                     <div className="flex gap-2 mt-2 pt-2 border-t border-stone-100 dark:border-stone-800">
                                         <Button 
                                            variant="ghost" 
                                            className="flex-1 h-8 text-xs bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40"
                                            onClick={() => handleStatusUpdate(b.id, 'rejected')}
                                         >
                                            <X size={14} /> Reject
                                         </Button>
                                         <Button 
                                            variant="ghost" 
                                            className="flex-1 h-8 text-xs bg-emerald-50 text-emerald-600 hover:bg-emerald-100 dark:bg-emerald-900/20 dark:hover:bg-emerald-900/40"
                                            onClick={() => handleStatusUpdate(b.id, 'approved')}
                                         >
                                            <Check size={14} /> Approve
                                         </Button>
                                     </div>
                                 )}

                                 {/* User Cancel Action */}
                                 {!isAdmin && b.status === 'pending' && (
                                     <div className="flex justify-end pt-1">
                                         <button onClick={() => { cancelBooking(b.id); setBookings(getBookings()); }} className="text-red-400 text-xs hover:text-red-600 flex items-center gap-1 transition-colors">
                                            <Trash2 size={14}/> Cancel Request
                                         </button>
                                     </div>
                                 )}
                             </div>
                         ))
                     )}
                 </div>
             </div>

             {/* Simple Modal Inline or Overlay */}
             {isModalOpen && (
                 <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
                     <div className="bg-white dark:bg-stone-900 p-6 rounded-3xl w-full max-w-sm shadow-2xl">
                         <h3 className="font-bold text-xl mb-4 text-stone-900 dark:text-white">New Booking</h3>
                         <form onSubmit={(e) => {
                             e.preventDefault();
                             const form = e.target as any;
                             handleBooking(
                                 form.facility.value,
                                 form.date.value,
                                 form.start.value,
                                 form.end.value,
                                 parseInt(form.pax.value)
                             );
                         }} className="space-y-4">
                             <div>
                                 <label className="block text-xs font-bold text-stone-500 mb-1">Facility</label>
                                 <select 
                                    name="facility" 
                                    defaultValue={preselectedFacility}
                                    className="w-full p-2 rounded-lg bg-stone-100 dark:bg-stone-800 dark:text-white border-none"
                                >
                                     {facilitiesList.map(f => (
                                         <option key={f.name} value={f.name}>{f.name}</option>
                                     ))}
                                 </select>
                             </div>
                             <div>
                                 <label className="block text-xs font-bold text-stone-500 mb-1">Date</label>
                                 <input 
                                    type="date" 
                                    name="date" 
                                    required 
                                    min={getTodayString()}
                                    value={selectedDate}
                                    onChange={(e) => setSelectedDate(e.target.value)}
                                    className="w-full p-2 rounded-lg bg-stone-100 dark:bg-stone-800 dark:text-white border-none"
                                />
                             </div>
                             <div className="flex gap-2">
                                 <div className="flex-1">
                                     <label className="block text-xs font-bold text-stone-500 mb-1">Start</label>
                                     <select name="start" required className="w-full p-2 rounded-lg bg-stone-100 dark:bg-stone-800 dark:text-white border-none appearance-none">
                                         {availableTimeSlots.map(t => <option key={t} value={t}>{t}</option>)}
                                     </select>
                                 </div>
                                 <div className="flex-1">
                                     <label className="block text-xs font-bold text-stone-500 mb-1">End</label>
                                     <select name="end" required className="w-full p-2 rounded-lg bg-stone-100 dark:bg-stone-800 dark:text-white border-none appearance-none">
                                         {availableTimeSlots.map(t => <option key={t} value={t}>{t}</option>)}
                                     </select>
                                 </div>
                             </div>
                             <div>
                                 <label className="block text-xs font-bold text-stone-500 mb-1">Pax</label>
                                 <input type="number" name="pax" min="1" max="6" defaultValue="1" className="w-full p-2 rounded-lg bg-stone-100 dark:bg-stone-800 dark:text-white border-none"/>
                             </div>
                             <div className="flex gap-2 pt-2">
                                 <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)} className="flex-1">Cancel</Button>
                                 <Button type="submit" className="flex-1">Book</Button>
                             </div>
                         </form>
                     </div>
                 </div>
             )}
        </div>
    );
};

const App = () => {
  const [user, setUser] = useState<User | null>(getActiveUser());
  const [books, setBooks] = useState<Book[]>([]);
  const [cart, setCart] = useState<Book[]>([]);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [showAddBook, setShowAddBook] = useState(false);
  const [editingBook, setEditingBook] = useState<Book | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const b = await getBooks();
    setBooks(b);
  };

  const handleLogin = (u: User) => {
    setUser(u);
    setActiveUser(u);
  };

  const handleLogout = () => {
    setUser(null);
    setActiveUser(null);
    setCart([]);
  };

  const handleUpdateUser = (updates: Partial<User>) => {
      if (!user) return;
      const updated = updateUserDetails(user.id, updates);
      setUser(updated);
  };

  const isAdmin = user?.role === 'admin';

  // Book Actions
  const handleStatusChange = async (id: string, status: BookStatus) => {
      await updateBookStatus(id, status);
      loadData();
  };

  const handleDelete = async (id: string) => {
      if(confirm('Delete book?')) {
          await deleteBook(id);
          loadData();
      }
  };

  const onAddBook = async (bookData: any) => {
      await addBook(bookData);
      loadData();
  };
  
  const onUpdateBook = async (book: Book) => {
      await updateBookDetails(book);
      loadData();
  };

  // Cart Actions (Borrowing)
  const addToCart = (book: Book) => {
      if (!cart.find(b => b.id === book.id)) {
          setCart([...cart, book]);
      }
  };

  const handleCheckout = async () => {
      if (!user) return;
      await borrowBooks(user.id, cart.map(b => b.id));
      setCart([]);
      loadData();
      alert('Books borrowed successfully!');
  };

  if (!user) return <LoginScreen onLogin={handleLogin} />;

  return (
     <HashRouter>
        <DashboardLayout user={user} onLogout={handleLogout}>
           <Routes>
              <Route path="/" element={
                  <LibraryPage 
                      books={books} 
                      isAdmin={isAdmin}
                      onStatusChange={handleStatusChange}
                      onDelete={handleDelete}
                      onEdit={(b) => setEditingBook(b)}
                      onBookClick={(b) => setSelectedBook(b)}
                      onAddToCart={addToCart}
                      cartItems={cart}
                  />
              } />
              <Route path="/search-map" element={<LocationSearchPage books={books} onBookClick={(b) => setSelectedBook(b)} />} />
              <Route path="/facilities" element={<FacilitiesPage user={user} isAdmin={isAdmin} />} />
              <Route path="/account" element={
                  <UnifiedDashboard 
                    books={books} 
                    isAdmin={isAdmin} 
                    user={user} 
                    onLogout={handleLogout} 
                    onUpdateUser={handleUpdateUser} 
                  />
              } />
              <Route path="/history" element={<HistoryPage user={user} />} />
              <Route path="*" element={<Navigate to="/" />} />
           </Routes>

           {/* Floating Cart Button for Users */}
           {!isAdmin && cart.length > 0 && (
               <div className="absolute bottom-24 right-4 z-40">
                   <Button onClick={handleCheckout} className="rounded-full shadow-xl py-3 px-6">
                       Checkout ({cart.length})
                   </Button>
               </div>
           )}

           {/* Admin Add Button */}
           {isAdmin && (
               <div className="absolute bottom-24 right-4 z-40">
                   <button 
                       onClick={() => setShowAddBook(true)}
                       className="p-4 bg-shoseki-brown text-white rounded-full shadow-lg hover:bg-shoseki-darkBrown transition-colors"
                   >
                       <Plus size={24} />
                   </button>
               </div>
           )}
           
           {/* Modals */}
           {selectedBook && (
               <BookDetailsModal 
                   book={selectedBook} 
                   onClose={() => setSelectedBook(null)}
                   isAdmin={isAdmin}
                   onEdit={(b) => { setSelectedBook(null); setEditingBook(b); }}
                   onAddToCart={addToCart}
                   isInCart={cart.some(c => c.id === selectedBook.id)}
               />
           )}

           {(showAddBook || editingBook) && (
               <AddBookModal 
                   onClose={() => { setShowAddBook(false); setEditingBook(null); }}
                   onAdd={onAddBook}
                   initialBook={editingBook}
                   onEdit={onUpdateBook}
               />
           )}

        </DashboardLayout>
     </HashRouter>
  );
}

export default App;
