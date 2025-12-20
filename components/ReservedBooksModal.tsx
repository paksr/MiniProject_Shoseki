import React, { useState, useEffect } from 'react';
import { View, Text, Modal, StyleSheet, TouchableOpacity, FlatList, TextInput } from 'react-native';
import { Reservation } from '../types';
import { getReservations } from '../services/supabaseStorage';
import { X, Search } from 'lucide-react-native';

interface ReservedBooksModalProps {
    visible: boolean;
    onClose: () => void;
}

const ReservedBooksModal: React.FC<ReservedBooksModalProps> = ({ visible, onClose }) => {
    const [reservations, setReservations] = useState<Reservation[]>([]);
    const [filteredReservations, setFilteredReservations] = useState<Reservation[]>([]);
    const [search, setSearch] = useState('');

    useEffect(() => {
        if (visible) {
            loadReservations();
        }
    }, [visible]);

    useEffect(() => {
        if (search) {
            setFilteredReservations(reservations.filter(r =>
                r.bookTitle.toLowerCase().includes(search.toLowerCase()) ||
                r.userName?.toLowerCase().includes(search.toLowerCase()) ||
                r.userId.toLowerCase().includes(search.toLowerCase())
            ));
        } else {
            setFilteredReservations(reservations);
        }
    }, [search, reservations]);

    const loadReservations = async () => {
        const data = await getReservations();
        const active = data.filter(r => r.status === 'active');
        setReservations(active);
        setFilteredReservations(active);
    };

    return (
        <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
            <View style={styles.container}>
                <View style={styles.header}>
                    <Text style={styles.title}>Reserved Books</Text>
                    <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                        <X size={24} color="#1c1917" />
                    </TouchableOpacity>
                </View>

                <View style={styles.searchContainer}>
                    <Search size={20} color="#a8a29e" />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search book or user..."
                        value={search}
                        onChangeText={setSearch}
                    />
                </View>

                <FlatList
                    data={filteredReservations}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.list}
                    renderItem={({ item }) => (
                        <View style={styles.card}>
                            <View style={styles.cardHeader}>
                                <Text style={styles.bookTitle} numberOfLines={1}>{item.bookTitle}</Text>
                                <Text style={styles.date}>{new Date(item.reservedAt).toLocaleDateString()}</Text>
                            </View>
                            <Text style={styles.detail}>User: <Text style={styles.bold}>{item.userName || item.userId}</Text></Text>
                            <Text style={styles.detail}>Status: <Text style={{ color: '#d97706', fontWeight: '700' }}>Active</Text></Text>
                        </View>
                    )}
                    ListEmptyComponent={
                        <View style={styles.empty}>
                            <Text style={styles.emptyText}>No active reservations.</Text>
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
    card: { backgroundColor: '#fff', padding: 16, borderRadius: 12, marginBottom: 12 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
    bookTitle: { fontSize: 16, fontWeight: '700', color: '#1c1917', flex: 1 },
    date: { fontSize: 12, color: '#78716c' },
    detail: { fontSize: 14, color: '#57534e', marginTop: 4 },
    bold: { fontWeight: '600', color: '#1c1917' },
    empty: { alignItems: 'center', marginTop: 40 },
    emptyText: { color: '#a8a29e' },
});

export default ReservedBooksModal;
