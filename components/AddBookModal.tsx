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
import { X, BookOpen, Save, Camera, Pencil } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import Button from './Button';

import { Book, BookStatus } from '../types';

interface AddBookModalProps {
  onClose: () => void;
  onAdd: (book: Omit<Book, 'id' | 'addedAt'>) => void;
  onEdit?: (book: Book) => void;
  initialBook?: Book | null;
}

const AddBookModal: React.FC<AddBookModalProps> = ({ onClose, onAdd, onEdit, initialBook }) => {

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

  // Location State
  const [selectedRow, setSelectedRow] = useState<string>('A');
  const [selectedCol, setSelectedCol] = useState<number>(1);

  const rows = ['A', 'B', 'C', 'D', 'E', 'F'];
  const cols = Array.from({ length: 12 }, (_, i) => i + 1);

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

      // Parse Location
      if (initialBook.location) {
        const match = initialBook.location.match(/Shelf ([A-F])-(\d+)/) || initialBook.location.match(/([A-F])-(\d+)/);
        if (match) {
          setSelectedRow(match[1]);
          setSelectedCol(parseInt(match[2]));
        }
      }
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



  const handleSubmit = () => {
    if (!formData.title || !formData.author || !formData.genre) {
      Alert.alert("Error", "Please fill in all required fields.");
      return;
    }

    if (initialBook && onEdit) {
      onEdit({
        ...initialBook,
        ...formData,
        location: `Shelf ${selectedRow}-${selectedCol}`,
      });
    } else {
      onAdd({
        ...formData,
        location: `Shelf ${selectedRow}-${selectedCol}`,
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

                <View style={styles.locationContainer}>
                  {/* Row Selection */}
                  <View>
                    <Text style={styles.subLabel}>Row</Text>
                    <View style={styles.rowSelector}>
                      {rows.map(row => (
                        <TouchableOpacity
                          key={row}
                          style={[styles.rowButton, selectedRow === row && styles.rowButtonSelected]}
                          onPress={() => setSelectedRow(row)}
                        >
                          <Text style={[styles.rowButtonText, selectedRow === row && styles.rowButtonTextSelected]}>
                            {row}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>

                  {/* Column Selection */}
                  <View>
                    <Text style={styles.subLabel}>Column</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.colScroll}>
                      {cols.map(col => (
                        <TouchableOpacity
                          key={col}
                          style={[styles.colButton, selectedCol === col && styles.colButtonSelected]}
                          onPress={() => setSelectedCol(col)}
                        >
                          <Text style={[styles.colButtonText, selectedCol === col && styles.colButtonTextSelected]}>
                            {col}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>

                  {/* Preview */}
                  <View style={styles.locationPreview}>
                    <Text style={styles.locationPreviewText}>
                      Selected: Shelf {selectedRow}-{selectedCol}
                    </Text>
                  </View>
                </View>
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
  locationContainer: {
    backgroundColor: '#f5f5f4',
    padding: 12,
    borderRadius: 12,
    gap: 16,
  },
  subLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#78716c',
    marginBottom: 8,
  },
  rowSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 4,
  },
  rowButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e7e5e4',
  },
  rowButtonSelected: {
    backgroundColor: '#5D4037',
    borderColor: '#5D4037',
  },
  rowButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#57534e',
  },
  rowButtonTextSelected: {
    color: '#fff',
  },
  colScroll: {
    flexGrow: 0,
  },
  colButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e7e5e4',
    marginRight: 8,
  },
  colButtonSelected: {
    backgroundColor: '#5D4037',
    borderColor: '#5D4037',
  },
  colButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#57534e',
  },
  colButtonTextSelected: {
    color: '#fff',
  },
  locationPreview: {
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#e7e5e4',
  },
  locationPreviewText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#5D4037',
  },
});

export default AddBookModal;
