import React, { useState, useEffect } from 'react';
import { View, Text, Modal, StyleSheet, TouchableOpacity, FlatList, Alert, TextInput } from 'react-native';
import { LoanRecord } from '../types';
import { getLoans, updateLoan } from '../services/supabaseStorage';
import { X, Calendar, Search, CheckCircle } from 'lucide-react-native';

interface LoanManagementModalProps {
    visible: boolean;
    onClose: () => void;
    mode?: 'active' | 'history'; // Defaults to 'active'
}

const LoanManagementModal: React.FC<LoanManagementModalProps> = ({ visible, onClose, mode = 'active' }) => {
    const [loans, setLoans] = useState<LoanRecord[]>([]);
    const [filteredLoans, setFilteredLoans] = useState<LoanRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [editingLoan, setEditingLoan] = useState<LoanRecord | null>(null);
    const [newDate, setNewDate] = useState('');

    useEffect(() => {
        if (visible) {
            loadLoans();
        }
    }, [visible, mode]);

    useEffect(() => {
        if (search) {
            setFilteredLoans(loans.filter(l =>
                l.bookTitle?.toLowerCase().includes(search.toLowerCase()) ||
                l.userId?.toLowerCase().includes(search.toLowerCase()) ||
                l.userName?.toLowerCase().includes(search.toLowerCase())
            ));
        } else {
            setFilteredLoans(loans);
        }
    }, [search, loans]);

    const loadLoans = async () => {
        setLoading(true);
        const data = await getLoans();
        let displayData = data;

        if (mode === 'active') {
            displayData = data.filter(l => l.status === 'active');
        } else {
            // History means completed loans? Or all loans including history? 
            // "show all history on loan book". Usually implies past records. 
            // Let's show everything or just returned. 
            // Often "history" implies distinct from "active". 
            // Let's show ALL (Active + Returned) or just Returned?
            // Usually History = All records.
            // But if I want to distinct, maybe just Returned?
            // Let's show ALL for history effectively.
            displayData = data;
        }

        setLoans(displayData);
        setFilteredLoans(displayData);
        setLoading(false);
    };

    const handleExtend = async () => {
        if (!editingLoan || !newDate) return;

        // Simple validation YYYY-MM-DD
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(newDate)) {
            Alert.alert("Invalid Format", "Please use YYYY-MM-DD");
            return;
        }

        try {
            await updateLoan(editingLoan.id, { dueDate: new Date(newDate).toISOString() });
            Alert.alert("Success", "Due date updated");
            setEditingLoan(null);
            loadLoans();
        } catch (e: any) {
            Alert.alert("Error", e.message);
        }
    };

    const openEdit = (loan: LoanRecord) => {
        if (loan.status !== 'active') return; // Only edit active loans
        setEditingLoan(loan);
        setNewDate(new Date(loan.dueDate).toISOString().split('T')[0]);
    };

    return (
        <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
            <View style={styles.container}>
                <View style={styles.header}>
                    <Text style={styles.title}>{mode === 'active' ? 'Active Loans' : 'Loan History'}</Text>
                    <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                        <X size={24} color="#1c1917" />
                    </TouchableOpacity>
                </View>

                <View style={styles.searchContainer}>
                    <Search size={20} color="#a8a29e" />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search user, book..."
                        value={search}
                        onChangeText={setSearch}
                    />
                </View>

                <FlatList
                    data={filteredLoans}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.list}
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            style={styles.card}
                            onPress={() => openEdit(item)}
                            disabled={item.status !== 'active'}
                        >
                            <View style={styles.cardHeader}>
                                <Text style={styles.bookTitle} numberOfLines={1}>{item.bookTitle}</Text>
                                <View style={[styles.statusBadge, {
                                    backgroundColor: item.status === 'active' ? '#fef3c7' : '#dcfce7'
                                }]}>
                                    <Text style={[styles.statusText, {
                                        color: item.status === 'active' ? '#d97706' : '#16a34a'
                                    }]}>{item.status}</Text>
                                </View>
                            </View>
                            <Text style={styles.detail}>User: {item.userName || item.userId}</Text>
                            <Text style={styles.detail}>Borrowed: {new Date(item.borrowedAt).toLocaleDateString()}</Text>
                            {item.returnedAt && (
                                <Text style={styles.detail}>Returned: {new Date(item.returnedAt).toLocaleDateString()}</Text>
                            )}
                            <View style={styles.dueContainer}>
                                <Calendar size={14} color={item.status === 'active' ? "#dc2626" : "#16a34a"} />
                                <Text style={[styles.dueText, { color: item.status === 'active' ? "#dc2626" : "#16a34a" }]}>
                                    Due: {new Date(item.dueDate).toLocaleDateString()}
                                </Text>
                            </View>
                        </TouchableOpacity>
                    )}
                    ListEmptyComponent={
                        <View style={styles.empty}>
                            <Text style={styles.emptyText}>No records found.</Text>
                        </View>
                    }
                />

                {/* Edit Modal / Overlay */}
                {editingLoan && (
                    <View style={styles.overlay}>
                        <View style={styles.editBox}>
                            <Text style={styles.editTitle}>Edit Due Date</Text>
                            <Text style={styles.editSubtitle}>{editingLoan.bookTitle}</Text>

                            <Text style={styles.label}>New Due Date (YYYY-MM-DD):</Text>
                            <TextInput
                                style={styles.dateInput}
                                value={newDate}
                                onChangeText={setNewDate}
                                placeholder="YYYY-MM-DD"
                            />

                            <View style={styles.editActions}>
                                <TouchableOpacity onPress={() => setEditingLoan(null)} style={styles.cancelBtn}>
                                    <Text style={styles.cancelText}>Cancel</Text>
                                </TouchableOpacity>
                                <TouchableOpacity onPress={handleExtend} style={styles.saveBtn}>
                                    <Text style={styles.saveText}>Save</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                )}
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
    statusBadge: { paddingVertical: 2, paddingHorizontal: 8, borderRadius: 12 },
    statusText: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase' },
    detail: { fontSize: 12, color: '#78716c', marginBottom: 2 },
    dueContainer: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8 },
    dueText: { fontSize: 14, fontWeight: '600', color: '#dc2626' },
    empty: { alignItems: 'center', marginTop: 40 },
    emptyText: { color: '#a8a29e' },

    overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
    editBox: { backgroundColor: '#fff', width: '80%', padding: 24, borderRadius: 16 },
    editTitle: { fontSize: 20, fontWeight: '700', marginBottom: 8 },
    editSubtitle: { fontSize: 14, color: '#78716c', marginBottom: 20 },
    label: { fontSize: 12, fontWeight: '700', marginBottom: 8 },
    dateInput: { borderWidth: 1, borderColor: '#e7e5e4', borderRadius: 8, padding: 12, fontSize: 16, marginBottom: 20 },
    editActions: { flexDirection: 'row', gap: 12 },
    cancelBtn: { flex: 1, padding: 12, alignItems: 'center', borderRadius: 8, backgroundColor: '#f5f5f4' },
    cancelText: { fontWeight: '600' },
    saveBtn: { flex: 1, padding: 12, alignItems: 'center', borderRadius: 8, backgroundColor: '#5D4037' },
    saveText: { fontWeight: '600', color: '#fff' }
});

export default LoanManagementModal;
