import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  children: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({ 
  variant = 'primary', 
  size = 'md', 
  fullWidth = false, 
  children, 
  className = '',
  ...props 
}) => {
  const baseStyles = "relative font-mono uppercase font-bold border-2 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black dark:focus:ring-white disabled:opacity-50 disabled:cursor-not-allowed group overflow-hidden";
  
  const variants = {
    primary: "border-black bg-swiss-black text-swiss-white hover:bg-swiss-blue hover:text-white shadow-hard active:translate-x-[2px] active:translate-y-[2px] active:shadow-none dark:border-white dark:bg-swiss-white dark:text-swiss-black dark:hover:bg-swiss-vibrantBlue dark:hover:text-white dark:shadow-hard-white dark:active:shadow-none",
    secondary: "border-black bg-swiss-blue text-white hover:bg-swiss-black hover:text-white shadow-hard active:translate-x-[2px] active:translate-y-[2px] active:shadow-none dark:border-white dark:bg-swiss-vibrantBlue dark:hover:bg-white dark:hover:text-black dark:shadow-hard-white dark:active:shadow-none",
    outline: "border-black bg-transparent text-swiss-black hover:bg-swiss-gray shadow-hard-sm hover:shadow-hard active:translate-x-[1px] active:translate-y-[1px] active:shadow-none dark:border-white dark:text-white dark:hover:bg-swiss-darkGray dark:shadow-hard-sm-white dark:hover:shadow-hard-white dark:active:shadow-none",
    ghost: "border-transparent bg-transparent hover:bg-swiss-gray text-swiss-black dark:text-white dark:hover:bg-swiss-darkGray",
  };

  const sizes = {
    sm: "px-4 py-2 text-xs",
    md: "px-6 py-3 text-sm",
    lg: "px-8 py-4 text-base",
  };

  const widthStyle = fullWidth ? "w-full" : "";

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${widthStyle} ${className}`}
      {...props}
    >
      <span className="relative z-10 flex items-center justify-center gap-2">
        {children}
      </span>
      {variant === 'primary' && (
        <div className="absolute inset-0 bg-white/10 translate-x-[-100%] group-hover:animate-[shine_1s_ease-in-out_infinite]" />
      )}
    </button>
  );
};

export default Button;
