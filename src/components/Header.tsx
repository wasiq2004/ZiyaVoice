
import React from 'react';

interface HeaderProps {
    title: string;
    children?: React.ReactNode;
}

const Header: React.FC<HeaderProps> = ({ title, children }) => {
    return (
        <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold text-slate-800 dark:text-white">{title}</h1>
            <div className="flex items-center space-x-4">
                {children}
            </div>
        </div>
    );
};

export default Header;