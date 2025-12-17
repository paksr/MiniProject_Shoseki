import React, { useState } from 'react';
import {
    View, Text, TextInput, TouchableOpacity,
    ScrollView, StyleSheet, Image
} from 'react-native';
import { Search, MapPin } from 'lucide-react-native';
import { Book } from '../types';

interface FloorPlanScreenProps {
    books: Book[];
    onBookClick: (book: Book) => void;
}

const FloorPlanScreen: React.FC<FloorPlanScreenProps> = ({ books, onBookClick }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedBook, setSelectedBook] = useState<Book | null>(null);

    const rows = ['A', 'B', 'C', 'D', 'E', 'F'];
    const cols = 12;

    const getCoordinates = (locStr?: string) => {
        if (!locStr) return null;
        const match = locStr.match(/Shelf ([A-F])-(\d+)/);
        if (match) {
            return { row: match[1], col: parseInt(match[2]) };
        }
        return null;
    };

    const targetCoords = selectedBook ? getCoordinates(selectedBook.location) : null;

    const searchResults = searchTerm
        ? books.filter(b =>
            b.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            b.author.toLowerCase().includes(searchTerm.toLowerCase())
        )
        : [];

    const handleSelectBook = (book: Book) => {
        setSelectedBook(book);
        setSearchTerm('');
    };

    return (
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.title}>Floor Plan</Text>
                <Text style={styles.subtitle}>Find books and shelves location</Text>
            </View>

            {/* Search Input */}
            <View style={styles.searchContainer}>
                <Search size={18} color="#a8a29e" />
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search book to locate..."
                    placeholderTextColor="#a8a29e"
                    value={searchTerm}
                    onChangeText={setSearchTerm}
                />
            </View>

            {/* Search Results Dropdown */}
            {searchTerm && searchResults.length > 0 && (
                <View style={styles.dropdown}>
                    {searchResults.slice(0, 5).map(book => (
                        <TouchableOpacity
                            key={book.id}
                            style={styles.dropdownItem}
                            onPress={() => handleSelectBook(book)}
                        >
                            <View style={styles.dropdownInfo}>
                                <Text style={styles.dropdownTitle} numberOfLines={1}>{book.title}</Text>
                                <Text style={styles.dropdownAuthor}>{book.author}</Text>
                            </View>
                            <View style={styles.dropdownLocation}>
                                <Text style={styles.dropdownLocationText}>{book.location || 'N/A'}</Text>
                            </View>
                        </TouchableOpacity>
                    ))}
                </View>
            )}

            {/* Selected Book Card */}
            {selectedBook && (
                <TouchableOpacity
                    style={styles.selectedCard}
                    onPress={() => onBookClick(selectedBook)}
                >
                    <View style={styles.selectedInfo}>
                        <Text style={styles.selectedTitle}>{selectedBook.title}</Text>
                        <Text style={styles.selectedAuthor}>{selectedBook.author}</Text>
                        <View style={styles.selectedLocation}>
                            <MapPin size={14} color="#5D4037" />
                            <Text style={styles.selectedLocationText}>Location: {selectedBook.location}</Text>
                        </View>
                    </View>
                    <Image
                        source={{ uri: selectedBook.coverUrl }}
                        style={styles.selectedCover}
                    />
                </TouchableOpacity>
            )}

            {/* Library Map */}
            <View style={styles.mapContainer}>
                <Text style={styles.mapLabel}>LIBRARY MAP</Text>

                {/* Legend */}
                <View style={styles.legend}>
                    <View style={styles.legendItem}>
                        <View style={styles.legendShelf} />
                        <Text style={styles.legendText}>SHELF</Text>
                    </View>
                    <View style={styles.legendItem}>
                        <View style={styles.legendTarget} />
                        <Text style={styles.legendTargetText}>TARGET</Text>
                    </View>
                </View>

                {/* Grid */}
                <View style={styles.grid}>
                    {rows.map(row => (
                        <View key={row} style={styles.gridRow}>
                            <View style={styles.rowLabel}>
                                <Text style={styles.rowLabelText}>{row}</Text>
                            </View>
                            <View style={styles.shelfRow}>
                                {Array.from({ length: cols }, (_, i) => i + 1).map(col => {
                                    const isTarget = targetCoords?.row === row && targetCoords?.col === col;
                                    return (
                                        <View
                                            key={`${row}-${col}`}
                                            style={[
                                                styles.shelf,
                                                isTarget && styles.shelfTarget
                                            ]}
                                        />
                                    );
                                })}
                            </View>
                        </View>
                    ))}
                </View>

                {/* Entrance */}
                <View style={styles.entrance}>
                    <Text style={styles.entranceText}>Front Desk Entrance ↓</Text>
                    <View style={styles.entranceLine} />
                </View>
            </View>

            <View style={{ height: 100 }} />
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f4',
        padding: 16,
    },
    header: {
        marginTop: 8,
        marginBottom: 16,
    },
    title: {
        fontSize: 28,
        fontWeight: '700',
        color: '#5D4037',
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 14,
        color: '#78716c',
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#e7e5e4',
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 12,
        gap: 10,
        marginBottom: 16,
    },
    searchInput: {
        flex: 1,
        fontSize: 15,
        color: '#1c1917',
    },
    dropdown: {
        backgroundColor: '#fff',
        borderRadius: 12,
        marginTop: -8,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 8,
        overflow: 'hidden',
    },
    dropdownItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f5f5f4',
    },
    dropdownInfo: {
        flex: 1,
    },
    dropdownTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#1c1917',
        marginBottom: 2,
    },
    dropdownAuthor: {
        fontSize: 12,
        color: '#78716c',
    },
    dropdownLocation: {
        backgroundColor: '#f5f5f4',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
    },
    dropdownLocationText: {
        fontSize: 10,
        color: '#78716c',
        fontFamily: 'monospace',
    },
    selectedCard: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        padding: 12,
        borderRadius: 12,
        borderLeftWidth: 4,
        borderLeftColor: '#5D4037',
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    selectedInfo: {
        flex: 1,
    },
    selectedTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#3E2723',
        marginBottom: 2,
    },
    selectedAuthor: {
        fontSize: 12,
        color: '#78716c',
        marginBottom: 8,
    },
    selectedLocation: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    selectedLocationText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#5D4037',
    },
    selectedCover: {
        width: 48,
        height: 64,
        borderRadius: 6,
        backgroundColor: '#e7e5e4',
    },
    mapContainer: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: '#e7e5e4',
    },
    mapLabel: {
        fontSize: 10,
        color: '#a8a29e',
        fontWeight: '600',
        letterSpacing: 2,
        marginBottom: 16,
    },
    legend: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 24,
        marginBottom: 20,
    },
    legendItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    legendShelf: {
        width: 12,
        height: 12,
        backgroundColor: '#d6d3d1',
        borderRadius: 2,
    },
    legendText: {
        fontSize: 10,
        color: '#78716c',
        fontWeight: '600',
    },
    legendTarget: {
        width: 12,
        height: 12,
        backgroundColor: '#5D4037',
        borderRadius: 2,
    },
    legendTargetText: {
        fontSize: 10,
        color: '#5D4037',
        fontWeight: '700',
    },
    grid: {
        gap: 8,
        alignItems: 'center',
    },
    gridRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    rowLabel: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: '#f5f5f4',
        justifyContent: 'center',
        alignItems: 'center',
    },
    rowLabelText: {
        fontSize: 11,
        fontWeight: '700',
        color: '#a8a29e',
    },
    shelfRow: {
        flexDirection: 'row',
        gap: 4,
    },
    shelf: {
        width: 18,
        height: 24,
        backgroundColor: '#d6d3d1',
        borderRadius: 2,
    },
    shelfTarget: {
        backgroundColor: '#5D4037',
        transform: [{ scale: 1.2 }],
        shadowColor: '#5D4037',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.4,
        shadowRadius: 4,
        elevation: 4,
    },
    entrance: {
        alignItems: 'center',
        marginTop: 20,
    },
    entranceText: {
        fontSize: 10,
        color: '#a8a29e',
        fontStyle: 'italic',
        marginBottom: 4,
    },
    entranceLine: {
        width: 80,
        height: 3,
        backgroundColor: '#e7e5e4',
        borderRadius: 2,
    },
});

export default FloorPlanScreen;
