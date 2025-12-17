
import React, { useState, useEffect } from 'react';
import { Book, BookStatus } from '../types';
import { CheckCircle, Trash2, Pencil } from 'lucide-react';

interface BookCardProps {
  book: Book;
  onStatusChange: (id: string, status: BookStatus) => void;
  onDelete: (id: string) => void;
  onEdit: (book: Book) => void;
  onClick: (book: Book) => void;
  isAdmin: boolean;
  onAddToCart?: (book: Book) => void;
  onReserve?: (book: Book) => void;
  isInCart?: boolean;
  variant?: 'portrait' | 'list';
}

const BookCard: React.FC<BookCardProps> = ({ 
    book, 
    onStatusChange, 
    onDelete, 
    onEdit, 
    onClick,
    isAdmin, 
    onAddToCart, 
    onReserve,
    isInCart,
    variant = 'portrait'
}) => {
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    setImgError(false);
  }, [book.coverUrl]);

  const PLACEHOLDER_IMAGE = "https://images.unsplash.com/photo-1524578271613-d550eacf6090?q=80&w=600&auto=format&fit=crop";

  // --- List View (For "See All") ---
  if (variant === 'list') {
      return (
        <div 
            onClick={() => onClick(book)}
            className="flex w-full gap-4 p-3 border-b border-stone-100 dark:border-stone-800 animate-slide-up bg-white dark:bg-stone-900/50 rounded-xl mb-2 cursor-pointer hover:bg-stone-50 dark:hover:bg-stone-800/50 transition-colors"
        >
            {/* Image */}
            <div className="relative w-[70px] aspect-[2/3] shrink-0 rounded-lg overflow-hidden bg-stone-200 dark:bg-stone-800 shadow-sm">
                <img 
                    src={imgError || !book.coverUrl ? PLACEHOLDER_IMAGE : book.coverUrl} 
                    alt={book.title} 
                    onError={() => setImgError(true)}
                    className="w-full h-full object-cover" 
                />
            </div>
            
            {/* Info */}
            <div className="flex-1 flex flex-col justify-center min-w-0">
                <h3 className="font-sans font-bold text-sm text-stone-900 dark:text-white leading-tight mb-1 truncate">
                    {book.title}
                </h3>
                <p className="text-xs text-stone-500 dark:text-stone-400 mb-2 truncate">{book.author}</p>
                
                {/* Status Badge */}
                <div className="flex">
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-md ${
                        book.status === BookStatus.Available ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                        book.status === BookStatus.OnLoan ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                        'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
                    }`}>
                        {book.status}
                    </span>
                </div>
            </div>

            {/* Action Button */}
            <div className="flex flex-col justify-center shrink-0">
                {isAdmin ? (
                    <div className="flex flex-col gap-2">
                         <button 
                            onClick={(e) => { e.stopPropagation(); onEdit(book); }} 
                            className="p-2 bg-stone-100 dark:bg-stone-800 rounded-full text-stone-500 hover:bg-stone-200"
                        >
                            <Pencil size={16} />
                         </button>
                    </div>
                ) : (
                    <>
                        {book.status === BookStatus.Available ? (
                            <button 
                                onClick={(e) => { e.stopPropagation(); onAddToCart && onAddToCart(book); }}
                                disabled={isInCart}
                                className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wide transition-all ${
                                    isInCart 
                                    ? 'bg-stone-200 text-stone-400 dark:bg-stone-800 dark:text-stone-500' 
                                    : 'bg-shoseki-brown text-white hover:bg-shoseki-darkBrown dark:bg-amber-700 dark:hover:bg-amber-600'
                                }`}
                            >
                                {isInCart ? 'Added' : 'Borrow'}
                            </button>
                        ) : (
                             <button 
                                disabled
                                className="px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wide bg-stone-100 text-stone-400 dark:bg-stone-800 dark:text-stone-600 cursor-not-allowed"
                            >
                                On Loan
                            </button>
                        )}
                    </>
                )}
            </div>
        </div>
      )
  }

  // --- Portrait View (Compact for Horizontal Scroll) ---
  return (
    <div 
        onClick={() => onClick(book)}
        className="flex flex-col w-[90px] shrink-0 group snap-start cursor-pointer"
    >
      {/* Cover Image */}
      <div className="relative w-full aspect-[2/3] rounded-lg overflow-hidden bg-stone-200 dark:bg-stone-800 shadow-md mb-2 transition-transform duration-300 group-hover:scale-[1.03]">
        <img 
          src={imgError || !book.coverUrl ? PLACEHOLDER_IMAGE : book.coverUrl} 
          alt={book.title} 
          onError={() => setImgError(true)}
          className="w-full h-full object-cover" 
        />
        {/* Admin Edit Overlay */}
        {isAdmin && (
            <button 
                onClick={(e) => { e.stopPropagation(); onEdit(book); }}
                className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            >
                <Pencil size={16} className="text-white" />
            </button>
        )}
      </div>
      
      {/* Content Info */}
      <div className="flex flex-col gap-0.5">
        <h3 className="font-sans font-bold text-xs text-stone-900 dark:text-white leading-tight line-clamp-2 h-[2.4em] group-hover:text-shoseki-brown dark:group-hover:text-amber-500 transition-colors">
            {book.title}
        </h3>
        <p className="text-[10px] text-stone-500 dark:text-stone-400 truncate">{book.author}</p>
      </div>
    </div>
  );
};

export default BookCard;
