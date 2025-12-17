import React, { useState } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, Image,
    ScrollView, StyleSheet, Dimensions
} from 'react-native';
import { Shield, User as UserIcon, BookOpen } from 'lucide-react-native';
import { User } from '../types';
import { createUser, loginUser, loginAdmin, getUsers } from '../services/storage';
import Button from '../components/Button';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface LoginScreenProps {
    onLogin: (user: User) => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
    const [mode, setMode] = useState<'login' | 'register' | 'admin'>('login');
    const [email, setEmail] = useState('');
    const [name, setName] = useState('');
    const [password, setPassword] = useState('');
    const [adminId, setAdminId] = useState('');
    const [error, setError] = useState('');
    const [savedUsers, setSavedUsers] = useState<User[]>([]);

    React.useEffect(() => {
        loadUsers();
    }, []);

    const loadUsers = async () => {
        const users = await getUsers();
        setSavedUsers(users);
    };

    const isAdmin = mode === 'admin';
    const isStudent = mode !== 'admin';

    const handleSubmit = async () => {
        setError('');
        try {
            if (isAdmin) {
                const user = await loginAdmin(adminId, password);
                onLogin(user);
            } else if (mode === 'login') {
                const user = await loginUser(email, password);
                onLogin(user);
            } else {
                const user = await createUser(name, email, password);
                onLogin(user);
            }
        } catch (e: any) {
            setError(e.message || 'An error occurred');
        }
    };

    const handleQuickLogin = async (userEmail: string) => {
        try {
            const user = await loginUser(userEmail);
            onLogin(user);
        } catch (e: any) {
            setError(e.message);
        }
    };

    const switchMode = (newMode: 'login' | 'register' | 'admin') => {
        setMode(newMode);
        setError('');
        setEmail('');
        setName('');
        setPassword('');
        setAdminId('');
    };

    return (
        <View style={styles.container}>
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.content}
                showsVerticalScrollIndicator={false}
            >
                {/* Header with Icon */}
                <View style={styles.header}>
                    <View style={styles.iconContainer}>
                        {isAdmin ? (
                            <Shield size={40} color="#fff" strokeWidth={1.5} />
                        ) : (
                            <BookOpen size={40} color="#fff" strokeWidth={1.5} />
                        )}
                    </View>
                    <Text style={styles.title}>Shoseki</Text>
                    <Text style={styles.subtitle}>Your quiet reading sanctuary</Text>
                </View>

                {/* Form */}
                <View style={styles.form}>
                    {isAdmin ? (
                        <>
                            <TextInput
                                style={styles.input}
                                placeholder="Admin ID"
                                placeholderTextColor="#a8a29e"
                                value={adminId}
                                onChangeText={setAdminId}
                            />
                            <TextInput
                                style={styles.input}
                                placeholder="Password"
                                placeholderTextColor="#a8a29e"
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry
                            />
                        </>
                    ) : (
                        <>
                            {mode === 'register' && (
                                <TextInput
                                    style={styles.input}
                                    placeholder="Full Name"
                                    placeholderTextColor="#a8a29e"
                                    value={name}
                                    onChangeText={setName}
                                />
                            )}
                            <TextInput
                                style={styles.input}
                                placeholder="Student Email"
                                placeholderTextColor="#a8a29e"
                                value={email}
                                onChangeText={setEmail}
                                keyboardType="email-address"
                                autoCapitalize="none"
                            />
                            <TextInput
                                style={styles.input}
                                placeholder="Password"
                                placeholderTextColor="#a8a29e"
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry
                            />
                        </>
                    )}

                    {error ? <Text style={styles.error}>{error}</Text> : null}

                    {/* Primary Button */}
                    <TouchableOpacity style={styles.primaryButton} onPress={handleSubmit}>
                        <Text style={styles.primaryButtonText}>
                            {isAdmin ? 'Login as Admin' : (mode === 'login' ? 'Enter Library' : 'Create Account')}
                        </Text>
                    </TouchableOpacity>

                    {/* Secondary Button */}
                    {isStudent && mode === 'login' && (
                        <TouchableOpacity
                            style={styles.secondaryButton}
                            onPress={() => switchMode('register')}
                        >
                            <Text style={styles.secondaryButtonText}>Create Account</Text>
                        </TouchableOpacity>
                    )}

                    {isStudent && mode === 'register' && (
                        <TouchableOpacity
                            style={styles.ghostButton}
                            onPress={() => switchMode('login')}
                        >
                            <Text style={styles.ghostButtonText}>Back to Login</Text>
                        </TouchableOpacity>
                    )}

                    {isAdmin && (
                        <TouchableOpacity
                            style={styles.ghostButton}
                            onPress={() => { setAdminId('2404810'); setPassword('password1234'); }}
                        >
                            <Text style={styles.ghostButtonText}>Quick Admin Demo</Text>
                        </TouchableOpacity>
                    )}
                </View>

                {/* Quick Login Section */}
                {mode === 'login' && savedUsers.length > 0 && (
                    <View style={styles.quickLogin}>
                        <Text style={styles.quickLoginTitle}>QUICK LOGIN</Text>
                        <View style={styles.quickLoginRow}>
                            {savedUsers.slice(0, 4).map(u => (
                                <TouchableOpacity
                                    key={u.id}
                                    style={styles.quickLoginItem}
                                    onPress={() => handleQuickLogin(u.email)}
                                >
                                    <View style={styles.avatar}>
                                        <Text style={styles.avatarText}>{u.name.substring(0, 2).toUpperCase()}</Text>
                                    </View>
                                    <Text style={styles.quickLoginName} numberOfLines={1}>
                                        {u.name.split(' ')[0]}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                )}
            </ScrollView>

            {/* Portal Switch - Fixed at Bottom */}
            <View style={styles.portalSwitchContainer}>
                <View style={styles.portalSwitch}>
                    <TouchableOpacity
                        style={[styles.portalButton, isStudent && styles.portalButtonActive]}
                        onPress={() => switchMode('login')}
                    >
                        <UserIcon size={12} color={isStudent ? '#5D4037' : '#a8a29e'} />
                        <Text style={[styles.portalText, isStudent && styles.portalTextActive]}>Student</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.portalButton, isAdmin && styles.portalButtonActive]}
                        onPress={() => switchMode('admin')}
                    >
                        <Shield size={12} color={isAdmin ? '#5D4037' : '#a8a29e'} />
                        <Text style={[styles.portalText, isAdmin && styles.portalTextActive]}>Admin</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff'
    },
    scrollView: {
        flex: 1
    },
    content: {
        padding: 24,
        paddingTop: 60,
        paddingBottom: 100,
    },
    header: {
        alignItems: 'center',
        marginBottom: 48
    },
    iconContainer: {
        width: 80,
        height: 80,
        borderRadius: 20,
        backgroundColor: '#5D4037',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
        shadowColor: '#5D4037',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
        elevation: 8,
    },
    title: {
        fontSize: 32,
        fontWeight: '700',
        color: '#3E2723',
        marginBottom: 4,
        fontFamily: 'serif',
    },
    subtitle: {
        fontSize: 14,
        color: '#78716c'
    },
    form: {
        gap: 12,
        marginBottom: 32
    },
    input: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#e7e5e4',
        borderRadius: 12,
        paddingHorizontal: 20,
        paddingVertical: 16,
        fontSize: 16,
        color: '#1c1917'
    },
    error: {
        backgroundColor: '#fee2e2',
        color: '#dc2626',
        padding: 12,
        borderRadius: 12,
        textAlign: 'center',
        fontSize: 14
    },
    primaryButton: {
        backgroundColor: '#5D4037',
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 8,
        shadowColor: '#5D4037',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    primaryButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
    },
    secondaryButton: {
        backgroundColor: '#5D4037',
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    secondaryButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
    },
    ghostButton: {
        paddingVertical: 12,
        alignItems: 'center',
    },
    ghostButtonText: {
        color: '#5D4037',
        fontSize: 14,
        fontWeight: '600',
    },
    quickLogin: {
        alignItems: 'center',
        paddingTop: 32,
        borderTopWidth: 1,
        borderTopColor: '#f5f5f4'
    },
    quickLoginTitle: {
        fontSize: 11,
        color: '#d97706',
        fontWeight: '600',
        letterSpacing: 1,
        marginBottom: 16
    },
    quickLoginRow: {
        flexDirection: 'row',
        gap: 20
    },
    quickLoginItem: {
        alignItems: 'center',
        width: 56
    },
    avatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#5D4037',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
        borderWidth: 2,
        borderColor: '#D7CCC8',
    },
    avatarText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '700'
    },
    quickLoginName: {
        fontSize: 11,
        color: '#78716c',
        textAlign: 'center',
        fontWeight: '500',
    },
    portalSwitchContainer: {
        position: 'absolute',
        bottom: 32,
        left: 0,
        right: 0,
        alignItems: 'center',
    },
    portalSwitch: {
        flexDirection: 'row',
        backgroundColor: '#f5f5f4',
        padding: 4,
        borderRadius: 24,
        borderWidth: 1,
        borderColor: '#e7e5e4',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    portalButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 8,
        borderRadius: 20,
        gap: 6
    },
    portalButtonActive: {
        backgroundColor: '#fff',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 1,
    },
    portalText: {
        fontSize: 11,
        fontWeight: '700',
        color: '#a8a29e'
    },
    portalTextActive: {
        color: '#5D4037'
    },
});

export default LoginScreen;
