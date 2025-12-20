import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Modal,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Image
} from 'react-native';
import { X, Search, Sparkles, BookOpen, Save, Camera, Pencil } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import Button from './Button';
import { generateBookDetails } from '../services/geminiService';
import { Book, BookStatus } from '../types';

interface AddBookModalProps {
  onClose: () => void;
  onAdd: (book: Omit<Book, 'id' | 'addedAt'>) => void;
  onEdit?: (book: Book) => void;
  initialBook?: Book | null;
}

const AddBookModal: React.FC<AddBookModalProps> = ({ onClose, onAdd, onEdit, initialBook }) => {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    author: '',
    isbn: '',
    genre: '',
    description: '',
    pages: 0,
    coverUrl: 'https://picsum.photos/200/300',
    location: '',
  });

  useEffect(() => {
    if (initialBook) {
      setFormData({
        title: initialBook.title,
        author: initialBook.author,
        isbn: initialBook.isbn || '',
        genre: initialBook.genre,
        description: initialBook.description,
        pages: initialBook.pages,
        coverUrl: initialBook.coverUrl,
        location: initialBook.location || '',
      });
    }
  }, [initialBook]);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [2, 3], // Book cover aspect ratio
      quality: 0.5,
    });

    if (!result.canceled) {
      setFormData(prev => ({ ...prev, coverUrl: result.assets[0].uri }));
    }
  };

  const handleAISearch = async () => {
    if (!query) return;
    setIsSearching(true);
    try {
      const details = await generateBookDetails(query);
      setFormData(prev => ({
        ...prev,
        ...details,
        coverUrl: `https://picsum.photos/seed/${encodeURIComponent(details.title)}/200/300`
      }));
    } catch (error) {
      Alert.alert("Error", "Failed to fetch book details. Please enter manually.");
    } finally {
      setIsSearching(false);
    }
  };

  const handleSubmit = () => {
    if (!formData.title || !formData.author || !formData.genre) {
      Alert.alert("Error", "Please fill in all required fields.");
      return;
    }

    if (initialBook && onEdit) {
      onEdit({
        ...initialBook,
        ...formData,
      });
    } else {
      onAdd({
        ...formData,
        status: BookStatus.Available,
        rating: 0
      });
    }
    onClose();
  };

  return (
    <Modal
      visible={true}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitle}>
              <BookOpen size={20} color="#fff" />
              <Text style={styles.headerText}>
                {initialBook ? 'Edit Book' : 'Add New Book'}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={20} color="#fff" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* AI Auto-fill */}
            {!initialBook && (
              <View style={styles.aiSection}>
                <Text style={styles.aiLabel}>AI Auto-fill</Text>
                <View style={styles.aiRow}>
                  <TextInput
                    style={styles.aiInput}
                    value={query}
                    onChangeText={setQuery}
                    placeholder="Enter title or ISBN..."
                    placeholderTextColor="#a8a29e"
                    onSubmitEditing={handleAISearch}
                  />
                  <TouchableOpacity
                    style={styles.aiButton}
                    onPress={handleAISearch}
                    disabled={isSearching}
                  >
                    {isSearching ? (
                      <Sparkles size={18} color="#5D4037" />
                    ) : (
                      <Search size={18} color="#5D4037" />
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Form Fields */}
            <View style={styles.form}>
              <View style={styles.field}>
                <Text style={styles.label}>Title *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.title}
                  onChangeText={(text) => setFormData({ ...formData, title: text })}
                  placeholder="Book title"
                  placeholderTextColor="#a8a29e"
                />
              </View>

              <View style={styles.row}>
                <View style={[styles.field, { flex: 1 }]}>
                  <Text style={styles.label}>Author *</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.author}
                    onChangeText={(text) => setFormData({ ...formData, author: text })}
                    placeholder="Author name"
                    placeholderTextColor="#a8a29e"
                  />
                </View>
                <View style={[styles.field, { flex: 1 }]}>
                  <Text style={styles.label}>ISBN</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.isbn}
                    onChangeText={(text) => setFormData({ ...formData, isbn: text })}
                    placeholder="Optional"
                    placeholderTextColor="#a8a29e"
                  />
                </View>
              </View>

              <View style={styles.row}>
                <View style={[styles.field, { flex: 1 }]}>
                  <Text style={styles.label}>Genre *</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.genre}
                    onChangeText={(text) => setFormData({ ...formData, genre: text })}
                    placeholder="Genre"
                    placeholderTextColor="#a8a29e"
                  />
                </View>
                <View style={[styles.field, { flex: 1 }]}>
                  <Text style={styles.label}>Pages</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.pages.toString()}
                    onChangeText={(text) => setFormData({ ...formData, pages: parseInt(text) || 0 })}
                    placeholder="0"
                    placeholderTextColor="#a8a29e"
                    keyboardType="numeric"
                  />
                </View>
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>Shelf Location</Text>
                <TextInput
                  style={styles.input}
                  value={formData.location}
                  onChangeText={(text) => setFormData({ ...formData, location: text })}
                  placeholder="e.g. A-12"
                  placeholderTextColor="#a8a29e"
                />
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>Cover Image</Text>
                <TouchableOpacity onPress={pickImage} style={styles.imagePicker}>
                  {formData.coverUrl ? (
                    <Image source={{ uri: formData.coverUrl }} style={styles.coverPreview} />
                  ) : (
                    <View style={styles.placeholderCover}>
                      <Camera size={24} color="#a8a29e" />
                      <Text style={styles.placeholderText}>Tap to add cover</Text>
                    </View>
                  )}
                  <View style={styles.editBadge}>
                    <Pencil size={12} color="#fff" />
                  </View>
                </TouchableOpacity>
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>Description</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={formData.description}
                  onChangeText={(text) => setFormData({ ...formData, description: text })}
                  placeholder="Book description..."
                  placeholderTextColor="#a8a29e"
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                />
              </View>
            </View>

            <View style={{ height: 20 }} />
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            <Button variant="ghost" onPress={onClose}>
              <Text style={styles.cancelText}>Cancel</Text>
            </Button>
            <Button onPress={handleSubmit} style={{ flex: 1 }}>
              {initialBook ? (
                <>
                  <Save size={16} color="#fff" />
                  <Text style={styles.submitText}>Save Changes</Text>
                </>
              ) : (
                <Text style={styles.submitText}>Add Book</Text>
              )}
            </Button>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  container: {
    backgroundColor: '#fff',
    borderRadius: 24,
    width: '100%',
    maxHeight: '90%',
    overflow: 'hidden',
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
    fontSize: 18,
    fontWeight: '700',
  },
  closeButton: {
    padding: 4,
  },
  content: {
    padding: 20,
    maxHeight: 500,
  },
  aiSection: {
    backgroundColor: '#fef3c7',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  aiLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#d97706',
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  aiRow: {
    flexDirection: 'row',
    gap: 8,
  },
  aiInput: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#1c1917',
  },
  aiButton: {
    backgroundColor: '#D7CCC8',
    padding: 12,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  form: {
    gap: 16,
  },
  field: {
    gap: 4,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#57534e',
  },
  input: {
    backgroundColor: '#a8a29e',
    borderWidth: 1,
    borderColor: '#000',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
    color: '#fff',
  },
  textArea: {
    height: 80,
    paddingTop: 10,
  },
  footer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#f5f5f4',
    backgroundColor: '#fafaf9',
  },
  cancelText: {
    color: '#5D4037',
    fontWeight: '600',
  },
  submitText: {
    color: '#fff',
    fontWeight: '600',
  },
  imagePicker: {
    height: 200,
    backgroundColor: '#f5f5f4',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e7e5e4',
    justifyContent: 'center',
    alignItems: 'center',
  },
  coverPreview: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  placeholderCover: {
    alignItems: 'center',
    gap: 8,
  },
  placeholderText: {
    color: '#a8a29e',
    fontSize: 14,
    fontWeight: '500',
  },
  editBadge: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    backgroundColor: '#5D4037',
    padding: 8,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
});

export default AddBookModal;
