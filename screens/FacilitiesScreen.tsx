import React, { useState, useEffect } from 'react';
import {
    View, Text, TouchableOpacity, ScrollView,
    StyleSheet, Modal, TextInput, Alert
} from 'react-native';
import {
    Users, Armchair, MessageSquare, Plus, Clock, X, Calendar, Check
} from 'lucide-react-native';
import { User, Booking, BookingStatus } from '../types';
import { getBookings, addBooking, cancelBooking, updateBookingStatus } from '../services/storage';
import Button from '../components/Button';

interface FacilitiesScreenProps {
    user: User;
}

const formatDateTime = (date: string, time: string) => {
    return `${new Date(date).toLocaleDateString()} • ${time}`;
};

const FACILITIES = [
    { id: 'meeting-a', name: 'Meeting Room A', capacity: 6, icon: Users, color: '#ea580c' },
    { id: 'meeting-b', name: 'Meeting Room B', capacity: 4, icon: Users, color: '#ea580c' },
    { id: 'desk-1', name: 'Quiet Desk 1', capacity: 1, icon: Armchair, color: '#22c55e' },
    { id: 'desk-2', name: 'Quiet Desk 2', capacity: 1, icon: Armchair, color: '#22c55e' },
    { id: 'pod-1', name: 'Discussion Pod', capacity: 2, icon: MessageSquare, color: '#d97706' },
];

const TIME_SLOTS = [
    '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00',
    '16:00', '17:00', '18:00', '19:00', '20:00', '21:00', '22:00'
];

const FacilitiesScreen: React.FC<FacilitiesScreenProps> = ({ user }) => {
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [showBookingModal, setShowBookingModal] = useState(false);
    const [selectedFacility, setSelectedFacility] = useState<typeof FACILITIES[0] | null>(null);
    const [selectedDate, setSelectedDate] = useState('');
    const [selectedStartTime, setSelectedStartTime] = useState('');
    const [selectedEndTime, setSelectedEndTime] = useState('');
    const [pax, setPax] = useState('1');

    const isAdmin = user.role === 'admin';

    useEffect(() => {
        loadBookings();
    }, []);

    const loadBookings = async () => {
        const b = await getBookings();
        // Determine sorting: Pending first, then by date desc
        b.sort((a, b) => {
            if (a.status === 'pending' && b.status !== 'pending') return -1;
            if (a.status !== 'pending' && b.status === 'pending') return 1;
            return new Date(b.date).getTime() - new Date(a.date).getTime();
        });
        setBookings(b);
    };

    const isTimeDisabled = (time: string) => {
        if (!selectedDate) return false;

        // Past time check
        const dateTime = new Date(`${selectedDate}T${time}:00`);
        if (dateTime < new Date()) return true;

        // Overlap check (visual only, strict check on submit)
        // Check if this specific hour is part of any APPROVED booking for this facility
        if (selectedFacility) {
            const hasConflict = bookings.some(b =>
                b.facilityId === selectedFacility.id &&
                b.date === selectedDate &&
                b.status === 'approved' &&
                time >= b.startTime && time < b.endTime
            );
            if (hasConflict) return true;
        }

        return false;
    };

    // Helper to determine if a given date string (YYYY-MM-DD) is a Sunday
    const isSunday = (dateStr: string) => {
        const day = new Date(dateStr).getDay(); // 0 = Sunday
        return day === 0;
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
        if (isSunday(selectedDate)) {
            Alert.alert('Error', 'Cannot book on Sundays');
            return;
        }

        if (selectedStartTime >= selectedEndTime) {
            Alert.alert('Error', 'End time must be after start time');
            return;
        }

        const bookingStart = new Date(`${selectedDate}T${selectedStartTime}:00`);
        if (bookingStart < new Date()) {
            Alert.alert('Error', 'Cannot book a time in the past');
            return;
        }

        const paxNum = parseInt(pax) || 1;
        if (paxNum > selectedFacility.capacity) {
            Alert.alert('Error', `Maximum capacity is ${selectedFacility.capacity} PAX`);
            return;
        }

        // VALIDATION: Check for overlaps
        // We check against ALL bookings (pending and approved) to prevent double booking.
        // Or should we only check approved? Usually pending also reserves the slot until rejected.
        // Let's check 'approved' and 'pending'.
        const hasOverlap = bookings.some(b => {
            if (b.facilityId !== selectedFacility.id || b.date !== selectedDate) return false;
            if (b.status === 'rejected') return false; // Rejected bookings don't block

            // Check if time ranges overlap: (StartA < EndB) and (EndA > StartB)
            return (selectedStartTime < b.endTime && selectedEndTime > b.startTime);
        });

        if (hasOverlap) {
            Alert.alert('Unavailable', 'This time slot overlaps with an existing booking.');
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

    const handleUpdateStatus = async (id: string, status: BookingStatus) => {
        await updateBookingStatus(id, status);
        loadBookings();
    };

    // Filter bookings for display
    const myUpcomingBookings = bookings.filter(b => b.userId === user.id && new Date(b.date) >= new Date());

    // Admin Lists
    const pendingBookings = bookings.filter(b => b.status === 'pending');
    const historyBookings = bookings.filter(b => b.status !== 'pending');

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'approved': return { bg: '#dcfce7', text: '#16a34a' };
            case 'rejected': return { bg: '#fee2e2', text: '#dc2626' };
            default: return { bg: '#fef3c7', text: '#d97706' };
        }
    };

    const availableTimeSlots = TIME_SLOTS.filter(time => !isTimeDisabled(time));

    const renderAdminView = () => (
        <View style={styles.gridContainer}>
            <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Pending Requests</Text>
            </View>

            {pendingBookings.length === 0 ? (
                <View style={styles.emptyState}><Text style={styles.emptyText}>No pending requests.</Text></View>
            ) : (
                pendingBookings.map(booking => (
                    <View key={booking.id} style={styles.adminCard}>
                        <View style={styles.adminCardHeader}>
                            <Text style={styles.bookingName}>{booking.facilityName}</Text>
                            <Text style={styles.paxTag}>{booking.pax} PAX</Text>
                        </View>
                        <Text style={styles.adminUserText}>User ID: {booking.userId}</Text>
                        <Text style={styles.bookingDetails}>{formatDateTime(booking.date, booking.startTime)} - {booking.endTime}</Text>

                        <View style={styles.adminActions}>
                            <TouchableOpacity style={[styles.actionBtn, styles.rejectBtn]} onPress={() => handleUpdateStatus(booking.id, 'rejected')}>
                                <X size={16} color="#dc2626" />
                                <Text style={styles.rejectText}>Reject</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.actionBtn, styles.approveBtn]} onPress={() => handleUpdateStatus(booking.id, 'approved')}>
                                <Check size={16} color="#16a34a" />
                                <Text style={styles.approveText}>Approve</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                ))
            )}

            <View style={[styles.sectionHeader, { marginTop: 24 }]}>
                <Text style={styles.sectionTitle}>Booking History</Text>
            </View>

            {historyBookings.map(booking => {
                const statusStyle = getStatusStyle(booking.status);
                return (
                    <View key={booking.id} style={styles.bookingCard}>
                        <View style={styles.bookingInfo}>
                            <Text style={styles.bookingName}>{booking.facilityName}</Text>
                            <Text style={styles.bookingDetails}>{formatDateTime(booking.date, booking.startTime)} - {booking.endTime}</Text>
                            <Text style={[styles.bookingDetails, { marginTop: 2 }]}>User: {booking.userId}</Text>
                        </View>
                        <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
                            <Text style={[styles.statusText, { color: statusStyle.text }]}>{booking.status.toUpperCase()}</Text>
                        </View>
                    </View>
                );
            })}
        </View>
    );

    const renderUserView = () => (
        <View>
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
                    <Text style={styles.bookingsTitle}>My Upcoming Bookings</Text>
                </View>

                {myUpcomingBookings.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyText}>No bookings yet.</Text>
                    </View>
                ) : (
                    myUpcomingBookings.map(booking => {
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
                                        {formatDateTime(booking.date, booking.startTime)} - {booking.endTime}
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
        </View>
    );

    return (
        <View style={styles.container}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                {/* Header */}
                <View style={styles.header}>
                    <View>
                        <Text style={styles.title}>Facilities</Text>
                        <Text style={styles.subtitle}>{isAdmin ? 'Manage Facility Bookings' : 'Book rooms & desks'}</Text>
                    </View>
                </View>

                {isAdmin ? renderAdminView() : renderUserView()}

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
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dateRow}>
                                    {Array.from({ length: 14 }, (_, i) => i).map(offset => {
                                        const date = new Date();
                                        date.setDate(date.getDate() + offset);
                                        const dateStr = date.toISOString().split('T')[0];
                                        // Skip rendering if the date is a Sunday
                                        if (isSunday(dateStr)) {
                                            return null;
                                        }
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
                                </ScrollView>
                            </View>

                            {/* Time Selection */}
                            <View style={styles.field}>
                                <Text style={styles.fieldLabel}>Start Time</Text>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                    <View style={styles.timeRow}>
                                        {availableTimeSlots.slice(0, -1).map(time => (
                                            <TouchableOpacity
                                                key={time}
                                                style={[
                                                    styles.timeButton,
                                                    selectedStartTime === time && styles.timeButtonSelected
                                                ]}
                                                onPress={() => setSelectedStartTime(time)}
                                            >
                                                <Text style={[
                                                    styles.timeText,
                                                    selectedStartTime === time && styles.timeTextSelected
                                                ]}>
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
                                        {availableTimeSlots.slice(1).map(time => (
                                            <TouchableOpacity
                                                key={time}
                                                style={[
                                                    styles.timeButton,
                                                    selectedEndTime === time && styles.timeButtonSelected
                                                ]}
                                                onPress={() => setSelectedEndTime(time)}
                                            >
                                                <Text style={[
                                                    styles.timeText,
                                                    selectedEndTime === time && styles.timeTextSelected
                                                ]}>
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
    dateRow: { flexDirection: 'row', gap: 20 },
    dateButton: { alignItems: 'center', paddingVertical: 10, paddingHorizontal: 14, borderRadius: 12, backgroundColor: '#f5f5f4', marginHorizontal: 24 },
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
    timeButtonDisabled: { opacity: 0.3, backgroundColor: '#e5e5e5' },
    timeTextDisabled: { color: '#a3a3a3' },

    // Admin Styles
    gridContainer: { gap: 16 },
    sectionHeader: { marginBottom: 12 },
    sectionTitle: { fontSize: 18, fontWeight: '700', color: '#1c1917' },
    adminCard: { backgroundColor: '#fff', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#f5f5f4', marginBottom: 12 },
    adminCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    paxTag: { fontSize: 12, fontWeight: '600', color: '#78716c', backgroundColor: '#f5f5f4', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
    adminUserText: { fontSize: 13, color: '#57534e', marginBottom: 4 },
    adminActions: { flexDirection: 'row', gap: 12, marginTop: 16 },
    actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 10, borderRadius: 10, gap: 6 },
    approveBtn: { backgroundColor: '#dcfce7' },
    rejectBtn: { backgroundColor: '#fee2e2' },
    approveText: { fontSize: 14, fontWeight: '700', color: '#16a34a' },
    rejectText: { fontSize: 14, fontWeight: '700', color: '#dc2626' },
});

export default FacilitiesScreen;
