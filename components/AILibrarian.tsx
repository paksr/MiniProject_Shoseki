// AILibrarian.tsx
import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Animated,
  PanResponder,
} from 'react-native';
import { MessageSquare, X, Send, Sparkles } from 'lucide-react-native';
import { chatWithLibrarian } from '../services/geminiService';
import { ChatMessage } from '../types';

const AILibrarian: React.FC = () => {
  // UI state
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'model',
      text: 'Greetings. I am Shoseki, your library assistant. How may I assist your literary journey today?',
      timestamp: new Date(),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const flatListRef = useRef<FlatList>(null);

  // ---------- Draggable FAB ----------
  const fabPan = useRef(new Animated.ValueXY()).current;
  const fabResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        // @ts-ignore – internal value for offset
        fabPan.setOffset({ x: (fabPan.x as any)._value, y: (fabPan.y as any)._value });
        fabPan.setValue({ x: 0, y: 0 });
      },
      onPanResponderMove: Animated.event([null, { dx: fabPan.x, dy: fabPan.y }], { useNativeDriver: false }),
      onPanResponderRelease: () => {
        fabPan.flattenOffset();
      },
    })
  ).current;

  // ---------- Draggable Chat Window ----------
  const chatPan = useRef(new Animated.ValueXY()).current;
  const chatResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        // @ts-ignore – internal value for offset
        chatPan.setOffset({ x: (chatPan.x as any)._value, y: (chatPan.y as any)._value });
        chatPan.setValue({ x: 0, y: 0 });
      },
      onPanResponderMove: Animated.event([null, { dx: chatPan.x, dy: chatPan.y }], { useNativeDriver: false }),
      onPanResponderRelease: () => {
        chatPan.flattenOffset();
      },
    })
  ).current;

  // ---------- Message handling ----------
  const handleSend = async () => {
    if (!inputText.trim()) return;
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: inputText,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsLoading(true);
    try {
      const history = messages.map(m => ({ role: m.role === 'model' ? 'model' : 'user', parts: [{ text: m.text }] }));
      const responseText = await chatWithLibrarian(history, userMsg.text);
      const botMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: responseText || "I'm having trouble reading the archives right now.",
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, botMsg]);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const renderMessage = ({ item }: { item: ChatMessage }) => (
    <View style={[styles.messageContainer, item.role === 'user' ? styles.userMessage : styles.botMessage]}>
      <Text style={[styles.messageText, item.role === 'user' ? styles.userMessageText : styles.botMessageText]}>{item.text}</Text>
    </View>
  );

  // ---------- Render ----------
  if (!isOpen) {
    return (
      <Animated.View style={[styles.fab, { transform: fabPan.getTranslateTransform() }]} {...fabResponder.panHandlers}>
        <TouchableOpacity onPress={() => setIsOpen(true)} activeOpacity={0.8}>
          <Sparkles size={24} color="#fff" />
        </TouchableOpacity>
      </Animated.View>
    );
  }

  return (
    <Animated.View style={[styles.chatContainer, { transform: chatPan.getTranslateTransform() }]} {...chatResponder.panHandlers}>
      <KeyboardAvoidingView style={styles.chatInner} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTitle}>
            <Sparkles size={18} color="#fef08a" />
            <Text style={styles.headerText}>Librarian</Text>
          </View>
          <TouchableOpacity onPress={() => setIsOpen(false)}>
            <X size={18} color="#fff" />
          </TouchableOpacity>
        </View>
        {/* Messages */}
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={item => item.id}
          style={styles.messagesList}
          contentContainerStyle={styles.messagesContent}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
          ListFooterComponent={
            isLoading ? (
              <View style={[styles.messageContainer, styles.botMessage]}>
                <Text style={styles.loadingText}>Consulting the archives...</Text>
              </View>
            ) : null
          }
        />
        {/* Input */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Ask for a recommendation..."
            placeholderTextColor="#a8a29e"
            onSubmitEditing={handleSend}
          />
          <TouchableOpacity
            style={[styles.sendButton, (!inputText.trim() || isLoading) && styles.sendButtonDisabled]}
            onPress={handleSend}
            disabled={isLoading || !inputText.trim()}
          >
            <Send size={18} color="#fff" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    bottom: 240,
    right: 16,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#5D4037',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  chatContainer: {
    position: 'absolute',
    bottom: 100,
    left: 16,
    right: 16,
    height: 450,
    backgroundColor: '#fff',
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 10,
  },
  chatInner: {
    flex: 1,
  },
  header: {
    backgroundColor: '#5D4037',
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  messagesList: {
    flex: 1,
    backgroundColor: '#fefce8',
  },
  messagesContent: {
    padding: 16,
  },
  messageContainer: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 16,
    marginBottom: 8,
  },
  userMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#5D4037',
    borderBottomRightRadius: 4,
  },
  botMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#e7e5e4',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
  },
  userMessageText: {
    color: '#fff',
  },
  botMessageText: {
    color: '#1c1917',
  },
  loadingText: {
    fontSize: 12,
    color: '#78716c',
    fontStyle: 'italic',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 12,
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: '#f5f5f4',
    backgroundColor: '#fff',
  },
  input: {
    flex: 1,
    backgroundColor: '#fafaf9',
    borderWidth: 1,
    borderColor: '#e7e5e4',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
    color: '#1c1917',
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#5D4037',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
});

export default AILibrarian;