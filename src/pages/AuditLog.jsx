import React, { useState, useEffect } from 'react';
import {
    Activity,
    Search,
    Monitor,
    Cpu,
    HardDrive,
    Clock,
    Globe,
    User,
    RefreshCw,
    ChevronLeft,
    ChevronRight,
    Server,
    Smartphone
} from 'lucide-react';
import config from '../config';

const AuditLog = () => {
    const formatDate = (dateString, type = 'date') => {
        const d = new Date(dateString);
        if (isNaN(d.getTime())) return '---';
        if (type === 'date') {
            return d.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
        }
        return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
    };

    const [auditData, setAuditData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const logsPerPage = 10;

    useEffect(() => {
        fetchAuditDashboard();
    }, []);

    const fetchAuditDashboard = async () => {
        setIsLoading(true);
        try {
            const response = await fetch(`${config.API_BASE_URL}/audit-log/dashboard`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('access_token')}` }
            });
            if (response.ok) {
                const result = await response.json();
                console.log("Audit Dashboard Data:", result.data);
                setAuditData(result.data);
            }
        } catch (error) {
            console.error("Error fetching audit logs:", error);
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return (
            <div className="h-screen flex flex-col items-center justify-center bg-white space-y-4">
                <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest animate-pulse">Syncing Audit Logs...</p>
            </div>
        );
    }

    const sys = auditData?.systemInfo || {};
    const logs = auditData?.recentLogs || auditData?.logs || auditData?.auditLogs || [];

    const filteredLogs = logs.filter(log => {
        if (!log) return false;
        const email = (log.email || '').toLowerCase();
        const action = (log.action || '').toLowerCase();
        const ip = (log.ipAddress || '');
        const search = (searchTerm || '').toLowerCase();
        return email.includes(search) || action.includes(search) || ip.includes(search);
    });

    const indexOfLastLog = currentPage * logsPerPage;
    const indexOfFirstLog = indexOfLastLog - logsPerPage;
    const currentLogs = filteredLogs.slice(indexOfFirstLog, indexOfLastLog);
    const totalPages = Math.max(1, Math.ceil(filteredLogs.length / logsPerPage));

    return (
        <div className="p-10 space-y-10 bg-surface min-h-screen font-sans pb-20">

            {/* HEADER */}
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-1">
                    <h1 className="text-3xl font-[1000] text-slate-800 uppercase tracking-tighter flex items-center gap-3">
                        <Activity className="text-primary" size={32} />
                        Audit Control Center
                    </h1>
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em] ml-1">System intelligence & activity tracking</p>
                </div>
                <button
                    onClick={fetchAuditDashboard}
                    className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 text-slate-600 rounded-2xl hover:bg-slate-50 transition-all font-black uppercase text-[10px] tracking-widest shadow-sm shadow-slate-100"
                >
                    <RefreshCw size={14} /> Refresh Data
                </button>
            </header>

            {/* SYSTEM INFO & USER STATS CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">

                {/* Total Users */}
                <div className="bg-white p-7 rounded-[32px] border border-slate-100 shadow-soft relative overflow-hidden group hover:border-indigo-200 transition-all">
                    <div className="absolute top-0 right-0 p-5 text-slate-50 scale-150 pointer-events-none group-hover:text-indigo-500/5 transition-colors"><User size={64} /></div>
                    <div className="space-y-4 relative z-10">
                        <div className="w-10 h-10 bg-indigo-50 text-indigo-500 rounded-xl flex items-center justify-center"><User size={20} /></div>
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total System Users</p>
                            <p className="text-lg font-black text-slate-800">{auditData?.totalUsers || '0'} Registered</p>
                        </div>
                    </div>
                </div>

                {/* Server Info */}
                <div className="bg-white p-7 rounded-[32px] border border-slate-100 shadow-soft relative overflow-hidden group hover:border-primary/20 transition-all">
                    <div className="absolute top-0 right-0 p-5 text-slate-50 scale-150 pointer-events-none group-hover:text-primary/5 transition-colors"><Server size={64} /></div>
                    <div className="space-y-4 relative z-10">
                        <div className="w-10 h-10 bg-blue-50 text-blue-500 rounded-xl flex items-center justify-center"><Globe size={20} /></div>
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Server (Hostname)</p>
                            <p className="text-lg font-black text-slate-800 truncate">{sys.serverIpAddress || '---'}</p>
                        </div>
                    </div>
                </div>

                {/* RAM Stats */}
                <div className="bg-white p-7 rounded-[32px] border border-slate-100 shadow-soft relative overflow-hidden group hover:border-emerald-200 transition-all">
                    <div className="absolute top-0 right-0 p-5 text-slate-50 scale-150 pointer-events-none group-hover:text-emerald-500/5 transition-colors"><HardDrive size={64} /></div>
                    <div className="space-y-4 relative z-10">
                        <div className="w-10 h-10 bg-emerald-50 text-emerald-500 rounded-xl flex items-center justify-center"><HardDrive size={20} /></div>
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Memory (RAM Ratio)</p>
                            <p className="text-lg font-black text-slate-800">{sys.freeRamGB}G / {sys.totalRamGB}G</p>
                        </div>
                    </div>
                </div>

                {/* CPU Info */}
                <div className="bg-white p-7 rounded-[32px] border border-slate-100 shadow-soft relative overflow-hidden group hover:border-amber-200 transition-all">
                    <div className="absolute top-0 right-0 p-5 text-slate-50 scale-150 pointer-events-none group-hover:text-amber-500/5 transition-colors"><Cpu size={64} /></div>
                    <div className="space-y-4 relative z-10">
                        <div className="w-10 h-10 bg-amber-50 text-amber-500 rounded-xl flex items-center justify-center"><Cpu size={20} /></div>
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">CPU Power ({sys.architecture})</p>
                            <p className="text-lg font-black text-slate-800">{sys.cpuCores} Cores Available</p>
                        </div>
                    </div>
                </div>

                {/* Uptime */}
                <div className="bg-white p-7 rounded-[32px] border border-slate-100 shadow-soft relative overflow-hidden group hover:border-violet-200 transition-all">
                    <div className="absolute top-0 right-0 p-5 text-slate-50 scale-150 pointer-events-none group-hover:text-violet-500/5 transition-colors"><Clock size={64} /></div>
                    <div className="space-y-4 relative z-10">
                        <div className="w-10 h-10 bg-violet-50 text-violet-500 rounded-xl flex items-center justify-center"><Clock size={20} /></div>
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Server Active Time</p>
                            <p className="text-lg font-black text-slate-800">{Math.floor(sys.uptimeSeconds / 3600)}h {Math.floor((sys.uptimeSeconds % 3600) / 60)}m</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* LOGS TABLE AREA */}
            <div className="bg-white rounded-[40px] border border-slate-100 shadow-2xl shadow-slate-200/50 flex flex-col overflow-hidden">
                <div className="px-10 py-8 border-b border-slate-50 flex items-center justify-between gap-8 flex-wrap">
                    <div className="flex items-center gap-4">
                        <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">Recent Activity Logs</h2>
                        <span className="bg-slate-50 text-slate-400 px-3 py-1 rounded-full text-[10px] font-black">{filteredLogs.length} Total</span>
                    </div>
                    <div className="flex items-center gap-4 flex-1 max-w-md">
                        <div className="relative flex-1">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                            <input
                                type="text"
                                placeholder="Search logs..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-3 pl-12 pr-4 text-sm font-bold text-slate-800 outline-none focus:bg-white focus:border-primary/20 transition-all"
                            />
                        </div>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50">
                                <th className="px-10 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">User / Company ID</th>
                                <th className="px-10 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Activity & Endpoint</th>
                                <th className="px-10 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Network Info (IP)</th>
                                <th className="px-10 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Device</th>
                                <th className="px-10 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Timestamp</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {currentLogs.length > 0 ? (
                                currentLogs.map((log) => (
                                    <tr key={log._id} className="hover:bg-slate-50/30 transition-all group">
                                        <td className="px-10 py-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-11 h-11 bg-primary text-white rounded-2xl flex items-center justify-center font-black text-sm shadow-lg shadow-primary/20 group-hover:scale-105 transition-transform">{log.email?.charAt(0).toUpperCase() || '?'}</div>
                                                <div>
                                                    <p className="text-sm font-black text-slate-800 mb-0.5">{log.email || 'System'}</p>
                                                    <p className="text-[10px] font-bold text-slate-300 uppercase tracking-tight truncate max-w-[150px]">CID: {log.companyId || '---'}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-10 py-6">
                                            <div className="flex flex-col gap-1">
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider w-fit ${log.action === 'LOGIN' ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'}`}>{log.action || 'ACTION'}</span>
                                                <span className="text-[10px] font-bold text-slate-400 font-mono italic">{log.endpoint || '---'}</span>
                                            </div>
                                        </td>
                                        <td className="px-10 py-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400"><Globe size={14} /></div>
                                                <p className="text-[13px] font-bold text-slate-600 font-mono">{(log.ipAddress || '').replace('::ffff:', '') || '0.0.0.0'}</p>
                                            </div>
                                        </td>
                                        <td className="px-10 py-6">
                                            <div className="flex items-center gap-3">
                                                {log.device === 'Desktop/Laptop' ? <Monitor size={16} className="text-slate-400" /> : <Smartphone size={16} className="text-slate-400" />}
                                                <p className="text-[13px] font-bold text-slate-700 tracking-tight">{log.device || 'Unknown'}</p>
                                            </div>
                                        </td>
                                        <td className="px-10 py-6 text-right">
                                            <p className="text-sm font-black text-slate-800 mb-0.5">{formatDate(log.createdAt, 'date')}</p>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">{formatDate(log.createdAt, 'time')}</p>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="5" className="px-10 py-20 text-center">
                                        <div className="flex flex-col items-center gap-3 opacity-30">
                                            <Activity size={48} />
                                            <p className="text-[11px] font-black uppercase tracking-[0.3em]">No activity logs found</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* PAGINATION */}
                <div className="px-10 py-8 border-t border-slate-50 flex items-center justify-between">
                    <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">
                        Showing <span className="text-slate-800">{indexOfFirstLog + 1}</span> to <span className="text-slate-800">{Math.min(indexOfLastLog, filteredLogs.length)}</span> of <span className="text-slate-800">{filteredLogs.length}</span> Logs
                    </p>
                    <div className="flex items-center gap-2">
                        <button
                            disabled={currentPage === 1}
                            onClick={() => setCurrentPage(p => p - 1)}
                            className="w-10 h-10 rounded-xl border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:hover:bg-transparent transition-all"
                        >
                            <ChevronLeft size={18} />
                        </button>
                        <div className="flex items-center gap-2 px-2">
                            {[...Array(totalPages)].map((_, i) => (
                                <button
                                    key={i}
                                    onClick={() => setCurrentPage(i + 1)}
                                    className={`w-10 h-10 rounded-xl text-xs font-black transition-all ${currentPage === i + 1 ? 'bg-primary text-white' : 'text-slate-400 hover:bg-slate-50'
                                        }`}
                                >
                                    {i + 1}
                                </button>
                            ))}
                        </div>
                        <button
                            disabled={currentPage === totalPages}
                            onClick={() => setCurrentPage(p => p + 1)}
                            className="w-10 h-10 rounded-xl border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:hover:bg-transparent transition-all"
                        >
                            <ChevronRight size={18} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AuditLog;
