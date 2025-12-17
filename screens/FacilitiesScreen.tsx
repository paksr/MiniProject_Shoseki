import React, { useState, useEffect } from 'react';
import {
    View, Text, TouchableOpacity, ScrollView,
    StyleSheet, Modal, TextInput, Alert
} from 'react-native';
import {
    Users, Armchair, MessageSquare, Plus, Clock, X, Calendar, Check
} from 'lucide-react-native';
import { User, Booking } from '../types';
import { getBookings, addBooking, cancelBooking } from '../services/storage';
import Button from '../components/Button';

interface FacilitiesScreenProps {
    user: User;
}

const FACILITIES = [
    { id: 'meeting-a', name: 'Meeting Room A', capacity: 6, icon: Users, color: '#ea580c' },
    { id: 'meeting-b', name: 'Meeting Room B', capacity: 4, icon: Users, color: '#ea580c' },
    { id: 'desk-1', name: 'Quiet Desk 1', capacity: 1, icon: Armchair, color: '#22c55e' },
    { id: 'desk-2', name: 'Quiet Desk 2', capacity: 1, icon: Armchair, color: '#22c55e' },
    { id: 'pod-1', name: 'Discussion Pod', capacity: 2, icon: MessageSquare, color: '#d97706' },
];

const TIME_SLOTS = [
    '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'
];

const FacilitiesScreen: React.FC<FacilitiesScreenProps> = ({ user }) => {
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [showBookingModal, setShowBookingModal] = useState(false);
    const [selectedFacility, setSelectedFacility] = useState<typeof FACILITIES[0] | null>(null);
    const [selectedDate, setSelectedDate] = useState('');
    const [selectedStartTime, setSelectedStartTime] = useState('');
    const [selectedEndTime, setSelectedEndTime] = useState('');
    const [pax, setPax] = useState('1');

    useEffect(() => {
        loadBookings();
    }, []);

    const loadBookings = async () => {
        const b = await getBookings();
        setBookings(b.filter(bk => bk.userId === user.id));
    };

    const handleFacilityPress = (facility: typeof FACILITIES[0]) => {
        setSelectedFacility(facility);
        setPax('1');
        setSelectedDate(new Date().toISOString().split('T')[0]);
        setSelectedStartTime('');
        setSelectedEndTime('');
        setShowBookingModal(true);
    };

    const handleBooking = async () => {
        if (!selectedFacility || !selectedDate || !selectedStartTime || !selectedEndTime) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }

        const paxNum = parseInt(pax) || 1;
        if (paxNum > selectedFacility.capacity) {
            Alert.alert('Error', `Maximum capacity is ${selectedFacility.capacity} PAX`);
            return;
        }

        await addBooking({
            facilityId: selectedFacility.id,
            facilityName: selectedFacility.name,
            date: selectedDate,
            startTime: selectedStartTime,
            endTime: selectedEndTime,
            pax: paxNum,
            userId: user.id,
            capacity: selectedFacility.capacity,
        });

        setShowBookingModal(false);
        loadBookings();
        Alert.alert('Success', 'Booking submitted for approval');
    };

    const handleCancelBooking = async (id: string) => {
        Alert.alert('Cancel Booking', 'Are you sure?', [
            { text: 'No', style: 'cancel' },
            {
                text: 'Yes', style: 'destructive', onPress: async () => {
                    await cancelBooking(id);
                    loadBookings();
                }
            }
        ]);
    };

    const upcomingBookings = bookings.filter(b => new Date(b.date) >= new Date());

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'approved': return { bg: '#dcfce7', text: '#16a34a' };
            case 'rejected': return { bg: '#fee2e2', text: '#dc2626' };
            default: return { bg: '#fef3c7', text: '#d97706' };
        }
    };

    return (
        <View style={styles.container}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                {/* Header */}
                <View style={styles.header}>
                    <View>
                        <Text style={styles.title}>Facilities</Text>
                        <Text style={styles.subtitle}>Book rooms & desks</Text>
                    </View>
                </View>

                {/* Facilities Grid */}
                <View style={styles.grid}>
                    {FACILITIES.map(facility => {
                        const IconComponent = facility.icon;
                        return (
                            <TouchableOpacity
                                key={facility.id}
                                style={styles.facilityCard}
                                onPress={() => handleFacilityPress(facility)}
                                activeOpacity={0.7}
                            >
                                <View style={[styles.facilityIcon, { backgroundColor: `${facility.color}15` }]}>
                                    <IconComponent size={24} color={facility.color} />
                                </View>
                                <Text style={styles.facilityName}>{facility.name}</Text>
                                <Text style={styles.facilityCapacity}>{facility.capacity} PAX</Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>

                {/* Upcoming Bookings */}
                <View style={styles.bookingsSection}>
                    <View style={styles.bookingsHeader}>
                        <Clock size={16} color="#78716c" />
                        <Text style={styles.bookingsTitle}>Upcoming Bookings</Text>
                    </View>

                    {upcomingBookings.length === 0 ? (
                        <View style={styles.emptyState}>
                            <Text style={styles.emptyText}>No bookings yet.</Text>
                        </View>
                    ) : (
                        upcomingBookings.map(booking => {
                            const statusStyle = getStatusStyle(booking.status);
                            return (
                                <TouchableOpacity
                                    key={booking.id}
                                    style={styles.bookingCard}
                                    onLongPress={() => handleCancelBooking(booking.id)}
                                >
                                    <View style={styles.bookingInfo}>
                                        <Text style={styles.bookingName}>{booking.facilityName}</Text>
                                        <Text style={styles.bookingDetails}>
                                            {new Date(booking.date).toLocaleDateString()} • {booking.startTime} - {booking.endTime}
                                        </Text>
                                    </View>
                                    <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
                                        <Text style={[styles.statusText, { color: statusStyle.text }]}>
                                            {booking.status.toUpperCase()}
                                        </Text>
                                    </View>
                                </TouchableOpacity>
                            );
                        })
                    )}
                </View>

                <View style={{ height: 100 }} />
            </ScrollView>

            {/* Booking Modal */}
            <Modal
                visible={showBookingModal}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowBookingModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>{selectedFacility?.name}</Text>
                            <TouchableOpacity onPress={() => setShowBookingModal(false)}>
                                <X size={24} color="#78716c" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
                            {/* Date Selection */}
                            <View style={styles.field}>
                                <Text style={styles.fieldLabel}>Date</Text>
                                <View style={styles.dateRow}>
                                    {[0, 1, 2, 3, 4].map(offset => {
                                        const date = new Date();
                                        date.setDate(date.getDate() + offset);
                                        const dateStr = date.toISOString().split('T')[0];
                                        const isSelected = selectedDate === dateStr;
                                        return (
                                            <TouchableOpacity
                                                key={offset}
                                                style={[styles.dateButton, isSelected && styles.dateButtonSelected]}
                                                onPress={() => setSelectedDate(dateStr)}
                                            >
                                                <Text style={[styles.dateDay, isSelected && styles.dateDaySelected]}>
                                                    {date.toLocaleDateString('en', { weekday: 'short' })}
                                                </Text>
                                                <Text style={[styles.dateNum, isSelected && styles.dateNumSelected]}>
                                                    {date.getDate()}
                                                </Text>
                                            </TouchableOpacity>
                                        );
                                    })}
                                </View>
                            </View>

                            {/* Time Selection */}
                            <View style={styles.field}>
                                <Text style={styles.fieldLabel}>Start Time</Text>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                    <View style={styles.timeRow}>
                                        {TIME_SLOTS.slice(0, -1).map(time => (
                                            <TouchableOpacity
                                                key={time}
                                                style={[styles.timeButton, selectedStartTime === time && styles.timeButtonSelected]}
                                                onPress={() => setSelectedStartTime(time)}
                                            >
                                                <Text style={[styles.timeText, selectedStartTime === time && styles.timeTextSelected]}>
                                                    {time}
                                                </Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                </ScrollView>
                            </View>

                            <View style={styles.field}>
                                <Text style={styles.fieldLabel}>End Time</Text>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                    <View style={styles.timeRow}>
                                        {TIME_SLOTS.slice(1).map(time => (
                                            <TouchableOpacity
                                                key={time}
                                                style={[styles.timeButton, selectedEndTime === time && styles.timeButtonSelected]}
                                                onPress={() => setSelectedEndTime(time)}
                                            >
                                                <Text style={[styles.timeText, selectedEndTime === time && styles.timeTextSelected]}>
                                                    {time}
                                                </Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                </ScrollView>
                            </View>

                            {/* PAX Input */}
                            <View style={styles.field}>
                                <Text style={styles.fieldLabel}>Number of People (Max: {selectedFacility?.capacity})</Text>
                                <TextInput
                                    style={styles.input}
                                    value={pax}
                                    onChangeText={setPax}
                                    keyboardType="numeric"
                                    placeholder="1"
                                    placeholderTextColor="#a8a29e"
                                />
                            </View>
                        </ScrollView>

                        <View style={styles.modalFooter}>
                            <Button variant="ghost" onPress={() => setShowBookingModal(false)}>
                                <Text style={styles.cancelText}>Cancel</Text>
                            </Button>
                            <Button onPress={handleBooking} style={{ flex: 1 }}>
                                <Check size={18} color="#fff" />
                                <Text style={styles.confirmText}>Confirm Booking</Text>
                            </Button>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f5f5f4' },
    scrollContent: { padding: 16 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginTop: 8, marginBottom: 20 },
    title: { fontSize: 28, fontWeight: '700', color: '#1c1917', marginBottom: 4 },
    subtitle: { fontSize: 14, color: '#78716c' },
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 24 },
    facilityCard: {
        width: '48%', backgroundColor: '#fff', padding: 16, borderRadius: 16,
        borderWidth: 1, borderColor: '#f5f5f4'
    },
    facilityIcon: { width: 48, height: 48, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
    facilityName: { fontSize: 14, fontWeight: '700', color: '#1c1917', marginBottom: 2 },
    facilityCapacity: { fontSize: 12, color: '#78716c', fontWeight: '600' },
    bookingsSection: { marginTop: 8 },
    bookingsHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
    bookingsTitle: { fontSize: 14, fontWeight: '600', color: '#1c1917' },
    emptyState: { backgroundColor: '#fff', padding: 32, borderRadius: 16, alignItems: 'center', borderWidth: 1, borderColor: '#f5f5f4' },
    emptyText: { color: '#a8a29e', fontSize: 14 },
    bookingCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', padding: 14, borderRadius: 12, marginBottom: 8, borderWidth: 1, borderColor: '#f5f5f4' },
    bookingInfo: { flex: 1 },
    bookingName: { fontSize: 14, fontWeight: '700', color: '#1c1917', marginBottom: 2 },
    bookingDetails: { fontSize: 12, color: '#78716c' },
    statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
    statusText: { fontSize: 10, fontWeight: '700' },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '85%' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#f5f5f4' },
    modalTitle: { fontSize: 18, fontWeight: '700', color: '#1c1917' },
    modalBody: { padding: 20, maxHeight: 400 },
    modalFooter: { flexDirection: 'row', padding: 16, gap: 12, borderTopWidth: 1, borderTopColor: '#f5f5f4' },
    field: { marginBottom: 20 },
    fieldLabel: { fontSize: 14, fontWeight: '600', color: '#57534e', marginBottom: 10 },
    dateRow: { flexDirection: 'row', gap: 8 },
    dateButton: { alignItems: 'center', paddingVertical: 10, paddingHorizontal: 14, borderRadius: 12, backgroundColor: '#f5f5f4' },
    dateButtonSelected: { backgroundColor: '#5D4037' },
    dateDay: { fontSize: 11, color: '#78716c', fontWeight: '600', marginBottom: 2 },
    dateDaySelected: { color: '#D7CCC8' },
    dateNum: { fontSize: 18, fontWeight: '700', color: '#1c1917' },
    dateNumSelected: { color: '#fff' },
    timeRow: { flexDirection: 'row', gap: 8 },
    timeButton: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8, backgroundColor: '#f5f5f4' },
    timeButtonSelected: { backgroundColor: '#5D4037' },
    timeText: { fontSize: 14, fontWeight: '600', color: '#57534e' },
    timeTextSelected: { color: '#fff' },
    input: { backgroundColor: '#f5f5f4', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 16, color: '#1c1917' },
    cancelText: { color: '#5D4037', fontWeight: '600' },
    confirmText: { color: '#fff', fontWeight: '600' },
});

export default FacilitiesScreen;
