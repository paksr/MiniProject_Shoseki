
import React, { useState } from 'react';
import { X, BookOpen, MapPin, Hash, Layers, Calendar, ShoppingBag, Pencil, Share2, Heart } from 'lucide-react';
import { Book, BookStatus } from '../types';
import Button from './Button';

interface BookDetailsModalProps {
  book: Book;
  onClose: () => void;
  isAdmin: boolean;
  onAddToCart?: (book: Book) => void;
  onEdit?: (book: Book) => void;
  isInCart?: boolean;
}

const BookDetailsModal: React.FC<BookDetailsModalProps> = ({ 
  book, onClose, isAdmin, onAddToCart, onEdit, isInCart 
}) => {
  const [imgError, setImgError] = useState(false);
  const PLACEHOLDER_IMAGE = "https://images.unsplash.com/photo-1524578271613-d550eacf6090?q=80&w=600&auto=format&fit=crop";

  return (
    <div className="absolute inset-0 z-[60] flex items-end sm:items-center justify-center sm:p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-stone-900 w-full max-w-[440px] h-[85vh] sm:h-[800px] sm:max-h-[90vh] sm:rounded-3xl rounded-t-[32px] shadow-2xl overflow-hidden flex flex-col relative animate-slide-up">
        
        {/* Close Button (Floating) */}
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 z-20 p-2 bg-black/20 hover:bg-black/30 backdrop-blur-md rounded-full text-white transition-colors"
        >
          <X size={20} />
        </button>

        {/* Hero Image */}
        <div className="relative h-[40%] shrink-0 w-full bg-stone-200 dark:bg-stone-800">
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10" />
            <img 
                src={imgError || !book.coverUrl ? PLACEHOLDER_IMAGE : book.coverUrl} 
                alt={book.title} 
                onError={() => setImgError(true)}
                className="w-full h-full object-cover" 
            />
            
            {/* Title Overlay */}
            <div className="absolute bottom-0 left-0 right-0 p-6 z-20">
                <span className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold uppercase mb-2 tracking-wider ${
                    book.status === BookStatus.Available ? 'bg-emerald-500 text-white' :
                    book.status === BookStatus.OnLoan ? 'bg-amber-500 text-white' :
                    'bg-red-500 text-white'
                }`}>
                    {book.status}
                </span>
                <h2 className="text-2xl font-serif font-bold text-white leading-tight mb-1 drop-shadow-md">
                    {book.title}
                </h2>
                <p className="text-stone-200 font-medium drop-shadow-sm">{book.author}</p>
            </div>
        </div>

        {/* Content Scrollable */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-white dark:bg-stone-900 no-scrollbar">
            
            {/* Description */}
            <div>
                <h3 className="font-bold text-stone-800 dark:text-stone-200 mb-2">Synopsis</h3>
                <p className="text-sm text-stone-600 dark:text-stone-400 leading-relaxed">
                    {book.description || "No description available for this book."}
                </p>
            </div>

            {/* Info Grid */}
            <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-stone-50 dark:bg-stone-800/50 rounded-2xl border border-stone-100 dark:border-stone-800">
                    <div className="flex items-center gap-2 text-stone-400 mb-1">
                        <Layers size={16} />
                        <span className="text-[10px] font-bold uppercase tracking-wider">Genre</span>
                    </div>
                    <p className="font-medium text-stone-800 dark:text-stone-200">{book.genre}</p>
                </div>
                <div className="p-4 bg-stone-50 dark:bg-stone-800/50 rounded-2xl border border-stone-100 dark:border-stone-800">
                    <div className="flex items-center gap-2 text-stone-400 mb-1">
                        <BookOpen size={16} />
                        <span className="text-[10px] font-bold uppercase tracking-wider">Pages</span>
                    </div>
                    <p className="font-medium text-stone-800 dark:text-stone-200">{book.pages}</p>
                </div>
                <div className="p-4 bg-stone-50 dark:bg-stone-800/50 rounded-2xl border border-stone-100 dark:border-stone-800">
                    <div className="flex items-center gap-2 text-stone-400 mb-1">
                        <MapPin size={16} />
                        <span className="text-[10px] font-bold uppercase tracking-wider">Location</span>
                    </div>
                    <p className="font-medium text-stone-800 dark:text-stone-200">{book.location || 'N/A'}</p>
                </div>
                <div className="p-4 bg-stone-50 dark:bg-stone-800/50 rounded-2xl border border-stone-100 dark:border-stone-800">
                    <div className="flex items-center gap-2 text-stone-400 mb-1">
                        <Hash size={16} />
                        <span className="text-[10px] font-bold uppercase tracking-wider">ISBN</span>
                    </div>
                    <p className="font-medium text-stone-800 dark:text-stone-200 text-xs truncate" title={book.isbn}>{book.isbn || 'N/A'}</p>
                </div>
            </div>

             {/* Rating Placeholder */}
             <div className="flex items-center justify-between p-4 rounded-2xl bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30">
                <div className="flex flex-col">
                    <span className="text-xs text-amber-800 dark:text-amber-500 font-bold uppercase">Community Rating</span>
                    <div className="flex text-amber-400 mt-1">
                        {[1,2,3,4,5].map(star => (
                            <svg key={star} className={`w-4 h-4 ${star <= (book.rating || 0) ? 'fill-current' : 'text-stone-300 dark:text-stone-700'}`} viewBox="0 0 20 20" fill="currentColor">
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                        ))}
                    </div>
                </div>
                <span className="text-2xl font-bold text-amber-600 dark:text-amber-500">{book.rating || 0}<span className="text-sm text-amber-400">/5</span></span>
             </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 safe-bottom pb-8">
            <div className="flex gap-3">
                {isAdmin ? (
                    <Button onClick={() => { onClose(); onEdit && onEdit(book); }} className="flex-1 rounded-xl">
                        <Pencil size={18} /> Edit Book
                    </Button>
                ) : (
                    <>
                        {book.status === BookStatus.Available ? (
                             <Button 
                                onClick={() => { onAddToCart && onAddToCart(book); onClose(); }} 
                                disabled={isInCart}
                                className={`flex-1 rounded-xl py-4 text-base ${isInCart ? 'bg-stone-200 text-stone-500 dark:bg-stone-800' : ''}`}
                            >
                                <ShoppingBag size={18} /> {isInCart ? 'In Cart' : 'Borrow Book'}
                            </Button>
                        ) : (
                            <Button disabled className="flex-1 rounded-xl py-4 bg-stone-100 text-stone-400 dark:bg-stone-800 dark:text-stone-500 cursor-not-allowed">
                                Not Available
                            </Button>
                        )}
                    </>
                )}
            </div>
        </div>
      </div>
    </div>
  );
};

export default BookDetailsModal;
