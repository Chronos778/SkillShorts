import React from 'react';

interface SwissCardProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
  hoverEffect?: boolean;
}

const SwissCard: React.FC<SwissCardProps> = ({ 
  title, 
  subtitle, 
  children, 
  footer, 
  className = '',
  hoverEffect = true
}) => {
  return (
    <div className={`
      group relative
      bg-swiss-white dark:bg-swiss-darkBg border-2 border-black dark:border-white p-6 
      ${hoverEffect ? 'hover:-translate-y-1 hover:shadow-hard dark:hover:shadow-hard-white transition-all duration-300 ease-out hover:border-swiss-blue dark:hover:border-swiss-vibrantBlue' : 'shadow-hard-sm dark:shadow-hard-sm-white'}
      flex flex-col h-full
      ${className}
    `}>
      {/* Header */}
      <div className="border-b-2 border-black dark:border-gray-800 pb-4 mb-4 flex justify-between items-start transition-colors group-hover:border-swiss-blue dark:group-hover:border-swiss-vibrantBlue">
        <div>
          <h3 className="font-sans font-bold text-xl uppercase tracking-tight leading-none text-swiss-black dark:text-white group-hover:text-swiss-blue dark:group-hover:text-swiss-vibrantBlue transition-colors">{title}</h3>
          {subtitle && <p className="font-mono text-xs text-swiss-blue dark:text-swiss-vibrantBlue mt-1 uppercase">{subtitle}</p>}
        </div>
        <div className="h-2 w-2 bg-black dark:bg-white group-hover:rotate-45 transition-transform duration-300" />
      </div>
      
      {/* Content */}
      <div className="flex-grow font-sans text-swiss-darkGray dark:text-gray-300 leading-relaxed">
        {children}
      </div>

      {/* Footer */}
      {footer && (
        <div className="mt-6 pt-4 border-t-2 border-swiss-gray dark:border-gray-800 font-mono text-xs uppercase flex justify-between items-center text-gray-500 dark:text-gray-400 group-hover:text-swiss-black dark:group-hover:text-white transition-colors">
          {footer}
        </div>
      )}
    </div>
  );
};

export default SwissCard;
