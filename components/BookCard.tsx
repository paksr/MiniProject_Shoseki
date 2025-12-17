import React, { useState, useEffect } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Pencil } from 'lucide-react-native';
import { Book, BookStatus } from '../types';

interface BookCardProps {
    book: Book;
    onStatusChange: (id: string, status: BookStatus) => void;
    onDelete: (id: string) => void;
    onEdit: (book: Book) => void;
    onClick: (book: Book) => void;
    isAdmin: boolean;
    onAddToCart?: (book: Book) => void;
    onReserve?: (book: Book) => void;
    isInCart?: boolean;
    variant?: 'portrait' | 'list';
}

const PLACEHOLDER_IMAGE = "https://images.unsplash.com/photo-1524578271613-d550eacf6090?q=80&w=600&auto=format&fit=crop";

const BookCard: React.FC<BookCardProps> = ({
    book,
    onStatusChange,
    onDelete,
    onEdit,
    onClick,
    isAdmin,
    onAddToCart,
    onReserve,
    isInCart,
    variant = 'portrait'
}) => {
    const [imgError, setImgError] = useState(false);

    useEffect(() => {
        setImgError(false);
    }, [book.coverUrl]);

    const getStatusStyle = () => {
        switch (book.status) {
            case BookStatus.Available:
                return styles.statusAvailable;
            case BookStatus.OnLoan:
                return styles.statusOnLoan;
            default:
                return styles.statusOutOfStock;
        }
    };

    const getStatusTextStyle = () => {
        switch (book.status) {
            case BookStatus.Available:
                return styles.statusTextAvailable;
            case BookStatus.OnLoan:
                return styles.statusTextOnLoan;
            default:
                return styles.statusTextOutOfStock;
        }
    };

    // --- List View ---
    if (variant === 'list') {
        return (
            <TouchableOpacity
                style={styles.listContainer}
                onPress={() => onClick(book)}
                activeOpacity={0.7}
            >
                <Image
                    source={{ uri: imgError || !book.coverUrl ? PLACEHOLDER_IMAGE : book.coverUrl }}
                    style={styles.listImage}
                    onError={() => setImgError(true)}
                />

                <View style={styles.listInfo}>
                    <Text style={styles.listTitle} numberOfLines={1}>{book.title}</Text>
                    <Text style={styles.listAuthor} numberOfLines={1}>{book.author}</Text>
                    <View style={[styles.statusBadge, getStatusStyle()]}>
                        <Text style={[styles.statusText, getStatusTextStyle()]}>{book.status}</Text>
                    </View>
                </View>

                <View style={styles.listActions}>
                    {isAdmin ? (
                        <TouchableOpacity
                            style={styles.editButton}
                            onPress={() => onEdit(book)}
                        >
                            <Pencil size={16} color="#78716c" />
                        </TouchableOpacity>
                    ) : (
                        <>
                            {book.status === BookStatus.Available ? (
                                <TouchableOpacity
                                    style={[styles.borrowButton, isInCart && styles.borrowButtonDisabled]}
                                    onPress={() => onAddToCart && onAddToCart(book)}
                                    disabled={isInCart}
                                >
                                    <Text style={[styles.borrowButtonText, isInCart && styles.borrowButtonTextDisabled]}>
                                        {isInCart ? 'Added' : 'Borrow'}
                                    </Text>
                                </TouchableOpacity>
                            ) : (
                                <View style={styles.onLoanButton}>
                                    <Text style={styles.onLoanButtonText}>On Loan</Text>
                                </View>
                            )}
                        </>
                    )}
                </View>
            </TouchableOpacity>
        );
    }

    // --- Portrait View ---
    return (
        <TouchableOpacity
            style={styles.portraitContainer}
            onPress={() => onClick(book)}
            activeOpacity={0.8}
        >
            <View style={styles.portraitImageContainer}>
                <Image
                    source={{ uri: imgError || !book.coverUrl ? PLACEHOLDER_IMAGE : book.coverUrl }}
                    style={styles.portraitImage}
                    onError={() => setImgError(true)}
                />
                {isAdmin && (
                    <TouchableOpacity
                        style={styles.portraitEditOverlay}
                        onPress={() => onEdit(book)}
                    >
                        <Pencil size={16} color="#fff" />
                    </TouchableOpacity>
                )}
            </View>

            <View style={styles.portraitInfo}>
                <Text style={styles.portraitTitle} numberOfLines={2}>{book.title}</Text>
                <Text style={styles.portraitAuthor} numberOfLines={1}>{book.author}</Text>
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    // List View Styles
    listContainer: {
        flexDirection: 'row',
        padding: 12,
        backgroundColor: '#fff',
        borderRadius: 12,
        marginBottom: 8,
        gap: 12,
        alignItems: 'center',
    },
    listImage: {
        width: 70,
        height: 105,
        borderRadius: 8,
        backgroundColor: '#e7e5e4',
    },
    listInfo: {
        flex: 1,
        justifyContent: 'center',
    },
    listTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#1c1917',
        marginBottom: 4,
    },
    listAuthor: {
        fontSize: 12,
        color: '#78716c',
        marginBottom: 8,
    },
    statusBadge: {
        alignSelf: 'flex-start',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
    },
    statusText: {
        fontSize: 10,
        fontWeight: '700',
        textTransform: 'uppercase',
    },
    statusAvailable: {
        backgroundColor: '#dcfce7',
    },
    statusTextAvailable: {
        color: '#15803d',
    },
    statusOnLoan: {
        backgroundColor: '#fef3c7',
    },
    statusTextOnLoan: {
        color: '#b45309',
    },
    statusOutOfStock: {
        backgroundColor: '#fee2e2',
    },
    statusTextOutOfStock: {
        color: '#dc2626',
    },
    listActions: {
        justifyContent: 'center',
    },
    editButton: {
        padding: 10,
        backgroundColor: '#f5f5f4',
        borderRadius: 20,
    },
    borrowButton: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        backgroundColor: '#5D4037',
        borderRadius: 20,
    },
    borrowButtonDisabled: {
        backgroundColor: '#e7e5e4',
    },
    borrowButtonText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '700',
        textTransform: 'uppercase',
    },
    borrowButtonTextDisabled: {
        color: '#a8a29e',
    },
    onLoanButton: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        backgroundColor: '#f5f5f4',
        borderRadius: 20,
    },
    onLoanButtonText: {
        color: '#a8a29e',
        fontSize: 12,
        fontWeight: '700',
        textTransform: 'uppercase',
    },

    // Portrait View Styles
    portraitContainer: {
        width: 90,
        marginRight: 12,
    },
    portraitImageContainer: {
        width: '100%',
        aspectRatio: 2 / 3,
        borderRadius: 8,
        overflow: 'hidden',
        backgroundColor: '#e7e5e4',
        marginBottom: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    portraitImage: {
        width: '100%',
        height: '100%',
    },
    portraitEditOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    portraitInfo: {
        gap: 2,
    },
    portraitTitle: {
        fontSize: 12,
        fontWeight: '700',
        color: '#1c1917',
        lineHeight: 14,
    },
    portraitAuthor: {
        fontSize: 10,
        color: '#78716c',
    },
});

export default BookCard;
