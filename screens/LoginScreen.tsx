import React, { useState } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, Image,
    ScrollView, StyleSheet, Dimensions, Alert
} from 'react-native';
import { Shield, User as UserIcon, BookOpen, Eye, EyeOff } from 'lucide-react-native';
import { User } from '../types';
import { createUser, loginUser, loginAdmin, getRecentUsers, saveRecentUser, removeRecentUser, requestPasswordResetOTP, verifyPasswordResetOTP, resetUserPassword } from '../services/supabaseStorage';
import Button from '../components/Button';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface LoginScreenProps {
    onLogin: (user: User) => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
    const [email, setEmail] = useState('');
    const [name, setName] = useState('');
    const [password, setPassword] = useState('');
    const [adminId, setAdminId] = useState('');
    const [error, setError] = useState('');
    const [savedUsers, setSavedUsers] = useState<User[]>([]);
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [resetStep, setResetStep] = useState<'email' | 'otp' | 'password'>('email');
    const [mode, setMode] = useState<'login' | 'register' | 'admin' | 'forgot'>('login');

    React.useEffect(() => {
        loadUsers();
    }, []);

    const loadUsers = async () => {
        const users = await getRecentUsers();
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
                await saveRecentUser(user);
                onLogin(user);
            } else {
                // REGISTRATION: Must be @gmail.com
                if (!email.toLowerCase().endsWith('@gmail.com')) {
                    setError('Only real Gmail addresses (@gmail.com) are allowed for registration');
                    return;
                }
                const user = await createUser(name, email, password);
                await saveRecentUser(user);
                onLogin(user);
            }
        } catch (e: any) {
            setError(e.message || 'An error occurred');
        }
    };

    const handleQuickLogin = async (userEmail: string) => {
        try {
            const user = await loginUser(userEmail);
            await saveRecentUser(user);
            onLogin(user);
        } catch (e: any) {
            setError(e.message);
        }
    };

    const handleRemoveQuickLogin = (user: User) => {
        Alert.alert(
            'Remove Profile',
            `Remove ${user.name} from Quick Login? This will not delete the account.`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Remove',
                    style: 'destructive',
                    onPress: async () => {
                        await removeRecentUser(user.email);
                        loadUsers();
                    }
                }
            ]
        );
    };

    const switchMode = (newMode: 'login' | 'register' | 'admin' | 'forgot') => {
        setMode(newMode);
        setError('');
        setEmail('');
        setName('');
        setPassword('');
        setAdminId('');
        setOtp('');
        setNewPassword('');
        setResetStep('email');
    };

    const handleResetRequest = async () => {
        if (!email) {
            setError('Please enter your email');
            return;
        }
        if (!email.toLowerCase().endsWith('@gmail.com')) {
            setError('Only Gmail addresses (@gmail.com) are supported for password reset');
            return;
        }
        setLoading(true);
        setError('');
        try {
            await requestPasswordResetOTP(email);
            setResetStep('otp');
            setError('OTP sent! Please check your Gmail (Inbox and Spam).');
            setTimeout(() => setError(''), 5000);
        } catch (e: any) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOTP = async () => {
        if (!otp) {
            setError('Please enter the OTP');
            return;
        }
        setLoading(true);
        setError('');
        try {
            await verifyPasswordResetOTP(email, otp);
            setResetStep('password');
        } catch (e: any) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    };

    const handlePasswordReset = async () => {
        if (!newPassword) {
            setError('Please enter a new password');
            return;
        }
        setLoading(true);
        setError('');
        try {
            await resetUserPassword(email, newPassword);
            setError('Password reset successful! Please login.');
            setTimeout(() => {
                switchMode('login');
            }, 2000);
        } catch (e: any) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
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
                            <View style={styles.passwordContainer}>
                                <TextInput
                                    style={styles.passwordInput}
                                    placeholder="Password"
                                    placeholderTextColor="#a8a29e"
                                    value={password}
                                    onChangeText={setPassword}
                                    secureTextEntry={!showPassword}
                                />
                                <TouchableOpacity
                                    style={styles.eyeIcon}
                                    onPress={() => setShowPassword(!showPassword)}
                                >
                                    {showPassword ? (
                                        <EyeOff size={20} color="#a8a29e" />
                                    ) : (
                                        <Eye size={20} color="#a8a29e" />
                                    )}
                                </TouchableOpacity>
                            </View>
                        </>
                    ) : mode === 'forgot' ? (
                        <>
                            {resetStep === 'email' && (
                                <>
                                    <View style={styles.resetHeader}>
                                        <Text style={styles.resetTitle}>Reset Password</Text>
                                        <Text style={styles.resetSubtitle}>Enter your email to receive a code</Text>
                                    </View>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Student Email"
                                        placeholderTextColor="#a8a29e"
                                        value={email}
                                        onChangeText={setEmail}
                                        keyboardType="email-address"
                                        autoCapitalize="none"
                                    />
                                    <TouchableOpacity
                                        style={[styles.primaryButton, loading && { opacity: 0.7 }]}
                                        onPress={handleResetRequest}
                                        disabled={loading}
                                    >
                                        <Text style={styles.primaryButtonText}>{loading ? 'Sending...' : 'Send OTP'}</Text>
                                    </TouchableOpacity>
                                </>
                            )}
                            {resetStep === 'otp' && (
                                <>
                                    <View style={styles.resetHeader}>
                                        <Text style={styles.resetTitle}>Verify OTP</Text>
                                        <Text style={styles.resetSubtitle}>Enter the 6-digit code sent to {email}</Text>
                                    </View>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Enter 6-digit code"
                                        placeholderTextColor="#a8a29e"
                                        value={otp}
                                        onChangeText={setOtp}
                                        keyboardType="number-pad"
                                        maxLength={6}
                                    />
                                    <TouchableOpacity
                                        style={[styles.primaryButton, loading && { opacity: 0.7 }]}
                                        onPress={handleVerifyOTP}
                                        disabled={loading}
                                    >
                                        <Text style={styles.primaryButtonText}>{loading ? 'Verifying...' : 'Verify Code'}</Text>
                                    </TouchableOpacity>
                                </>
                            )}
                            {resetStep === 'password' && (
                                <>
                                    <View style={styles.resetHeader}>
                                        <Text style={styles.resetTitle}>New Password</Text>
                                        <Text style={styles.resetSubtitle}>Set your new sanctuary password</Text>
                                    </View>
                                    <View style={styles.passwordContainer}>
                                        <TextInput
                                            style={styles.passwordInput}
                                            placeholder="New Password"
                                            placeholderTextColor="#a8a29e"
                                            value={newPassword}
                                            onChangeText={setNewPassword}
                                            secureTextEntry={!showPassword}
                                        />
                                        <TouchableOpacity
                                            style={styles.eyeIcon}
                                            onPress={() => setShowPassword(!showPassword)}
                                        >
                                            {showPassword ? (
                                                <EyeOff size={20} color="#a8a29e" />
                                            ) : (
                                                <Eye size={20} color="#a8a29e" />
                                            )}
                                        </TouchableOpacity>
                                    </View>
                                    <TouchableOpacity
                                        style={[styles.primaryButton, loading && { opacity: 0.7 }]}
                                        onPress={handlePasswordReset}
                                        disabled={loading}
                                    >
                                        <Text style={styles.primaryButtonText}>{loading ? 'Updating...' : 'Reset Password'}</Text>
                                    </TouchableOpacity>
                                </>
                            )}
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
                            <View style={styles.passwordContainer}>
                                <TextInput
                                    style={styles.passwordInput}
                                    placeholder="Password"
                                    placeholderTextColor="#a8a29e"
                                    value={password}
                                    onChangeText={setPassword}
                                    secureTextEntry={!showPassword}
                                />
                                <TouchableOpacity
                                    style={styles.eyeIcon}
                                    onPress={() => setShowPassword(!showPassword)}
                                >
                                    {showPassword ? (
                                        <EyeOff size={20} color="#a8a29e" />
                                    ) : (
                                        <Eye size={20} color="#a8a29e" />
                                    )}
                                </TouchableOpacity>
                            </View>
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

                    {isStudent && mode === 'login' && (
                        <TouchableOpacity
                            style={styles.ghostButton}
                            onPress={() => switchMode('forgot')}
                        >
                            <Text style={[styles.ghostButtonText, { textDecorationLine: 'underline' }]}>Forgot Password?</Text>
                        </TouchableOpacity>
                    )}

                    {mode === 'forgot' && (
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
                                    onLongPress={() => handleRemoveQuickLogin(u)}
                                    delayLongPress={500}
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
            {mode !== 'forgot' && (
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
            )}
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
    passwordContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#e7e5e4',
        borderRadius: 12,
        paddingRight: 12,
    },
    passwordInput: {
        flex: 1,
        paddingHorizontal: 20,
        paddingVertical: 16,
        fontSize: 16,
        color: '#1c1917'
    },
    eyeIcon: {
        padding: 8,
    },
    resetHeader: {
        marginBottom: 16,
        marginTop: 8,
    },
    resetTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#3E2723',
    },
    resetSubtitle: {
        fontSize: 14,
        color: '#78716c',
        marginTop: 4,
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
