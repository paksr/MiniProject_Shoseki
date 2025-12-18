import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator, TouchableOpacity, Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Library, Search, CalendarDays, User as UserIcon } from 'lucide-react-native';

import { User, Book, BookStatus } from './types';
import { getActiveUser, setActiveUser, getBooks, addBook, updateBookDetails, deleteBook, borrowBooks } from './services/storage';
import LoginScreen from './screens/LoginScreen';
import { DiscoverScreen, AccountScreen } from './screens/MainScreens';
import FloorPlanScreen from './screens/FloorPlanScreen';
import FacilitiesScreen from './screens/FacilitiesScreen';
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

    const isAdmin = user.role === 'admin';

    useEffect(() => {
        loadBooks();
    }, []);

    const loadBooks = async () => {
        setLoading(true);
        const b = await getBooks();
        setBooks(b);
        setLoading(false);
    };

    const handleAddToCart = (book: Book) => {
        if (!cart.find(c => c.id === book.id)) {
            setCart([...cart, book]);
        }
    };

    const handleCheckout = async () => {
        await borrowBooks(user.id, cart.map(c => c.id));
        setCart([]);
        loadBooks();
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
                    isAdmin={isAdmin} onAddToCart={handleAddToCart}
                    onEdit={setEditBook} isInCart={cart.some(c => c.id === selectedBook.id)}
                />
            )}

            {(showAddModal || editBook) && (
                <AddBookModal
                    onClose={() => { setShowAddModal(false); setEditBook(null); }}
                    onAdd={handleAddBook} onEdit={handleEditBook}
                    initialBook={editBook}
                />
            )}

            {cart.length > 0 && !isAdmin && (
                <TouchableOpacity style={styles.cartBadge} onPress={handleCheckout}>
                    <Text style={styles.cartText}>Checkout ({cart.length})</Text>
                </TouchableOpacity>
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
});
