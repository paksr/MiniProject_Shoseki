import React, { useState, useEffect } from 'react';
import { View, Text, Modal, StyleSheet, TouchableOpacity, FlatList, TextInput, Image } from 'react-native';
import { Book, BookStatus } from '../types';
import { X, Search } from 'lucide-react-native';

interface AvailableBooksModalProps {
    visible: boolean;
    onClose: () => void;
    books: Book[];
}

const AvailableBooksModal: React.FC<AvailableBooksModalProps> = ({ visible, onClose, books }) => {
    const [filteredBooks, setFilteredBooks] = useState<Book[]>([]);
    const [search, setSearch] = useState('');

    useEffect(() => {
        const available = books.filter(b => b.status === BookStatus.Available);
        if (search) {
            setFilteredBooks(available.filter(b =>
                b.title.toLowerCase().includes(search.toLowerCase()) ||
                b.author.toLowerCase().includes(search.toLowerCase())
            ));
        } else {
            setFilteredBooks(available);
        }
    }, [visible, books, search]);

    return (
        <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
            <View style={styles.container}>
                <View style={styles.header}>
                    <Text style={styles.title}>Available Books</Text>
                    <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                        <X size={24} color="#1c1917" />
                    </TouchableOpacity>
                </View>

                <View style={styles.searchContainer}>
                    <Search size={20} color="#a8a29e" />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search title or author..."
                        value={search}
                        onChangeText={setSearch}
                    />
                </View>

                <FlatList
                    data={filteredBooks}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.list}
                    renderItem={({ item }) => (
                        <View style={styles.card}>
                            <Image source={{ uri: item.coverUrl }} style={styles.cover} />
                            <View style={styles.info}>
                                <Text style={styles.bookTitle} numberOfLines={2}>{item.title}</Text>
                                <Text style={styles.author}>{item.author}</Text>
                                <View style={styles.badge}>
                                    <Text style={styles.badgeText}>Available</Text>
                                </View>
                            </View>
                        </View>
                    )}
                    ListEmptyComponent={
                        <View style={styles.empty}>
                            <Text style={styles.emptyText}>No available books found.</Text>
                        </View>
                    }
                />
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f5f5f4', paddingTop: 20 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20 },
    title: { fontSize: 24, fontWeight: '700', color: '#1c1917' },
    closeButton: { padding: 4 },
    searchContainer: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 20, marginBottom: 10, backgroundColor: '#fff', padding: 10, borderRadius: 12 },
    searchInput: { flex: 1, marginLeft: 10, fontSize: 16 },
    list: { paddingHorizontal: 20, paddingBottom: 40 },
    card: { flexDirection: 'row', backgroundColor: '#fff', padding: 12, borderRadius: 12, marginBottom: 12, alignItems: 'center', gap: 12 },
    cover: { width: 50, height: 75, borderRadius: 6, backgroundColor: '#e7e5e4' },
    info: { flex: 1 },
    bookTitle: { fontSize: 16, fontWeight: '700', color: '#1c1917', marginBottom: 2 },
    author: { fontSize: 14, color: '#78716c', marginBottom: 6 },
    badge: { alignSelf: 'flex-start', backgroundColor: '#dcfce7', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12 },
    badgeText: { fontSize: 10, fontWeight: '700', color: '#16a34a', textTransform: 'uppercase' },
    empty: { alignItems: 'center', marginTop: 40 },
    emptyText: { color: '#a8a29e' },
});

export default AvailableBooksModal;
