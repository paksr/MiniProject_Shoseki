import React, { useState, useEffect } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, Image,
    ScrollView, FlatList, StyleSheet, Alert, ActivityIndicator
} from 'react-native';
import {
    Library, Search, MapPin, BookOpen, CheckCircle,
    Clock, XCircle, AlertCircle, ChevronLeft
} from 'lucide-react-native';
import { Book, BookStatus, User, LoanRecord, Booking, Penalty } from '../types';
import { getLoans, getBookings, getPenalties } from '../services/storage';
import BookCard from '../components/BookCard';
import Button from '../components/Button';

// --- Discover Screen ---
export const DiscoverScreen = ({
    books, isAdmin, onBookClick, onAddToCart, onEdit, cartItems
}: {
    books: Book[], isAdmin: boolean, onBookClick: (b: Book) => void,
    onAddToCart: (b: Book) => void, onEdit: (b: Book) => void, cartItems: Book[]
}) => {
    const [search, setSearch] = useState('');
    const [activeCategory, setActiveCategory] = useState<string | null>(null);

    const genres = ['Fiction', 'Mystery', 'Sci-Fi', 'Romance', 'History', 'Non-Fiction', 'Horror'];

    const searchedBooks = books.filter(book =>
        book.title.toLowerCase().includes(search.toLowerCase()) ||
        book.author.toLowerCase().includes(search.toLowerCase())
    );

    if (activeCategory) {
        const categoryBooks = searchedBooks.filter(b => b.genre === activeCategory);
        return (
            <View style={styles.container}>
                <View style={styles.categoryHeader}>
                    <TouchableOpacity onPress={() => setActiveCategory(null)} style={styles.backButton}>
                        <ChevronLeft size={24} color="#5D4037" />
                    </TouchableOpacity>
                    <Text style={styles.categoryTitle}>{activeCategory}</Text>
                </View>
                <FlatList
                    data={categoryBooks}
                    keyExtractor={item => item.id}
                    renderItem={({ item }) => (
                        <BookCard
                            book={item} onClick={onBookClick} onEdit={onEdit}
                            onAddToCart={onAddToCart} isAdmin={isAdmin}
                            isInCart={cartItems.some(c => c.id === item.id)}
                            onStatusChange={() => { }} onDelete={() => { }} variant="list"
                        />
                    )}
                    contentContainerStyle={styles.listContent}
                />
            </View>
        );
    }

    return (
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
            <Text style={styles.headerTitle}>Discover</Text>

            <View style={styles.searchContainer}>
                <Search size={18} color="#a8a29e" style={styles.searchIcon} />
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search by title or author..."
                    placeholderTextColor="#a8a29e"
                    value={search}
                    onChangeText={setSearch}
                />
            </View>

            {!search && (
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>New Arrivals</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        {books.slice(0, 6).map(book => (
                            <BookCard
                                key={book.id} book={book} onClick={onBookClick} onEdit={onEdit}
                                onAddToCart={onAddToCart} isAdmin={isAdmin}
                                isInCart={cartItems.some(c => c.id === book.id)}
                                onStatusChange={() => { }} onDelete={() => { }} variant="portrait"
                            />
                        ))}
                    </ScrollView>
                </View>
            )}

            {genres.map(genre => {
                const genreBooks = searchedBooks.filter(b => b.genre === genre);
                if (genreBooks.length === 0) return null;
                return (
                    <View key={genre} style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>{genre}</Text>
                            <TouchableOpacity onPress={() => setActiveCategory(genre)}>
                                <Text style={styles.seeAll}>See All</Text>
                            </TouchableOpacity>
                        </View>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                            {genreBooks.slice(0, 6).map(book => (
                                <BookCard
                                    key={book.id} book={book} onClick={onBookClick} onEdit={onEdit}
                                    onAddToCart={onAddToCart} isAdmin={isAdmin}
                                    isInCart={cartItems.some(c => c.id === book.id)}
                                    onStatusChange={() => { }} onDelete={() => { }} variant="portrait"
                                />
                            ))}
                        </ScrollView>
                    </View>
                );
            })}
            <View style={{ height: 100 }} />
        </ScrollView>
    );
};

// --- Account Screen ---
export const AccountScreen = ({
    user, isAdmin, onLogout, books
}: {
    user: User, isAdmin: boolean, onLogout: () => void, books: Book[]
}) => {
    const [loans, setLoans] = useState<LoanRecord[]>([]);
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [penalties, setPenalties] = useState<Penalty[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, [user.id]);

    const loadData = async () => {
        setLoading(true);
        const l = await getLoans(user.id);
        const b = await getBookings();
        const p = await getPenalties(user.id);
        setLoans(l);
        setBookings(b.filter(bk => bk.userId === user.id));
        setPenalties(p);
        setLoading(false);
    };

    const activeLoans = loans.filter(l => l.status === 'active');
    const unpaidPenalties = penalties.filter(p => p.status === 'unpaid');

    const stats = isAdmin ? [
        { label: 'Available', value: books.filter(b => b.status === BookStatus.Available).length, color: '#10b981', Icon: CheckCircle },
        { label: 'On Loan', value: books.filter(b => b.status === BookStatus.OnLoan).length, color: '#f59e0b', Icon: Clock },
        { label: 'Out of Stock', value: books.filter(b => b.status === BookStatus.OutOfStock).length, color: '#ef4444', Icon: XCircle },
    ] : null;

    if (loading) {
        return <View style={styles.center}><ActivityIndicator size="large" color="#5D4037" /></View>;
    }

    return (
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
            <View style={styles.accountHeader}>
                <View>
                    <Text style={styles.headerTitle}>{isAdmin ? 'Admin Portal' : `Hello, ${user.name.split(' ')[0]}`}</Text>
                    <Text style={styles.headerSubtitle}>{isAdmin ? 'System Overview' : 'Your library dashboard'}</Text>
                </View>
                <TouchableOpacity onPress={onLogout} style={styles.logoutButton}>
                    <Text style={styles.logoutText}>Logout</Text>
                </TouchableOpacity>
            </View>

            {isAdmin && stats ? (
                <View style={styles.statsRow}>
                    {stats.map((stat, idx) => (
                        <View key={idx} style={styles.statCard}>
                            <stat.Icon size={20} color={stat.color} />
                            <Text style={styles.statValue}>{stat.value}</Text>
                            <Text style={styles.statLabel}>{stat.label}</Text>
                        </View>
                    ))}
                </View>
            ) : (
                <>
                    <View style={styles.statsRow}>
                        <View style={styles.statCard}>
                            <BookOpen size={18} color="#5D4037" />
                            <Text style={styles.statValue}>{activeLoans.length}</Text>
                            <Text style={styles.statLabel}>Active Loans</Text>
                        </View>
                        <View style={styles.statCard}>
                            <AlertCircle size={18} color="#ef4444" />
                            <Text style={styles.statValue}>MYR {unpaidPenalties.reduce((s, p) => s + p.amount, 0).toFixed(2)}</Text>
                            <Text style={styles.statLabel}>Penalties</Text>
                        </View>
                    </View>

                    <Text style={styles.sectionTitle}>Currently Reading</Text>
                    {activeLoans.length === 0 ? (
                        <View style={styles.emptyState}>
                            <Text style={styles.emptyText}>No books borrowed yet</Text>
                        </View>
                    ) : (
                        activeLoans.map(loan => (
                            <View key={loan.id} style={styles.loanCard}>
                                <Image source={{ uri: loan.coverUrl }} style={styles.loanImage} />
                                <View style={styles.loanInfo}>
                                    <Text style={styles.loanTitle} numberOfLines={1}>{loan.bookTitle}</Text>
                                    <Text style={styles.loanDue}>Due: {new Date(loan.dueDate).toLocaleDateString()}</Text>
                                </View>
                            </View>
                        ))
                    )}
                </>
            )}
            <View style={{ height: 100 }} />
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f5f5f4', padding: 16 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    headerTitle: { fontSize: 32, fontWeight: '700', color: '#1c1917', marginTop: 8, marginBottom: 4 },
    headerSubtitle: { fontSize: 14, color: '#78716c', marginBottom: 16 },
    searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#e7e5e4', borderRadius: 12, paddingHorizontal: 12, marginBottom: 24 },
    searchIcon: { marginRight: 8 },
    searchInput: { flex: 1, paddingVertical: 12, fontSize: 16, color: '#1c1917' },
    section: { marginBottom: 24 },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, borderBottomWidth: 1, borderBottomColor: '#e7e5e4', paddingBottom: 8 },
    sectionTitle: { fontSize: 20, fontWeight: '700', color: '#1c1917' },
    seeAll: { fontSize: 12, fontWeight: '700', color: '#5D4037', textTransform: 'uppercase' },
    categoryHeader: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, gap: 8 },
    backButton: { padding: 4 },
    categoryTitle: { fontSize: 28, fontWeight: '700', color: '#1c1917' },
    listContent: { paddingBottom: 100 },
    accountHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, marginTop: 8 },
    logoutButton: { backgroundColor: '#fee2e2', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
    logoutText: { color: '#dc2626', fontWeight: '600', fontSize: 12 },
    statsRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
    statCard: { flex: 1, backgroundColor: '#fff', padding: 16, borderRadius: 16, alignItems: 'center', gap: 4 },
    statValue: { fontSize: 24, fontWeight: '700', color: '#1c1917' },
    statLabel: { fontSize: 10, fontWeight: '700', color: '#78716c', textTransform: 'uppercase' },
    emptyState: { padding: 32, backgroundColor: '#fff', borderRadius: 16, alignItems: 'center', borderWidth: 2, borderStyle: 'dashed', borderColor: '#e7e5e4' },
    emptyText: { color: '#a8a29e' },
    loanCard: { flexDirection: 'row', backgroundColor: '#fff', padding: 12, borderRadius: 12, marginBottom: 8, gap: 12 },
    loanImage: { width: 48, height: 64, borderRadius: 6, backgroundColor: '#e7e5e4' },
    loanInfo: { flex: 1, justifyContent: 'center' },
    loanTitle: { fontSize: 14, fontWeight: '700', color: '#1c1917', marginBottom: 4 },
    loanDue: { fontSize: 12, color: '#78716c' },
});
