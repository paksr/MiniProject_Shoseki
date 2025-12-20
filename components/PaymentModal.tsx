import React, { useState } from 'react';
import { View, Text, Modal, StyleSheet, TouchableOpacity, TextInput, Alert, ActivityIndicator } from 'react-native';
import { X, CreditCard, Store } from 'lucide-react-native';

interface PaymentModalProps {
    visible: boolean;
    amount: number;
    onClose: () => void;
    onPay: (method: 'card' | 'counter') => Promise<void>;
}

const PaymentModal: React.FC<PaymentModalProps> = ({ visible, amount, onClose, onPay }) => {
    const [method, setMethod] = useState<'select' | 'card' | 'counter'>('select');
    const [loading, setLoading] = useState(false);

    // Card State
    const [cardNumber, setCardNumber] = useState('');
    const [expiry, setExpiry] = useState('');
    const [cvv, setCvv] = useState('');

    const handlePay = async () => {
        if (method === 'card') {
            if (cardNumber.length < 16 || expiry.length < 4 || cvv.length < 3) {
                Alert.alert("Error", "Please fill in valid card details.");
                return;
            }
        }

        setLoading(true);
        // Simulate network delay
        setTimeout(async () => {
            await onPay(method === 'select' ? 'counter' : method);
            setLoading(false);
            setMethod('select');
            setCardNumber('');
            setExpiry('');
            setCvv('');
        }, 1500);
    };

    const reset = () => {
        setMethod('select');
        onClose();
    };

    return (
        <Modal visible={visible} animationType="slide" transparent>
            <View style={styles.overlay}>
                <View style={styles.container}>
                    <View style={styles.header}>
                        <Text style={styles.title}>Payment Required</Text>
                        <TouchableOpacity onPress={reset}>
                            <X size={24} color="#1c1917" />
                        </TouchableOpacity>
                    </View>

                    <Text style={styles.amount}>Total Due: MYR {amount.toFixed(2)}</Text>

                    {method === 'select' ? (
                        <View style={styles.options}>
                            <TouchableOpacity style={styles.optionCard} onPress={() => setMethod('counter')}>
                                <Store size={32} color="#5D4037" />
                                <Text style={styles.optionTitle}>Pay at Counter</Text>
                                <Text style={styles.optionDesc}>Cash or QR at the desk</Text>
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.optionCard} onPress={() => setMethod('card')}>
                                <CreditCard size={32} color="#5D4037" />
                                <Text style={styles.optionTitle}>Credit / Debit Card</Text>
                                <Text style={styles.optionDesc}>Secure online payment</Text>
                            </TouchableOpacity>
                        </View>
                    ) : method === 'counter' ? (
                        <View style={styles.section}>
                            <Text style={styles.instruction}>Please visit the counter to make your payment. Show your ID to the library staff.</Text>
                            <View style={styles.infoBox}>
                                <Text style={styles.infoText}>Once you have paid, the staff will clear your penalty manually, or you can click "I have Paid" if staff instructs you to.</Text>
                            </View>
                            <TouchableOpacity style={styles.payButton} onPress={handlePay} disabled={loading}>
                                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.payButtonText}>I have Paid (Simulate Staff)</Text>}
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.backButton} onPress={() => setMethod('select')}>
                                <Text style={styles.backButtonText}>Choose another method</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <View style={styles.section}>
                            <TextInput
                                style={styles.input}
                                placeholder="Card Number"
                                keyboardType="numeric"
                                maxLength={16}
                                value={cardNumber}
                                onChangeText={setCardNumber}
                            />
                            <View style={styles.row}>
                                <TextInput
                                    style={[styles.input, { flex: 1 }]}
                                    placeholder="MM/YY"
                                    maxLength={5}
                                    value={expiry}
                                    onChangeText={setExpiry}
                                />
                                <TextInput
                                    style={[styles.input, { flex: 1 }]}
                                    placeholder="CVV"
                                    keyboardType="numeric"
                                    maxLength={3}
                                    secureTextEntry
                                    value={cvv}
                                    onChangeText={setCvv}
                                />
                            </View>
                            <TouchableOpacity style={styles.payButton} onPress={handlePay} disabled={loading}>
                                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.payButtonText}>Pay MYR {amount.toFixed(2)}</Text>}
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.backButton} onPress={() => setMethod('select')}>
                                <Text style={styles.backButtonText}>Choose another method</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
    container: { backgroundColor: '#fff', borderRadius: 24, padding: 24 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    title: { fontSize: 24, fontWeight: '700', color: '#1c1917' },
    amount: { fontSize: 20, fontWeight: '600', color: '#dc2626', marginBottom: 24, textAlign: 'center' },
    options: { gap: 16 },
    optionCard: { padding: 20, borderWidth: 1, borderColor: '#e7e5e4', borderRadius: 16, alignItems: 'center', gap: 8 },
    optionTitle: { fontSize: 16, fontWeight: '700', color: '#1c1917' },
    optionDesc: { fontSize: 12, color: '#78716c' },
    section: { gap: 16 },
    instruction: { fontSize: 16, color: '#1c1917', textAlign: 'center' },
    infoBox: { backgroundColor: '#fffbeb', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#fde68a' },
    infoText: { fontSize: 12, color: '#92400e', textAlign: 'center' },
    input: { borderWidth: 1, borderColor: '#e7e5e4', borderRadius: 12, padding: 16, fontSize: 16 },
    row: { flexDirection: 'row', gap: 16 },
    payButton: { backgroundColor: '#5D4037', padding: 16, borderRadius: 12, alignItems: 'center' },
    payButtonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
    backButton: { alignItems: 'center', padding: 8 },
    backButtonText: { color: '#78716c' }
});

export default PaymentModal;
