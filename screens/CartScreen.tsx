import React from 'react';
import {
    View,
    Text,
    Image,
    ScrollView,
    TouchableOpacity,
    StyleSheet,
    Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ShoppingBag, Trash2, ArrowLeft, Clock, X } from 'lucide-react-native';
import { Book, Reservation } from '../types';
import Button from '../components/Button';

interface CartScreenProps {
    cart: Book[];
    reservations: Reservation[];
    onRemoveFromCart: (bookId: string) => void;
    onCancelReservation: (reservationId: string) => void;
    onCheckout: () => void;
    onClose: () => void;
}

const PLACEHOLDER_IMAGE = "https://images.unsplash.com/photo-1524578271613-d550eacf6090?q=80&w=600&auto=format&fit=crop";

const CartScreen: React.FC<CartScreenProps> = ({
    cart,
    reservations,
    onRemoveFromCart,
    onCancelReservation,
    onCheckout,
    onClose
}) => {

    const handleCancelReservation = (reservationId: string) => {
        Alert.alert('Cancel Reservation', 'Are you sure you want to cancel this reservation?', [
            { text: 'No', style: 'cancel' },
            { text: 'Yes', style: 'destructive', onPress: () => onCancelReservation(reservationId) }
        ]);
    };

    const totalItems = cart.length + reservations.length;

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={onClose} style={styles.backButton}>
                    <ArrowLeft size={24} color="#1c1917" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>My Cart</Text>
                <View style={styles.cartBadge}>
                    <Text style={styles.cartBadgeText}>{totalItems}</Text>
                </View>
            </View>

            {/* Cart Content */}
            {totalItems === 0 ? (
                <View style={styles.emptyState}>
                    <ShoppingBag size={64} color="#d6d3d1" />
                    <Text style={styles.emptyTitle}>Your cart is empty</Text>
                    <Text style={styles.emptySubtitle}>Add books to borrow or reserve from the Discover tab</Text>
                    <Button onPress={onClose} style={{ marginTop: 16 }}>
                        Browse Books
                    </Button>
                </View>
            ) : (
                <>
                    <ScrollView style={styles.cartList} showsVerticalScrollIndicator={false}>
                        {/* Borrowing Section */}
                        {cart.length > 0 && (
                            <View style={styles.section}>
                                <View style={styles.sectionHeader}>
                                    <ShoppingBag size={18} color="#5D4037" />
                                    <Text style={styles.sectionTitle}>Books to Borrow</Text>
                                    <View style={styles.sectionBadge}>
                                        <Text style={styles.sectionBadgeText}>{cart.length}</Text>
                                    </View>
                                </View>
                                {cart.map((book) => (
                                    <View key={book.id} style={styles.cartItem}>
                                        <Image
                                            source={{ uri: book.coverUrl || PLACEHOLDER_IMAGE }}
                                            style={styles.bookImage}
                                        />
                                        <View style={styles.bookInfo}>
                                            <Text style={styles.bookTitle} numberOfLines={2}>{book.title}</Text>
                                            <Text style={styles.bookAuthor} numberOfLines={1}>{book.author}</Text>
                                            <View style={styles.statusBadge}>
                                                <Text style={styles.statusText}>Available</Text>
                                            </View>
                                        </View>
                                        <TouchableOpacity
                                            style={styles.removeButton}
                                            onPress={() => onRemoveFromCart(book.id)}
                                        >
                                            <Trash2 size={18} color="#ef4444" />
                                        </TouchableOpacity>
                                    </View>
                                ))}
                            </View>
                        )}

                        {/* Reservations Section */}
                        {reservations.length > 0 && (
                            <View style={styles.section}>
                                <View style={styles.sectionHeader}>
                                    <Clock size={18} color="#f59e0b" />
                                    <Text style={styles.sectionTitle}>Reserved Books</Text>
                                    <View style={[styles.sectionBadge, styles.reservationBadge]}>
                                        <Text style={[styles.sectionBadgeText, styles.reservationBadgeText]}>{reservations.length}</Text>
                                    </View>
                                </View>
                                <Text style={styles.reservationNote}>
                                    You'll be notified when these books are available
                                </Text>
                                {reservations.map((reservation) => (
                                    <View key={reservation.id} style={styles.cartItem}>
                                        <Image
                                            source={{ uri: reservation.coverUrl || PLACEHOLDER_IMAGE }}
                                            style={styles.bookImage}
                                        />
                                        <View style={styles.bookInfo}>
                                            <Text style={styles.bookTitle} numberOfLines={2}>{reservation.bookTitle}</Text>
                                            <Text style={styles.bookAuthor} numberOfLines={1}>{reservation.bookAuthor}</Text>
                                            <View style={styles.reservedStatusBadge}>
                                                <Text style={styles.reservedStatusText}>On Loan</Text>
                                            </View>
                                        </View>
                                        <TouchableOpacity
                                            style={styles.removeButton}
                                            onPress={() => handleCancelReservation(reservation.id)}
                                        >
                                            <Trash2 size={18} color="#ef4444" />
                                        </TouchableOpacity>
                                    </View>
                                ))}
                            </View>
                        )}

                        <View style={{ height: 160 }} />
                    </ScrollView>

                    {/* Checkout Footer - Only show if there are items to borrow */}
                    {cart.length > 0 && (
                        <View style={styles.footer}>
                            <View style={styles.summaryRow}>
                                <Text style={styles.summaryLabel}>Books to borrow</Text>
                                <Text style={styles.summaryValue}>{cart.length}</Text>
                            </View>
                            <View style={styles.summaryRow}>
                                <Text style={styles.summaryLabel}>Loan duration</Text>
                                <Text style={styles.summaryValue}>14 days</Text>
                            </View>
                            <Button onPress={onCheckout} style={styles.checkoutButton}>
                                <ShoppingBag size={18} color="#fff" />
                                <Text style={styles.checkoutText}>Confirm Borrow Request</Text>
                            </Button>
                        </View>
                    )}
                </>
            )}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f4',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 16,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#e7e5e4',
    },
    backButton: {
        padding: 4,
        marginRight: 12,
    },
    headerTitle: {
        flex: 1,
        fontSize: 20,
        fontWeight: '700',
        color: '#1c1917',
    },
    cartBadge: {
        backgroundColor: '#5D4037',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 16,
    },
    cartBadgeText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '700',
    },
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 32,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1c1917',
        marginTop: 16,
    },
    emptySubtitle: {
        fontSize: 14,
        color: '#78716c',
        textAlign: 'center',
        marginTop: 8,
    },
    cartList: {
        flex: 1,
        padding: 16,
    },
    section: {
        marginBottom: 24,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 12,
    },
    sectionTitle: {
        flex: 1,
        fontSize: 16,
        fontWeight: '700',
        color: '#1c1917',
    },
    sectionBadge: {
        backgroundColor: '#5D4037',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    sectionBadgeText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '700',
    },
    reservationBadge: {
        backgroundColor: '#f59e0b',
    },
    reservationBadgeText: {
        color: '#fff',
    },
    reservationNote: {
        fontSize: 12,
        color: '#78716c',
        fontStyle: 'italic',
        marginBottom: 12,
    },
    cartItem: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 12,
        marginBottom: 12,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    bookImage: {
        width: 60,
        height: 90,
        borderRadius: 8,
        backgroundColor: '#e7e5e4',
    },
    bookInfo: {
        flex: 1,
        marginLeft: 12,
        justifyContent: 'center',
    },
    bookTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#1c1917',
        marginBottom: 4,
    },
    bookAuthor: {
        fontSize: 12,
        color: '#78716c',
        marginBottom: 6,
    },
    statusBadge: {
        alignSelf: 'flex-start',
        backgroundColor: '#dcfce7',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 6,
    },
    statusText: {
        fontSize: 10,
        fontWeight: '600',
        color: '#15803d',
        textTransform: 'uppercase',
    },
    reservedStatusBadge: {
        alignSelf: 'flex-start',
        backgroundColor: '#fef3c7',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 6,
    },
    reservedStatusText: {
        fontSize: 10,
        fontWeight: '600',
        color: '#b45309',
        textTransform: 'uppercase',
    },
    removeButton: {
        padding: 12,
        backgroundColor: '#fee2e2',
        borderRadius: 12,
    },
    reservationItem: {
        flexDirection: 'row',
        backgroundColor: '#fffbeb',
        borderRadius: 12,
        padding: 12,
        marginBottom: 8,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#fde68a',
    },
    reservationInfo: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    reservationIcon: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#fef3c7',
        justifyContent: 'center',
        alignItems: 'center',
    },
    reservationTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#1c1917',
        marginBottom: 2,
    },
    reservationDate: {
        fontSize: 12,
        color: '#92400e',
    },
    cancelButton: {
        padding: 10,
        backgroundColor: '#fee2e2',
        borderRadius: 20,
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#fff',
        padding: 16,
        paddingBottom: 32,
        borderTopWidth: 1,
        borderTopColor: '#e7e5e4',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 8,
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    summaryLabel: {
        fontSize: 14,
        color: '#78716c',
    },
    summaryValue: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1c1917',
    },
    checkoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        marginTop: 12,
    },
    checkoutText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
});

export default CartScreen;
