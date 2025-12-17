
import React, { useState, useEffect } from 'react';
import { X, Search, Sparkles, BookOpen, Save } from 'lucide-react';
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

  const handleAISearch = async () => {
    if (!query) return;
    setIsSearching(true);
    try {
      const details = await generateBookDetails(query);
      setFormData(prev => ({
        ...prev,
        ...details,
        // Keep a random image if none provided, or map if we had an image API
        coverUrl: `https://picsum.photos/seed/${encodeURIComponent(details.title)}/200/300`
      }));
    } catch (error) {
      alert("Failed to fetch book details. Please enter manually.");
    } finally {
      setIsSearching(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (initialBook && onEdit) {
      onEdit({
        ...initialBook,
        ...formData,
      });
    } else {
      onAdd({
        ...formData,
        status: BookStatus.Available
      });
    }
    onClose();
  };

  // Requested styling: light grey background, white font, black border
  const inputClassName = "w-full px-4 py-2 border border-black rounded-lg focus:ring-2 focus:ring-shoseki-brown focus:outline-none bg-stone-400 text-white placeholder:text-stone-200";

  return (
    <div className="absolute inset-0 z-[70] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-stone-900 rounded-3xl shadow-2xl w-full max-w-[400px] overflow-hidden flex flex-col max-h-[80vh] border border-stone-200 dark:border-stone-800">
        <div className="bg-shoseki-brown dark:bg-stone-950 p-4 flex justify-between items-center text-white border-b border-white/10">
          <h2 className="font-serif font-bold text-xl flex items-center gap-2">
            <BookOpen size={20} /> {initialBook ? 'Edit Book' : 'Add New Book'}
          </h2>
          <button onClick={onClose} className="hover:bg-white/20 p-1 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto no-scrollbar">
          {/* AI Auto-fill Section - Only for Adding */}
          {!initialBook && (
            <div className="mb-6 bg-shoseki-cream dark:bg-stone-800 p-4 rounded-xl border border-shoseki-sand dark:border-stone-700">
              <label className="block text-xs font-bold text-shoseki-accent dark:text-amber-500 uppercase tracking-wider mb-2">
                AI Auto-fill
              </label>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Enter title or ISBN..."
                  className="flex-1 px-4 py-2 border border-shoseki-sand dark:border-stone-600 rounded-lg focus:ring-2 focus:ring-shoseki-brown focus:outline-none dark:bg-stone-700 dark:text-white"
                  onKeyDown={(e) => e.key === 'Enter' && handleAISearch()}
                />
                <Button onClick={handleAISearch} disabled={isSearching} variant="secondary">
                  {isSearching ? <Sparkles className="animate-pulse" /> : <Search size={18} />}
                </Button>
              </div>
            </div>
          )}

          <form id="addBookForm" onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">Title</label>
                <input required type="text" className={inputClassName} value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">Author</label>
                    <input required type="text" className={inputClassName} value={formData.author} onChange={e => setFormData({...formData, author: e.target.value})} />
                </div>
                <div>
                    <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">ISBN</label>
                    <input type="text" placeholder="Optional" className={inputClassName} value={formData.isbn} onChange={e => setFormData({...formData, isbn: e.target.value})} />
                </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">Genre</label>
                    <input required type="text" className={inputClassName} value={formData.genre} onChange={e => setFormData({...formData, genre: e.target.value})} />
                </div>
                <div>
                    <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">Pages</label>
                    <input required type="number" className={inputClassName} value={formData.pages} onChange={e => setFormData({...formData, pages: parseInt(e.target.value) || 0})} />
                </div>
            </div>
            <div>
                 <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">Shelf Location</label>
                 <input type="text" placeholder="e.g. A-12" className={inputClassName} value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} />
            </div>
            <div>
                <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">Cover URL</label>
                <input type="text" className={inputClassName} value={formData.coverUrl} onChange={e => setFormData({...formData, coverUrl: e.target.value})} />
            </div>
            <div>
                <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">Description</label>
                <textarea rows={3} className={inputClassName} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
            </div>
          </form>
        </div>

        <div className="p-4 border-t border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 flex justify-end gap-3">
          <Button variant="ghost" onClick={onClose} type="button">Cancel</Button>
          <Button variant="primary" type="submit" form="addBookForm">
             {initialBook ? <><Save size={16}/> Save Changes</> : 'Add Book'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AddBookModal;
