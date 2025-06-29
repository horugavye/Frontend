import { FC } from 'react';

interface CardContainerProps {
  children: React.ReactNode;
  className?: string;
}

const CardContainer: FC<CardContainerProps> = ({ children, className = "" }) => (
  <div className={`bg-white dark:bg-dark-card rounded-xl p-4 shadow-sm transition-colors duration-200 ${className}`}>
    {children}
  </div>
);

export default CardContainer; 