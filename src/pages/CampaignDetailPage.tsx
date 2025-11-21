import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Campaign, CampaignRecord, CampaignStatus } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { parseCSV } from '../utils/csvParser';
import * as campaignApi from '../utils/api';

const CampaignDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [records, setRecords] = useState<CampaignRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCallerPhoneModalOpen, setIsCallerPhoneModalOpen] = useState(false);
  const [callerPhone, setCallerPhone] = useState('');
  const [newRecordPhone, setNewRecordPhone] = useState('');
  const [isAddRecordModalOpen, setIsAddRecordModalOpen] = useState(false);
  const [includeMetadata, setIncludeMetadata] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const recordsPerPage = 10;

  // Fetch campaign data
  useEffect(() => {
    const fetchCampaignData = async () => {
      try {
        setLoading(true);
        
        if (!id || !user?.id) {
          throw new Error('Missing campaign ID or user ID');
        }
        
        // Fetch campaign data
        const result = await campaignApi.fetchCampaign(id, user.id);
        
        if (!result.success) {
          throw new Error(result.message || 'Failed to fetch campaign data');
        }
        
        setCampaign(result.data.campaign);
        setRecords(result.data.records);
        setTotalRecords(result.data.records.length);
        setCallerPhone(result.data.campaign.callerPhone || '');
        setIncludeMetadata(result.data.campaign.includeMetadata !== false);
      } catch (err: any) {
        setError(err.message || 'Failed to load campaign data');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (id && user?.id) {
      fetchCampaignData();
    }
  }, [id, user?.id]);

  // Refetch data periodically for live updates
  useEffect(() => {
    const interval = setInterval(() => {
      if (id && user?.id) {
        fetchCampaignDataSilently();
      }
    }, 5000); // Refresh every 5 seconds

    return () => clearInterval(interval);
  }, [id, user?.id]);

  const fetchCampaignDataSilently = async () => {
    try {
      if (!id || !user?.id) return;
      
      const result = await campaignApi.fetchCampaign(id, user.id);
      
      if (result.success) {
        setCampaign(result.data.campaign);
        setRecords(result.data.records);
        setTotalRecords(result.data.records.length);
      }
    } catch (err) {
      console.error('Failed to refresh campaign data', err);
    }
  };

  const handleSetCallerPhone = async () => {
    try {
      if (!id || !user?.id) {
        throw new Error('Missing campaign ID or user ID');
      }
      
      const result = await campaignApi.setCallerPhone(id, user.id, callerPhone);
      
      if (!result.success) {
        throw new Error(result.message || 'Failed to set caller phone');
      }
      
      setCampaign(result.data);
      setIsCallerPhoneModalOpen(false);
    } catch (err: any) {
      console.error('Failed to set caller phone', err);
      alert(`Failed to set caller phone: ${err.message}`);
    }
  };

  const handleImportCSV = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const parsedData = parseCSV(text);
      
      if (!id || !user?.id) {
        throw new Error('Missing campaign ID or user ID');
      }
      
      const result = await campaignApi.importRecords(id, user.id, parsedData);
      
      if (!result.success) {
        throw new Error(result.message || 'Failed to import CSV');
      }
      
      // Refresh campaign data
      await fetchCampaignDataSilently();
      
      // Show success message
      alert(result.message);
      
      // Reset file input
      event.target.value = '';
    } catch (err: any) {
      console.error('Failed to import CSV', err);
      alert(`Failed to import CSV file: ${err.message}`);
    }
  };

  const handleAddRecord = async () => {
    if (!newRecordPhone.trim()) {
      alert('Please enter a phone number');
      return;
    }

    try {
      if (!id || !user?.id) {
        throw new Error('Missing campaign ID or user ID');
      }
      
      const result = await campaignApi.addRecord(id, user.id, newRecordPhone);
      
      if (!result.success) {
        throw new Error(result.message || 'Failed to add record');
      }
      
      // Refresh campaign data
      await fetchCampaignDataSilently();
      
      setNewRecordPhone('');
      setIsAddRecordModalOpen(false);
    } catch (err: any) {
      console.error('Failed to add record', err);
      alert(`Failed to add record: ${err.message}`);
    }
  };

  const handleDeleteRecord = async (recordId: string) => {
    if (!window.confirm('Are you sure you want to delete this record?')) {
      return;
    }

    try {
      if (!id || !user?.id) {
        throw new Error('Missing campaign ID or user ID');
      }
      
      const result = await campaignApi.deleteRecord(id, recordId, user.id);
      
      if (!result.success) {
        throw new Error(result.message || 'Failed to delete record');
      }
      
      // Refresh campaign data
      await fetchCampaignDataSilently();
    } catch (err: any) {
      console.error('Failed to delete record', err);
      alert(`Failed to delete record: ${err.message}`);
    }
  };

  const handleStartCampaign = async () => {
    if (!callerPhone) {
      alert('Please set a caller phone number before starting the campaign');
      setIsCallerPhoneModalOpen(true);
      return;
    }

    try {
      if (!id || !user?.id) {
        throw new Error('Missing campaign ID or user ID');
      }
      
      const result = await campaignApi.startCampaign(id, user.id);
      
      if (!result.success) {
        throw new Error(result.message || 'Failed to start campaign');
      }
      
      setCampaign(result.data);
      
      // Show success message
      alert('Campaign started successfully!');
    } catch (err: any) {
      console.error('Failed to start campaign', err);
      alert(`Failed to start campaign: ${err.message}`);
    }
  };

  const handleStopCampaign = async () => {
    try {
      if (!id || !user?.id) {
        throw new Error('Missing campaign ID or user ID');
      }
      
      const result = await campaignApi.stopCampaign(id, user.id);
      
      if (!result.success) {
        throw new Error(result.message || 'Failed to stop campaign');
      }
      
      setCampaign(result.data);
      
      // Show success message
      alert('Campaign stopped successfully!');
    } catch (err: any) {
      console.error('Failed to stop campaign', err);
      alert(`Failed to stop campaign: ${err.message}`);
    }
  };

  const handleFileUploadClick = () => {
    document.getElementById('csv-upload')?.click();
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'in-progress':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'failed':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const getStatusDotClass = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500';
      case 'in-progress':
        return 'bg-blue-500';
      case 'failed':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
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

  if (!campaign) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-medium text-gray-900 dark:text-white">Campaign not found</h2>
        <button 
          onClick={() => navigate('/campaigns')}
          className="mt-4 text-primary hover:text-primary-dark"
        >
          Back to campaigns
        </button>
      </div>
    );
  }

  return (
    <div className="bg-darkbg text-white min-h-screen animate-fade-in">
      {/* Breadcrumb */}
      <nav className="flex mb-6 text-sm text-gray-400 animate-slide-down">
        <a href="/campaigns" className="hover:text-white">Campaigns</a>
        <span className="mx-2">→</span>
        <span>List</span>
        <span className="mx-2">→</span>
        <span className="text-white">Campaign: {campaign.name}</span>
      </nav>

      {/* Page Title */}
      <h1 className="text-2xl sm:text-3xl font-bold mb-8 animate-slide-down">Campaign: {campaign.name}</h1>

      {/* Top Section */}
      <div className="bg-[#1E293B] rounded-lg p-4 sm:p-6 md:p-8 mb-8 card-animate">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <button
              onClick={() => setIsCallerPhoneModalOpen(true)}
              className="btn-animate bg-[#0F172A] hover:bg-[#1A222C] border border-gray-700 text-white font-medium py-2 px-4 rounded-lg transition flex items-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              Caller Phone
            </button>
            
            <div className="flex items-center">
              <span className="mr-2 text-gray-400">Status:</span>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                campaign.status === CampaignStatus.Running 
                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' 
                  : campaign.status === CampaignStatus.Completed
                  ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
                  : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
              }`}>
                {campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}
              </span>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row flex-wrap gap-3">
            <button
              onClick={handleFileUploadClick}
              className="btn-animate bg-[#0F172A] hover:bg-[#1A222C] border border-gray-700 text-white font-medium py-2 px-4 rounded-lg transition flex items-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              Import
            </button>
            <input
              id="csv-upload"
              type="file"
              accept=".csv"
              className="hidden"
              onChange={handleImportCSV}
            />
            
            <button
              onClick={() => setIsAddRecordModalOpen(true)}
              className="btn-animate bg-[#0F172A] hover:bg-[#1A222C] border border-gray-700 text-white font-medium py-2 px-4 rounded-lg transition flex items-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Add Record
            </button>
            
            <button
              onClick={handleStartCampaign}
              disabled={campaign.status === CampaignStatus.Running}
              className={`btn-animate font-medium py-2 px-4 rounded-lg transition flex items-center ${
                campaign.status === 'running'
                  ? 'bg-gray-600 cursor-not-allowed'
                  : 'bg-emerald-600 hover:bg-emerald-700'
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Start Campaign
            </button>
            
            <button
              onClick={handleStopCampaign}
              disabled={campaign.status !== CampaignStatus.Running}
              className={`btn-animate font-medium py-2 px-4 rounded-lg transition flex items-center ${
                campaign.status !== 'running'
                  ? 'bg-gray-600 cursor-not-allowed'
                  : 'bg-red-600 hover:bg-red-700'
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
              </svg>
              Stop Campaign
            </button>
          </div>
        </div>
        
        <div className="mt-6 pt-6 border-t border-gray-700">
          <div className="flex items-center">
            <label className="flex items-center cursor-pointer">
              <div className="relative">
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={includeMetadata}
                  onChange={(e) => setIncludeMetadata(e.target.checked)}
                />
                <div className={`block w-10 h-6 rounded-full transition ${includeMetadata ? 'bg-emerald-600' : 'bg-gray-600'}`}></div>
                <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition ${includeMetadata ? 'translate-x-full' : ''}`}></div>
              </div>
              <span className="ml-3 text-sm font-medium">Include extra metadata in agent prompt</span>
            </label>
          </div>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-[#1E293B] rounded-lg overflow-hidden card-animate">
        <div className="overflow-x-auto">
          {records.length > 0 ? (
            <>
              <table className="min-w-full divide-y divide-gray-700">
                <thead>
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Phone</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Call Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Retries</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Recording</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Created</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {records.map((record) => (
                    <tr key={record.id} className="hover:bg-[#2D3748]">
                      <td className="px-6 py-4 whitespace-nowrap text-sm">{record.phone}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(record.callStatus)}`}>
                          <span className={`h-2 w-2 rounded-full mr-2 ${getStatusDotClass(record.callStatus)}`}></span>
                          {record.callStatus.charAt(0).toUpperCase() + record.callStatus.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                        {record.retries || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                        {record.recordingUrl ? (
                          <a 
                            href={record.recordingUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-emerald-500 hover:text-emerald-400"
                          >
                            Listen
                          </a>
                        ) : (
                          'N/A'
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                        {new Date(record.createdDate).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button
                          onClick={() => handleDeleteRecord(record.id)}
                          className="text-red-500 hover:text-red-400 font-medium transition"
                          title="Delete record"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {/* Pagination */}
              <div className="px-6 py-4 flex items-center justify-between border-t border-gray-700">
                <div className="text-sm text-gray-400">
                  Showing {Math.min(recordsPerPage, records.length)} of {totalRecords} records
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className={`px-3 py-1 rounded-md text-sm ${
                      currentPage === 1 
                        ? 'bg-gray-700 text-gray-500 cursor-not-allowed' 
                        : 'bg-gray-600 text-white hover:bg-gray-500'
                    }`}
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setCurrentPage(prev => prev + 1)}
                    disabled={currentPage * recordsPerPage >= totalRecords}
                    className={`px-3 py-1 rounded-md text-sm ${
                      currentPage * recordsPerPage >= totalRecords
                        ? 'bg-gray-700 text-gray-500 cursor-not-allowed' 
                        : 'bg-gray-600 text-white hover:bg-gray-500'
                    }`}
                  >
                    Next
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-400 mb-6">No campaign records found</p>
              <button
                onClick={() => setIsAddRecordModalOpen(true)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2 px-4 rounded-lg transition"
              >
                Add Record
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Caller Phone Modal */}
      {isCallerPhoneModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-[#1E293B] rounded-lg max-w-md w-full p-6 card-animate animate-scale-in">
            <h3 className="text-lg font-medium mb-4 animate-slide-down">Set Caller Phone</h3>
            <div className="mb-4 stagger-children">
              <label htmlFor="callerPhone" className="block text-sm font-medium mb-2" style={{ animationDelay: '0.1s' }}>Caller Phone Number</label>
              <input
                type="text"
                id="callerPhone"
                value={callerPhone}
                onChange={(e) => setCallerPhone(e.target.value)}
                className="input-animate w-full bg-[#0F172A] border border-gray-700 rounded-md px-3 py-2 focus:ring-emerald-500 focus:border-emerald-500"
                placeholder="+1 (555) 123-4567"
                style={{ animationDelay: '0.2s' }}
              />
            </div>
            <div className="flex flex-col sm:flex-row justify-end gap-3 animate-slide-up">
              <button
                onClick={() => setIsCallerPhoneModalOpen(false)}
                className="btn-animate bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded-lg transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSetCallerPhone}
                className="btn-animate bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2 px-4 rounded-lg transition"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Record Modal */}
      {isAddRecordModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-[#1E293B] rounded-lg max-w-md w-full p-6 card-animate animate-scale-in">
            <h3 className="text-lg font-medium mb-4 animate-slide-down">Add Phone Number</h3>
            <div className="mb-4 stagger-children">
              <label htmlFor="newRecordPhone" className="block text-sm font-medium mb-2" style={{ animationDelay: '0.1s' }}>Phone Number</label>
              <input
                type="text"
                id="newRecordPhone"
                value={newRecordPhone}
                onChange={(e) => setNewRecordPhone(e.target.value)}
                className="input-animate w-full bg-[#0F172A] border border-gray-700 rounded-md px-3 py-2 focus:ring-emerald-500 focus:border-emerald-500"
                placeholder="+1 (555) 123-4567"
                style={{ animationDelay: '0.2s' }}
              />
            </div>
            <div className="flex flex-col sm:flex-row justify-end gap-3 animate-slide-up">
              <button
                onClick={() => setIsAddRecordModalOpen(false)}
                className="btn-animate bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded-lg transition"
              >
                Cancel
              </button>
              <button
                onClick={handleAddRecord}
                className="btn-animate bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2 px-4 rounded-lg transition"
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CampaignDetailPage;