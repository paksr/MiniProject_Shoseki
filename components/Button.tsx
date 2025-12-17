import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  isLoading?: boolean;
}

const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  isLoading, 
  className = '', 
  ...props 
}) => {
  const baseStyles = "px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-stone-900";
  
  const variants = {
    primary: "bg-shoseki-brown text-white hover:bg-shoseki-darkBrown focus:ring-shoseki-brown shadow-md hover:shadow-lg dark:bg-amber-800 dark:hover:bg-amber-900",
    secondary: "bg-shoseki-sand text-shoseki-darkBrown hover:bg-stone-300 focus:ring-shoseki-sand dark:bg-stone-700 dark:text-stone-200 dark:hover:bg-stone-600",
    outline: "border-2 border-shoseki-brown text-shoseki-brown hover:bg-shoseki-brown hover:text-white dark:border-amber-700 dark:text-amber-500 dark:hover:bg-amber-900",
    ghost: "text-shoseki-brown hover:bg-shoseki-sand/30 dark:text-stone-400 dark:hover:text-stone-200 dark:hover:bg-stone-800"
  };

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${isLoading ? 'opacity-70 cursor-not-allowed' : ''} ${className}`}
      disabled={isLoading || props.disabled}
      {...props}
    >
      {isLoading ? (
        <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
      ) : children}
    </button>
  );
};

export default Button;