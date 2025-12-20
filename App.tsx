import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator, TouchableOpacity, Text, Alert } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Library, Search, CalendarDays, User as UserIcon } from 'lucide-react-native';


import { getActiveUser, setActiveUser, getBooks, addBook, updateBookDetails, deleteBook, borrowBooks, reserveBook, getReservations, cancelReservation, getPenalties, getLoans } from './services/supabaseStorage';
// import { borrowBooks, reserveBook, getReservations, cancelReservation } from './services/storage'; // Removed local storage
import { User, Book, BookStatus, Reservation } from './types';
import LoginScreen from './screens/LoginScreen';
import { DiscoverScreen, AccountScreen } from './screens/MainScreens';
import FloorPlanScreen from './screens/FloorPlanScreen';
import FacilitiesScreen from './screens/FacilitiesScreen';
import CartScreen from './screens/CartScreen';
import BookCard from './components/BookCard';
import BookDetailsModal from './components/BookDetailsModal';
import AddBookModal from './components/AddBookModal';
import AILibrarian from './components/AILibrarian';

const Stack = createNativeStackNavigator();

// Tab Navigation Component
const TabBar = ({ currentTab, onTabChange }: { currentTab: string, onTabChange: (t: string) => void }) => {
    const tabs = [
        { id: 'discover', icon: Library, label: 'Discover' },
        { id: 'search', icon: Search, label: 'Search' },
        { id: 'facilities', icon: CalendarDays, label: 'Facilities' },
        { id: 'account', icon: UserIcon, label: 'Account' },
    ];

    return (
        <View style={styles.tabBar}>
            {tabs.map(tab => {
                const isActive = currentTab === tab.id;
                return (
                    <TouchableOpacity
                        key={tab.id}
                        style={[styles.tab, isActive && styles.tabActive]}
                        onPress={() => onTabChange(tab.id)}
                    >
                        <tab.icon size={20} color={isActive ? '#5D4037' : '#a8a29e'} strokeWidth={isActive ? 2.5 : 2} />
                    </TouchableOpacity>
                );
            })}
        </View>
    );
};

// Main App Content (After Login)
const MainApp = ({ user, onLogout, onUserUpdate }: { user: User, onLogout: () => void, onUserUpdate: (u: User) => void }) => {
    const [currentTab, setCurrentTab] = useState('discover');
    const [books, setBooks] = useState<Book[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedBook, setSelectedBook] = useState<Book | null>(null);
    const [editBook, setEditBook] = useState<Book | null>(null);
    const [showAddModal, setShowAddModal] = useState(false);
    const [cart, setCart] = useState<Book[]>([]);
    const [reservations, setReservations] = useState<Reservation[]>([]);
    const [showCart, setShowCart] = useState(false);

    const isAdmin = user.role === 'admin';

    useEffect(() => {
        const interval = setInterval(() => {
            refreshBooks(); // Silent refresh
        }, 5000);

        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        loadBooks();
        loadReservations();
    }, [currentTab]);

    const loadBooks = async () => {
        setLoading(true);
        const b = await getBooks();
        setBooks(b);
        setLoading(false);
    };

    const refreshBooks = async () => {
        const b = await getBooks();
        setBooks(b);
    };

    const loadReservations = async () => {
        const r = await getReservations();
        setReservations(r.filter(res => res.userId === user.id && res.status === 'active'));
    };

    const handleAddToCart = (book: Book) => {
        if (!cart.find(c => c.id === book.id)) {
            setCart([...cart, book]);
        }
    };

    const handleRemoveFromCart = (bookId: string) => {
        setCart(cart.filter(c => c.id !== bookId));
    };

    const handleCheckout = async () => {
        // Check for penalties first
        const p = await getPenalties(user.id);
        const hasUnpaid = p.some(penalty => penalty.status === 'unpaid');

        if (hasUnpaid) {
            Alert.alert(
                "Restricted",
                "You have unpaid penalties. Please go to the Account section to pay them before borrowing new books."
            );
            return;
        }

        await borrowBooks(user.id, cart.map(c => c.id));
        Alert.alert('Success', 'Books borrowed successfully!');
        setCart([]);
        setShowCart(false);
        loadBooks();
    };

    const handleReserve = async (book: Book) => {
        // Check if user is already borrowing this book
        const loans = await getLoans(user.id);
        const isBorrowing = loans.some(loan => loan.bookId === book.id && loan.status === 'active');

        if (isBorrowing) {
            Alert.alert("Action Restricted", "You cannot reserve a book that you are currently borrowing.");
            return;
        }

        await reserveBook(user.id, book.id, book.title, book.author, book.coverUrl);
        loadReservations();
    };

    const handleCancelReservation = async (reservationId: string) => {
        await cancelReservation(reservationId);
        loadReservations();
    };

    const handleAddBook = async (bookData: Omit<Book, 'id' | 'addedAt'>) => {
        await addBook(bookData);
        loadBooks();
    };

    const handleEditBook = async (book: Book) => {
        await updateBookDetails(book);
        loadBooks();
        setEditBook(null);
    };

    const handleDeleteBook = async (bookId: string) => {
        await deleteBook(bookId);
        loadBooks();
        setSelectedBook(null);
    };

    // Automated Reservation Handling
    useEffect(() => {
        if (loading || books.length === 0 || reservations.length === 0) return;

        const processReservations = async () => {
            // Find reservations for books that are now Available
            const availableReservations = reservations.filter(res => {
                const book = books.find(b => b.id === res.bookId);
                return book && book.status === 'Available';
            });

            if (availableReservations.length > 0) {
                const newCartItems: Book[] = [];
                const processedReservationIds: string[] = [];

                for (const res of availableReservations) {
                    // Prevent duplicate processing if already in cart (though cart state might lag, logic is safe-ish)
                    if (cart.find(c => c.id === res.bookId)) continue;

                    const book = books.find(b => b.id === res.bookId);
                    if (book) {
                        newCartItems.push(book);
                        processedReservationIds.push(res.id);

                        // Cancel reservation on server
                        // We don't await this one-by-one to block UI, but we should ensure it happens
                        cancelReservation(res.id).catch(e => console.error("Auto-cancel failed", e));
                    }
                }

                if (newCartItems.length > 0) {
                    // 1. Update Cart
                    setCart(prev => [...prev, ...newCartItems]);

                    // 2. Remove from local reservations to update UI immediately
                    setReservations(prev => prev.filter(r => !processedReservationIds.includes(r.id)));

                    // 3. Notify User
                    const bookTitles = newCartItems.map(b => b.title).join(', ');
                    Alert.alert(
                        "Book Available!",
                        `Good news! The following reserved books are now available and have been moved to your cart:\n\n${bookTitles}`
                    );
                }
            }
        };

        processReservations();
    }, [books, reservations]); // Run whenever books refresh or reservations load

    if (loading) {
        return <View style={styles.center}><ActivityIndicator size="large" color="#5D4037" /></View>;
    }

    const renderContent = () => {
        switch (currentTab) {
            case 'discover':
                return (
                    <DiscoverScreen
                        books={books} isAdmin={isAdmin}
                        onBookClick={setSelectedBook} onAddToCart={handleAddToCart}
                        onEdit={setEditBook} cartItems={cart}
                        onAddBookPress={() => setShowAddModal(true)}
                    />
                );
            case 'account':
                return <AccountScreen user={user} isAdmin={isAdmin} onLogout={onLogout} books={books} onUserUpdate={onUserUpdate} />;
            case 'search':
                return (
                    <FloorPlanScreen
                        books={books}
                        onBookClick={setSelectedBook}
                    />
                );
            case 'facilities':
                return <FacilitiesScreen user={user} />;
            default:
                return null;
        }
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {renderContent()}

            <TabBar currentTab={currentTab} onTabChange={setCurrentTab} />

            <AILibrarian />

            {selectedBook && (
                <BookDetailsModal
                    book={selectedBook} onClose={() => setSelectedBook(null)}
                    isAdmin={isAdmin} currentUserId={user.id} onAddToCart={handleAddToCart}
                    onReserve={handleReserve}
                    onEdit={setEditBook} isInCart={cart.some(c => c.id === selectedBook.id)}
                    isReserved={reservations.some(r => r.bookId === selectedBook.id)}
                    onDelete={handleDeleteBook}
                />
            )}

            {(showAddModal || editBook) && (
                <AddBookModal
                    onClose={() => { setShowAddModal(false); setEditBook(null); }}
                    onAdd={handleAddBook} onEdit={handleEditBook}
                    initialBook={editBook}
                />
            )}

            {(cart.length > 0 || reservations.length > 0) && !isAdmin && (
                <TouchableOpacity style={styles.cartBadge} onPress={() => setShowCart(true)}>
                    <Text style={styles.cartText}>View Cart ({cart.length + reservations.length})</Text>
                </TouchableOpacity>
            )}

            {showCart && (
                <View style={styles.cartOverlay}>
                    <CartScreen
                        cart={cart}
                        reservations={reservations}
                        onRemoveFromCart={handleRemoveFromCart}
                        onCancelReservation={handleCancelReservation}
                        onCheckout={handleCheckout}
                        onClose={() => setShowCart(false)}
                    />
                </View>
            )}
        </SafeAreaView>
    );
};

// Root App Component
export default function App() {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        checkAuth();
    }, []);

    const checkAuth = async () => {
        const u = await getActiveUser();
        setUser(u);
        setLoading(false);
    };

    const handleLogin = (u: User) => setUser(u);

    const handleLogout = async () => {
        await setActiveUser(null);
        setUser(null);
    };

    if (loading) {
        return (
            <SafeAreaProvider>
                <View style={styles.center}><ActivityIndicator size="large" color="#5D4037" /></View>
            </SafeAreaProvider>
        );
    }

    return (
        <SafeAreaProvider>
            <StatusBar style="dark" />
            {user ? (
                <MainApp user={user} onLogout={handleLogout} onUserUpdate={setUser} />
            ) : (
                <LoginScreen onLogin={handleLogin} />
            )}
        </SafeAreaProvider>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f5f5f4' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f5f5f4' },
    tabBar: { flexDirection: 'row', backgroundColor: '#fff', paddingVertical: 8, paddingHorizontal: 8, marginHorizontal: 16, marginBottom: 24, borderRadius: 32, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 8 },
    tab: { flex: 1, alignItems: 'center', paddingVertical: 12, borderRadius: 24 },
    tabActive: { backgroundColor: '#f5f5f4' },
    placeholder: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 16 },
    placeholderText: { fontSize: 16, color: '#a8a29e' },
    cartBadge: { position: 'absolute', bottom: 100, left: 16, right: 16, backgroundColor: '#5D4037', padding: 16, borderRadius: 16, alignItems: 'center' },
    cartText: { color: '#fff', fontSize: 16, fontWeight: '700' },
    cartOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#f5f5f4', zIndex: 100 },
});
