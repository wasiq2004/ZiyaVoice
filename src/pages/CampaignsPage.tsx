import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Campaign } from '../types';
import { CampaignStatus } from '../types';
import { ChartBarIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../contexts/AuthContext';
import * as campaignApi from '../utils/api';

const StatusBadge: React.FC<{ status: CampaignStatus }> = ({ status }) => {
    const baseClasses = "px-2 py-1 text-xs font-medium rounded-full inline-flex items-center";
    const statusClasses = {
        [CampaignStatus.Active]: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
        [CampaignStatus.Paused]: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
        [CampaignStatus.Completed]: "bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-slate-300",
        [CampaignStatus.Idle]: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300",
        [CampaignStatus.Running]: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
    };
    const dotClasses = {
        [CampaignStatus.Active]: "bg-green-500",
        [CampaignStatus.Paused]: "bg-yellow-500",
        [CampaignStatus.Completed]: "bg-slate-500",
        [CampaignStatus.Idle]: "bg-gray-500",
        [CampaignStatus.Running]: "bg-blue-500",
    };

    const statusText = {
        [CampaignStatus.Active]: "Active",
        [CampaignStatus.Paused]: "Paused",
        [CampaignStatus.Completed]: "Completed",
        [CampaignStatus.Idle]: "Idle",
        [CampaignStatus.Running]: "Running",
    };

    return (
        <span className={`${baseClasses} ${statusClasses[status]}`}>
            <span className={`h-2 w-2 rounded-full mr-2 ${dotClasses[status]}`}></span>
            {statusText[status]}
        </span>
    );
};

const CampaignsPage: React.FC = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [view, setView] = useState<'list' | 'create'>('list');
    const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
    const [campaignToEdit, setCampaignToEdit] = useState<Campaign | null>(null);
    const [newCampaignName, setNewCampaignName] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);


    useEffect(() => {
        const handleClickOutside = () => {
            setActiveDropdown(null);
        };
        window.addEventListener('click', handleClickOutside);
        return () => {
            window.removeEventListener('click', handleClickOutside);
        };
    }, []);
    
    // Fetch campaigns from backend
    useEffect(() => {
        const fetchCampaigns = async () => {
            if (!user?.id) return;
            
            try {
                setLoading(true);
                const result = await campaignApi.fetchCampaigns(user.id);
                
                if (result.success) {
                    setCampaigns(result.data);
                } else {
                    setError(result.message || 'Failed to fetch campaigns');
                }
            } catch (err: any) {
                setError(err.message || 'Failed to fetch campaigns');
            } finally {
                setLoading(false);
            }
        };
        
        if (view === 'list' && user?.id) {
            fetchCampaigns();
        }
    }, [view, user?.id]);
    
    const handleCancelCreate = () => {
        setView('list');
        setNewCampaignName('');
        setCampaignToEdit(null);
    };

    const handleSubmitCampaign = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!newCampaignName.trim()) {
            alert('Campaign name is required.');
            return;
        }
        
        if (!user?.id) {
            alert('User not authenticated.');
            return;
        }

        try {
            if (campaignToEdit) {
                // For now, we'll just update the local state since there's no update API
                setCampaigns(campaigns.map(c => c.id === campaignToEdit.id ? { ...c, name: newCampaignName } : c));
            } else {
                // Create new campaign
                const result = await campaignApi.createCampaign(user.id, newCampaignName);
                
                if (result.success) {
                    setCampaigns([result.data, ...campaigns]);
                } else {
                    alert(result.message || 'Failed to create campaign');
                    return;
                }
            }
            
            handleCancelCreate();
        } catch (err: any) {
            alert(err.message || 'Failed to save campaign');
        }
    };

    const formatDateTime = (isoString: string) => {
        const date = new Date(isoString);
        const datePart = date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
        const timePart = date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false });
        return { date: datePart, time: timePart };
    };

    const handleToggleDropdown = (e: React.MouseEvent, campaignId: string) => {
        e.stopPropagation();
        setActiveDropdown(activeDropdown === campaignId ? null : campaignId);
    };

    const handleEdit = (campaign: Campaign) => {
        setCampaignToEdit(campaign);
        setNewCampaignName(campaign.name);
        setView('create');
        setActiveDropdown(null);
    };

    const handleDelete = async (campaignId: string) => {
        if (window.confirm("Are you sure you want to delete this campaign?")) {
            // In a real implementation, you would call a delete API endpoint
            setCampaigns(campaigns.filter(c => c.id !== campaignId));
        }
        setActiveDropdown(null);
    };

    const handleView = (campaignId: string) => {
        navigate(`/campaigns/${campaignId}`);
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
                <strong className="font-bold">Error: </strong>
                <span className="block sm:inline">{error}</span>
            </div>
        );
    }

    if (view === 'create') {
        return (
            <>
                <div className="flex items-center justify-between mb-8 animate-slide-down">
                    <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 dark:text-white">
                        {campaignToEdit ? 'Edit Campaign' : 'Create Campaign'}
                    </h1>
                </div>
                <div className="bg-white dark:bg-darkbg-light p-4 sm:p-6 md:p-8 rounded-lg shadow-md max-w-2xl mx-auto card-animate">
                    <form onSubmit={handleSubmitCampaign}>
                        <div className="space-y-6 stagger-children">
                            <div style={{ animationDelay: '0.1s' }}>
                                <label htmlFor="campaignName" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Campaign name</label>
                                <input 
                                    type="text" 
                                    name="campaignName" 
                                    id="campaignName" 
                                    value={newCampaignName} 
                                    onChange={(e) => setNewCampaignName(e.target.value)} 
                                    required 
                                    className="input-animate mt-1 block w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                                    placeholder="e.g., Q3 Sales Campaign"
                                />
                            </div>
                        </div>
                        <div className="mt-8 flex flex-col sm:flex-row justify-end gap-3">
                            <button type="button" onClick={handleCancelCreate} className="btn-animate bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold py-2 px-4 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 transition">Cancel</button>
                            <button type="submit" className="btn-animate bg-primary hover:bg-primary-dark text-white font-bold py-2 px-4 rounded-lg transition">
                                {campaignToEdit ? 'Update Campaign' : 'Create Campaign'}
                            </button>
                        </div>
                    </form>
                </div>
            </>
        )
    }

    return (
        <div className="animate-fade-in">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4 animate-slide-down">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 dark:text-white">Campaigns</h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">Manage your outbound campaigns</p>
                </div>
                <button
                    onClick={() => setView('create')}
                    className="btn-animate bg-primary hover:bg-primary-dark text-white font-bold py-2 px-4 rounded-lg flex items-center transition"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                    Create Campaign
                </button>
            </div>

            {campaigns.length > 0 ? (
                 <div className="bg-white dark:bg-darkbg-light rounded-lg shadow-md overflow-x-auto card-animate">
                    <div className="min-w-[700px]">
                        <div className="flex px-3 sm:px-6 py-3 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 text-xs sm:text-sm font-semibold tracking-wider">
                            <div className="w-[40%]">Campaign Name</div>
                            <div className="w-[20%]">Status</div>
                            <div className="w-[20%]">Created</div>
                            <div className="w-[20%]"></div>
                        </div>
                        <div className="stagger-children">
                            {campaigns.map((campaign, idx) => (
                                <div key={campaign.id} style={{ animationDelay: `${idx * 0.05}s` }} className="flex items-center px-3 sm:px-6 py-3 sm:py-4 border-b border-slate-200 dark:border-slate-800 last:border-b-0 hover:bg-slate-50 dark:hover:bg-darkbg transition-colors duration-150">
                                    <div className="w-[40%] flex items-center pr-4">
                                        <div className="flex-shrink-0 w-8 sm:w-10 h-8 sm:h-10 bg-slate-200 dark:bg-slate-700 rounded-lg flex items-center justify-center mr-2 sm:mr-4">
                                            <ChartBarIcon className="h-4 sm:h-5 w-4 sm:w-5 text-slate-500 dark:text-slate-400" />
                                        </div>
                                        <span className="font-medium text-xs sm:text-sm">{campaign.name}</span>
                                    </div>
                                    <div className="w-[20%]">
                                        <StatusBadge status={campaign.status} />
                                    </div>
                                     <div className="w-[20%] text-xs sm:text-sm">
                                        <div className="text-slate-800 dark:text-slate-100">{formatDateTime(campaign.createdAt).date}</div>
                                        <div className="text-slate-500 dark:text-slate-400 text-xs">{formatDateTime(campaign.createdAt).time}</div>
                                    </div>
                                    <div className="w-[20%] flex justify-end relative">
                                        <button onClick={(e) => handleToggleDropdown(e, campaign.id)} className="p-1 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors">
                                            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"></path></svg>
                                        </button>
                                        {activeDropdown === campaign.id && (
                                            <div
                                                className="absolute right-0 top-full mt-2 w-40 bg-white dark:bg-darkbg-light border border-slate-200 dark:border-slate-700 rounded-md shadow-lg z-50"
                                                onClick={(e) => e.stopPropagation()} 
                                            >
                                                <ul className="py-1">
                                                    <li><a href="#" onClick={(e) => { e.preventDefault(); handleEdit(campaign); }} className="block px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-darkbg">Edit</a></li>
                                                    <li><a href="#" onClick={(e) => { e.preventDefault(); handleView(campaign.id); }} className="block px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-darkbg">View</a></li>
                                                    <li><a href="#" onClick={(e) => { e.preventDefault(); handleDelete(campaign.id); }} className="block px-4 py-2 text-sm text-red-500 hover:bg-slate-100 dark:hover:bg-darkbg">Delete</a></li>
                                                </ul>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            ) : (
                <div className="bg-white dark:bg-darkbg-light rounded-lg shadow-md flex flex-col items-center justify-center h-[calc(100vh-200px)] text-center p-4 card-animate">
                    <p className="text-slate-500 dark:text-slate-400 mb-6">No active campaigns found</p>
                    <button 
                        onClick={() => setView('create')}
                        className="btn-animate border border-primary text-primary font-bold py-2 px-4 rounded-lg flex items-center transition hover:bg-primary hover:text-white"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                        Create Campaign
                    </button>
                </div>
            )}
        </div>
    );
};

export default CampaignsPage;