import React, { useState } from 'react';
import {
    View,
    Text,
    Image,
    Modal,
    TouchableOpacity,
    ScrollView,
    StyleSheet,
    Dimensions,
    Alert
} from 'react-native';
import { X, BookOpen, MapPin, Hash, Layers, ShoppingBag, Pencil, Trash2, Clock } from 'lucide-react-native';
import { Book, BookStatus } from '../types';
import Button from './Button';

interface BookDetailsModalProps {
    book: Book;
    onClose: () => void;
    isAdmin: boolean;
    onAddToCart?: (book: Book) => void;
    onReserve?: (book: Book) => void;
    onEdit?: (book: Book) => void;
    onDelete?: (id: string) => void;
    isInCart?: boolean;
    isReserved?: boolean;
}

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const PLACEHOLDER_IMAGE = "https://images.unsplash.com/photo-1524578271613-d550eacf6090?q=80&w=600&auto=format&fit=crop";

const BookDetailsModal: React.FC<BookDetailsModalProps> = ({
    book, onClose, isAdmin, onAddToCart, onReserve, onEdit, onDelete, isInCart, isReserved
}) => {
    const [imgError, setImgError] = useState(false);

    const handleDelete = () => {
        Alert.alert(
            "Delete Book",
            "Are you sure you want to delete this book? This action cannot be undone.",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: () => onDelete && onDelete(book.id)
                }
            ]
        );
    };

    const getStatusStyle = () => {
        switch (book.status) {
            case BookStatus.Available:
                return { bg: '#22c55e', text: '#fff' };
            case BookStatus.OnLoan:
                return { bg: '#f59e0b', text: '#fff' };
            default:
                return { bg: '#ef4444', text: '#fff' };
        }
    };

    const statusStyle = getStatusStyle();

    return (
        <Modal
            visible={true}
            animationType="slide"
            transparent={true}
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <View style={styles.container}>
                    {/* Close Button */}
                    <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                        <X size={20} color="#fff" />
                    </TouchableOpacity>

                    {/* Hero Image */}
                    <View style={styles.heroContainer}>
                        <View style={styles.gradient} />
                        <Image
                            source={{ uri: imgError || !book.coverUrl ? PLACEHOLDER_IMAGE : book.coverUrl }}
                            style={styles.heroImage}
                            onError={() => setImgError(true)}
                        />

                        <View style={styles.heroOverlay}>
                            <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
                                <Text style={[styles.statusText, { color: statusStyle.text }]}>{book.status}</Text>
                            </View>
                            <Text style={styles.heroTitle}>{book.title}</Text>
                            <Text style={styles.heroAuthor}>{book.author}</Text>
                        </View>
                    </View>

                    {/* Content */}
                    <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                        {/* Synopsis */}
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Synopsis</Text>
                            <Text style={styles.description}>
                                {book.description || "No description available for this book."}
                            </Text>
                        </View>

                        {/* Info Grid */}
                        <View style={styles.infoGrid}>
                            <View style={styles.infoCard}>
                                <View style={styles.infoHeader}>
                                    <Layers size={14} color="#a8a29e" />
                                    <Text style={styles.infoLabel}>Genre</Text>
                                </View>
                                <Text style={styles.infoValue}>{book.genre}</Text>
                            </View>
                            <View style={styles.infoCard}>
                                <View style={styles.infoHeader}>
                                    <BookOpen size={14} color="#a8a29e" />
                                    <Text style={styles.infoLabel}>Pages</Text>
                                </View>
                                <Text style={styles.infoValue}>{book.pages}</Text>
                            </View>
                            <View style={styles.infoCard}>
                                <View style={styles.infoHeader}>
                                    <MapPin size={14} color="#a8a29e" />
                                    <Text style={styles.infoLabel}>Location</Text>
                                </View>
                                <Text style={styles.infoValue}>{book.location || 'N/A'}</Text>
                            </View>
                            <View style={styles.infoCard}>
                                <View style={styles.infoHeader}>
                                    <Hash size={14} color="#a8a29e" />
                                    <Text style={styles.infoLabel}>ISBN</Text>
                                </View>
                                <Text style={styles.infoValue} numberOfLines={1}>{book.isbn || 'N/A'}</Text>
                            </View>
                        </View>

                        {/* Rating */}
                        <View style={styles.ratingCard}>
                            <View>
                                <Text style={styles.ratingLabel}>Community Rating</Text>
                                <View style={styles.stars}>
                                    {[1, 2, 3, 4, 5].map(star => (
                                        <Text key={star} style={[
                                            styles.star,
                                            star <= (book.rating || 0) ? styles.starFilled : styles.starEmpty
                                        ]}>★</Text>
                                    ))}
                                </View>
                            </View>
                            <Text style={styles.ratingValue}>
                                {book.rating || 0}<Text style={styles.ratingMax}>/5</Text>
                            </Text>
                        </View>

                        <View style={{ height: 20 }} />
                    </ScrollView>

                    {/* Footer */}
                    <View style={styles.footer}>
                        {isAdmin ? (
                            <View style={{ flexDirection: 'row', gap: 12 }}>
                                <Button
                                    variant="ghost"
                                    onPress={handleDelete}
                                    style={styles.deleteButton}
                                >
                                    <Trash2 size={20} color="#ef4444" />
                                </Button>
                                <Button
                                    onPress={() => { onClose(); onEdit && onEdit(book); }}
                                    style={{ flex: 1, flexDirection: 'row', gap: 8 }}
                                >
                                    <Pencil size={18} color="#fff" />
                                    <Text style={styles.footerButtonText}>Edit Book</Text>
                                </Button>
                            </View>
                        ) : (
                            <>
                                {book.status === BookStatus.Available ? (
                                    <Button
                                        onPress={() => { onAddToCart && onAddToCart(book); onClose(); }}
                                        disabled={isInCart}
                                        style={[styles.footerButton, isInCart && styles.footerButtonDisabled]}
                                    >
                                        <ShoppingBag size={18} color={isInCart ? '#a8a29e' : '#fff'} />
                                        <Text style={[styles.footerButtonText, isInCart && styles.footerButtonTextDisabled]}>
                                            {isInCart ? 'In Cart' : 'Borrow Book'}
                                        </Text>
                                    </Button>
                                ) : book.status === BookStatus.OnLoan ? (
                                    <Button
                                        onPress={() => { onReserve && onReserve(book); onClose(); }}
                                        disabled={isReserved}
                                        style={[styles.footerButton, styles.reserveButton, isReserved && styles.footerButtonDisabled]}
                                    >
                                        <Clock size={18} color={isReserved ? '#a8a29e' : '#fff'} />
                                        <Text style={[styles.footerButtonText, isReserved && styles.footerButtonTextDisabled]}>
                                            {isReserved ? 'Already Reserved' : 'Reserve Book'}
                                        </Text>
                                    </Button>
                                ) : (
                                    <View style={[styles.footerButton, styles.footerButtonDisabled]}>
                                        <Text style={styles.footerButtonTextDisabled}>Not Available</Text>
                                    </View>
                                )}
                            </>
                        )}
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    container: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        height: SCREEN_HEIGHT * 0.85,
        overflow: 'hidden',
    },
    closeButton: {
        position: 'absolute',
        top: 16,
        right: 16,
        zIndex: 20,
        padding: 8,
        backgroundColor: 'rgba(0,0,0,0.3)',
        borderRadius: 20,
    },
    heroContainer: {
        height: '35%',
        backgroundColor: '#e7e5e4',
    },
    heroImage: {
        width: '100%',
        height: '100%',
    },
    gradient: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: '60%',
        backgroundColor: 'rgba(0,0,0,0.5)',
        zIndex: 10,
    },
    heroOverlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 20,
        zIndex: 15,
    },
    statusBadge: {
        alignSelf: 'flex-start',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        marginBottom: 8,
    },
    statusText: {
        fontSize: 10,
        fontWeight: '700',
        textTransform: 'uppercase',
    },
    heroTitle: {
        fontSize: 24,
        fontWeight: '700',
        color: '#fff',
        marginBottom: 4,
    },
    heroAuthor: {
        fontSize: 16,
        color: '#e7e5e4',
    },
    content: {
        flex: 1,
        padding: 20,
    },
    section: {
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1c1917',
        marginBottom: 8,
    },
    description: {
        fontSize: 14,
        color: '#57534e',
        lineHeight: 22,
    },
    infoGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        marginBottom: 20,
    },
    infoCard: {
        width: '47%',
        padding: 16,
        backgroundColor: '#fafaf9',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#f5f5f4',
    },
    infoHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 4,
    },
    infoLabel: {
        fontSize: 10,
        fontWeight: '700',
        color: '#a8a29e',
        textTransform: 'uppercase',
    },
    infoValue: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1c1917',
    },
    ratingCard: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        backgroundColor: '#fef3c7',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#fde68a',
    },
    ratingLabel: {
        fontSize: 12,
        fontWeight: '700',
        color: '#92400e',
        textTransform: 'uppercase',
        marginBottom: 4,
    },
    stars: {
        flexDirection: 'row',
    },
    star: {
        fontSize: 16,
    },
    starFilled: {
        color: '#f59e0b',
    },
    starEmpty: {
        color: '#d6d3d1',
    },
    ratingValue: {
        fontSize: 28,
        fontWeight: '700',
        color: '#d97706',
    },
    ratingMax: {
        fontSize: 16,
        color: '#f59e0b',
    },
    footer: {
        padding: 16,
        borderTopWidth: 1,
        borderTopColor: '#f5f5f4',
        paddingBottom: 32,
    },
    footerButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: '#5D4037',
        paddingVertical: 16,
        borderRadius: 16,
    },
    footerButtonDisabled: {
        backgroundColor: '#e7e5e4',
    },
    footerButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    footerButtonTextDisabled: {
        color: '#a8a29e',
    },
    deleteButton: {
        width: 50,
        height: 50,
        borderRadius: 16,
        backgroundColor: '#fee2e2',
        justifyContent: 'center',
        alignItems: 'center',
    },
    reserveButton: {
        backgroundColor: '#f59e0b',
    },
});

export default BookDetailsModal;
