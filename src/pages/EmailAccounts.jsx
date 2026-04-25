import React, { useState, useEffect } from 'react';
import { Search, Filter, Settings2, Plus, ExternalLink, Loader2, Mail, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import Swal from 'sweetalert2';
import config from '../config';
import SMTPForm from '../components/SMTPForm';

export default function EmailAccounts() {
  const [accounts, setAccounts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingAccountId, setEditingAccountId] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);

  const fetchAccounts = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${config.API_BASE_URL}/smtp-sender`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      });
      if (response.ok) {
        const result = await response.json();
        setAccounts(result.data || []); // Use data.data based on your JSON schema
      } else if (response.status === 401) {
        // Token expired, logout user
        localStorage.removeItem('access_token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    } catch (error) {
      console.error("Error fetching email accounts:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  const filteredAccounts = accounts.filter(acc => 
    acc.fromName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    acc.fromEmail?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Bulk Selection Logic
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(filteredAccounts.map(acc => acc._id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectRow = (id) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleDelete = async (id, name) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: `You are about to delete account "${name}". This cannot be undone!`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#94a3b8',
      confirmButtonText: 'Yes, delete it!',
      background: '#ffffff',
      borderRadius: '24px'
    });

    if (result.isConfirmed) {
      try {
        const response = await fetch(`${config.API_BASE_URL}/smtp-sender/${id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`
          }
        });

        if (response.ok) {
          Swal.fire('Deleted!', 'Account has been removed.', 'success');
          setAccounts(prev => prev.filter(acc => acc._id !== id));
        } else {
          throw new Error('Failed to delete account');
        }
      } catch (error) {
        Swal.fire('Error!', error.message, 'error');
      }
    }
  };

  // Handle Edit View
  if (editingAccountId) {
    return (
      <div className="p-8">
        <SMTPForm 
          accountId={editingAccountId} 
          onBack={() => {
            setEditingAccountId(null);
            fetchAccounts();
          }} 
        />
      </div>
    );
  }

  return (
    <div className="h-full bg-background font-sans flex flex-col page-animate">
      
      {/* HEADER SECTION */}
      <div className="flex justify-between items-center px-6 py-4 border-b border-border bg-background">
        <div>
          <h1 className="text-xl font-black text-text-main uppercase tracking-tight">Email Accounts</h1>
          <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest leading-none mt-1">Manage connected mailboxes</p>
        </div>
        <div className="flex gap-3">
            <Link to="/smtp">
              <button className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all">
                <Plus size={18} strokeWidth={3} /> Connect Mailbox
              </button>
            </Link>
        </div>
      </div>

      {/* TABS & FILTERS */}
      <div className="flex flex-col md:flex-row justify-between items-center px-6 py-3 gap-4 border-b border-border bg-background z-10">
        <div className="flex items-center gap-2 p-1 bg-surface rounded-xl">
          <button className="px-5 py-2 text-xs font-black text-primary bg-background rounded-lg shadow-sm uppercase tracking-wider">
            Connected ({accounts.length})
          </button>

        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={14} />
            <input 
              type="text" 
              placeholder="Search Mailbox..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-surface border border-border rounded-xl text-xs font-bold focus:border-primary outline-none transition-all placeholder:text-text-muted text-text-main" 
            />
          </div>
          <button className="p-2.5 bg-surface border border-border rounded-xl hover:border-primary/30 text-text-muted transition-colors"><Filter size={16}/></button>
          <button className="p-2.5 bg-surface border border-border rounded-xl hover:border-primary/30 text-text-muted transition-colors"><Settings2 size={16}/></button>
        </div>
      </div>

      {/* DATA TABLE */}
      <div className="flex-1 overflow-hidden flex flex-col bg-surface/10">
        {isLoading ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4">
            <Loader2 className="animate-spin text-primary" size={40} />
            <p className="text-[10px] font-black text-text-muted uppercase tracking-widest animate-pulse">Syncing accounts...</p>
          </div>
        ) : filteredAccounts.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center space-y-4">
             <div className="w-20 h-20 bg-surface rounded-full flex items-center justify-center border border-border border-dashed">
                <Mail size={30} className="text-text-muted/30" />
             </div>
             <p className="text-xs font-bold text-text-muted uppercase tracking-widest">No matching accounts found</p>
          </div>
        ) : (
          <div className="overflow-auto flex-1 custom-scrollbar">
            <table className="w-full border-collapse min-w-[1100px]">
              <thead className="sticky top-0 bg-background z-10 shadow-sm border-b border-border">
                <tr className="text-text-muted">
                  <th className="w-16 px-6 py-4 text-left">
                    <input 
                      type="checkbox" 
                      onChange={handleSelectAll}
                      checked={filteredAccounts.length > 0 && selectedIds.length === filteredAccounts.length}
                      className="w-4 h-4 accent-primary rounded border-border cursor-pointer transition-all" 
                    />
                  </th>
                  <th className="px-6 py-4 text-left text-[11px] font-black uppercase tracking-widest">Sender Name</th>
                  <th className="px-6 py-4 text-left text-[11px] font-black uppercase tracking-widest">Email Address</th>
                  <th className="px-6 py-4 text-left text-[11px] font-black uppercase tracking-widest">Server Host</th>
                  <th className="px-6 py-4 text-left text-[11px] font-black uppercase tracking-widest">Daily Limit</th>
                  <th className="px-6 py-4 text-left text-[11px] font-black uppercase tracking-widest">Security</th>
                  <th className="px-6 py-4 text-right text-[11px] font-black uppercase tracking-widest pr-12">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border bg-background">
                {filteredAccounts.map((acc) => (
                  <tr 
                    key={acc._id} 
                    className={`hover:bg-surface/50 transition-colors cursor-pointer group h-[64px] ${selectedIds.includes(acc._id) ? 'bg-primary/[0.02]' : ''}`}
                  >
                    <td className="px-6 py-1">
                      <input 
                        type="checkbox" 
                        checked={selectedIds.includes(acc._id)}
                        onChange={() => handleSelectRow(acc._id)}
                        className="w-4 h-4 accent-primary rounded cursor-pointer transition-all" 
                      />
                    </td>
                    
                    <td className="px-6 py-1" onClick={() => setEditingAccountId(acc._id)}>
                      <div className="flex items-center gap-2 text-[13px] text-text-main font-bold">
                        {acc.fromName}
                        <ExternalLink size={14} className="opacity-0 group-hover:opacity-100 transition-opacity text-primary" />
                      </div>
                    </td>

                    <td className="px-6 py-1" onClick={() => setEditingAccountId(acc._id)}>
                      <div className="flex items-center gap-2 text-[13px] font-bold text-text-muted">
                        <div className="w-7 h-7 rounded-lg bg-surface flex items-center justify-center">
                          <Mail size={14} className="text-primary" />
                        </div>
                        {acc.fromEmail}
                      </div>
                    </td>

                    <td className="px-6 py-1 text-[12px] font-bold text-text-main">
                      <span className="bg-surface px-3 py-1.5 rounded-lg border border-border">
                        {acc.smtpHost}:{acc.smtpPort}
                      </span>
                    </td>

                    <td className="px-6 py-1">
                       <span className="text-xs font-black text-text-main">{acc.messagePerDay}</span>
                    </td>

                    <td className="px-6 py-1">
                      <span className="bg-blue-50 text-blue-600 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border border-blue-100">
                        {acc.smtpSecurity}
                      </span>
                    </td>

                    <td className="px-6 py-1 text-right">
                      <div className="flex justify-end gap-2 items-center pr-4">
                        <button 
                          onClick={() => setEditingAccountId(acc._id)}
                          className="p-2.5 hover:bg-surface rounded-xl transition-all text-text-muted hover:text-primary"
                        >
                          <Settings2 size={16} />
                        </button>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(acc._id, acc.fromName);
                          }}
                          className="p-2.5 hover:bg-rose-50 rounded-xl transition-all text-text-muted hover:text-rose-500"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
