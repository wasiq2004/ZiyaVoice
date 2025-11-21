import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { SIDEBAR_ITEMS } from '../constants';
import { Page } from '../types';
import { CreditCardIcon, ArrowLeftOnRectangleIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../contexts/AuthContext';
import { fetchRealCreditBalances } from '../services/realCreditService';

interface SidebarProps {
    isCollapsed: boolean;
    setCollapsed: (collapsed: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isCollapsed, setCollapsed }) => {
    const { signOut, user } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [credits, setCredits] = useState<number | string>(0);
    const [loadingCredits, setLoadingCredits] = useState(false);

    const handleLogout = async () => {
        try {
            await signOut();
            // Redirect to login page
            navigate('/login');
        } catch (error) {
            console.error('Logout error:', error);
        }
    };

    // Fetch credits on component mount and when user changes
    useEffect(() => {
        const fetchCredits = async () => {
            if (!user) return;
            
            try {
                setLoadingCredits(true);
                const creditBalances = await fetchRealCreditBalances(user.id);
                const totalCredits = (creditBalances.elevenlabsCredits || 0) + (creditBalances.geminiCredits || 0);
                setCredits(totalCredits);
            } catch (error) {
                console.error('Error fetching sidebar credits:', error);
                setCredits('--');
            } finally {
                setLoadingCredits(false);
            }
        };
        
        fetchCredits();
    }, [user]);

    // Listen for credit updates from other components
    useEffect(() => {
        const handleCreditsUpdated = (event: CustomEvent) => {
            console.log('Credits updated, refreshing sidebar');
            if (user) {
                fetchRealCreditBalances(user.id)
                    .then(creditBalances => {
                        const totalCredits = (creditBalances.elevenlabsCredits || 0) + (creditBalances.geminiCredits || 0);
                        setCredits(totalCredits);
                    })
                    .catch(err => {
                        console.error('Error updating credits:', err);
                        setCredits('--');
                    });
            }
        };
        
        window.addEventListener('creditsUpdated', handleCreditsUpdated as EventListener);
        return () => {
            window.removeEventListener('creditsUpdated', handleCreditsUpdated as EventListener);
        };
    }, [user]);

    const getPagePath = (page: Page): string => {
        switch (page) {
            case Page.Dashboard:
                return '/dashboard';
            case Page.Campaigns:
                return '/campaigns';
            case Page.Agent:
                return '/agents';
            case Page.PhoneNo:
                return '/phone-numbers';
            case Page.Settings:
                return '/settings';
            case Page.API:
                return '/api';
            case Page.Credits:
                return '/credits';
            default:
                return '/dashboard';
        }
    };

    const getCurrentPage = (): Page => {
        const path = location.pathname;
        switch (path) {
            case '/dashboard':
                return Page.Dashboard;
            case '/campaigns':
                return Page.Campaigns;
            case '/agents':
                return Page.Agent;
            case '/phone-numbers':
                return Page.PhoneNo;
            case '/settings':
                return Page.Settings;
            case '/api':
                return Page.API;
            case '/credits':
                return Page.Credits;
            default:
                return Page.Dashboard;
        }
    };

    const activePage = getCurrentPage();

    return (
        <aside className={`fixed top-0 left-0 h-full glassmorphism bg-darkbg/90 backdrop-blur-xl text-white flex flex-col transition-all duration-300 ease-in-out z-20 shadow-2xl border-r border-white/10 ${isCollapsed ? 'w-20' : 'w-64'}`}>
            <div className="flex items-center justify-center h-20 border-b border-darkbg-lighter">
                <h1 className={`text-2xl font-bold transition-opacity duration-300 ${isCollapsed ? 'opacity-0 w-0' : 'opacity-100'}`}>Ziya Voice</h1>
                <h1 className={`text-3xl font-bold transition-opacity duration-300 ${!isCollapsed ? 'opacity-0 w-0' : 'opacity-100'}`}>ZV</h1>
            </div>

            <nav className="flex-1 px-4 py-6">
                <ul>
                    {SIDEBAR_ITEMS.map((item) => (
                        <li key={item.id}>
                            <a
                                href="#"
                                onClick={(e) => {
                                    e.preventDefault();
                                    navigate(getPagePath(item.id));
                                }}
                                className={`flex items-center py-3 px-4 my-1 rounded-lg transition-colors duration-200 ${
                                    activePage === item.id
                                        ? 'bg-darkbg-lighter text-primary'
                                        : 'text-slate-400 hover:bg-darkbg-lighter hover:text-white'
                                }`}
                            >
                                <item.icon className="h-6 w-6" />
                                <span className={`ml-4 font-medium transition-all duration-300 ${isCollapsed ? 'opacity-0 w-0' : 'opacity-100'}`}>{item.id}</span>
                            </a>
                        </li>
                    ))}
                </ul>
            </nav>
            <div className="p-4 border-t border-darkbg-lighter">
                <a
                    href="#"
                    onClick={(e) => {
                        e.preventDefault();
                        navigate('/credits');
                    }}
                    className={`flex items-center p-2 rounded-lg text-slate-400 hover:bg-darkbg-lighter hover:text-white mb-2 ${isCollapsed ? 'justify-center' : ''}`}
                    aria-label="View credits and usage"
                >
                    <CreditCardIcon className="h-6 w-6 flex-shrink-0" />
                    <div className={`ml-4 overflow-hidden whitespace-nowrap transition-all duration-300 ${isCollapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'}`}>
                        <span className="font-semibold text-white block text-sm">{typeof credits === 'number' ? credits.toLocaleString() : credits}</span>
                        <span className="text-xs">Credits Remaining</span>
                    </div>
                </a>
                <button
                    onClick={handleLogout}
                    className={`flex items-center p-2 rounded-lg text-slate-400 hover:bg-darkbg-lighter hover:text-white w-full ${isCollapsed ? 'justify-center' : ''}`}
                    aria-label="Logout"
                >
                    <ArrowLeftOnRectangleIcon className="h-6 w-6 flex-shrink-0" />
                    <span className={`ml-4 font-medium transition-all duration-300 ${isCollapsed ? 'opacity-0 w-0' : 'opacity-100'}`}>Logout</span>
                </button>
                <button 
                    onClick={() => setCollapsed(!isCollapsed)}
                    className="w-full flex items-center justify-center p-2 rounded-lg text-slate-400 hover:bg-darkbg-lighter hover:text-white mt-2"
                    aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className={`h-6 w-6 transition-transform duration-300 ${isCollapsed ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                    </svg>
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;