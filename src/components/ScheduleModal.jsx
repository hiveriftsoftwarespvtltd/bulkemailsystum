import React, { useState, useEffect } from 'react';
import { X, Clock, Calendar, Info, ChevronDown, Loader2, Search, Check, Zap } from 'lucide-react';
import Swal from 'sweetalert2';
import config from '../config';

const ScheduleModal = ({ isOpen, onClose, campaignId, initialScheduleData = null, onSaveSuccess }) => {
    const [isSaving, setIsSaving] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [scheduleId, setScheduleId] = useState(null);

    // Form States
    const [timezone, setTimezone] = useState('');
    const [sendDays, setSendDays] = useState([]);
    const [fromTime, setFromTime] = useState('');
    const [toTime, setToTime] = useState('');
    const [delayInterval, setDelayInterval] = useState('');
    const [startDate, setStartDate] = useState('');
    const [maxLeads, setMaxLeads] = useState('');

    const daysList = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const [searchTimezone, setSearchTimezone] = useState('');
    const [isTimezoneOpen, setIsTimezoneOpen] = useState(false);

    const timezones = [
        { value: 'Asia/Kolkata', label: 'Asia/Kolkata (GMT+05:30) - India' },
        { value: 'UTC', label: 'UTC (Universal Time)' },
        { value: 'America/New_York', label: 'Eastern Time (US & Canada)' },
        { value: 'America/Chicago', label: 'Central Time (US & Canada)' },
        { value: 'America/Denver', label: 'Mountain Time (US & Canada)' },
        { value: 'America/Los_Angeles', label: 'Pacific Time (US & Canada)' },
        { value: 'Europe/London', label: 'Europe/London (GMT+01:00)' },
        { value: 'Europe/Paris', label: 'Europe/Paris (GMT+02:00)' },
        { value: 'Europe/Berlin', label: 'Europe/Berlin (GMT+02:00)' },
        { value: 'Asia/Dubai', label: 'Asia/Dubai (GMT+04:00)' },
        { value: 'Asia/Singapore', label: 'Asia/Singapore (GMT+08:00)' },
        { value: 'Asia/Tokyo', label: 'Asia/Tokyo (GMT+09:00)' },
        { value: 'Asia/Hong_Kong', label: 'Asia/Hong_Kong (GMT+08:00)' },
        { value: 'Australia/Sydney', label: 'Australia/Sydney (GMT+10:00)' },
        { value: 'Australia/Melbourne', label: 'Australia/Melbourne (GMT+10:00)' },
        { value: 'Pacific/Auckland', label: 'Pacific/Auckland (GMT+12:00)' },
        { value: 'Africa/Lagos', label: 'Africa/Lagos (GMT+01:00)' },
        { value: 'Africa/Cairo', label: 'Africa/Cairo (GMT+02:00)' },
        { value: 'America/Sao_Paulo', label: 'America/Sao_Paulo (GMT-03:00)' },
        { value: 'Asia/Bangkok', label: 'Asia/Bangkok (GMT+07:00)' },
        { value: 'Asia/Seoul', label: 'Asia/Seoul (GMT+09:00)' }
    ];

    const filteredTimezones = timezones.filter(tz =>
        tz.label.toLowerCase().includes(searchTimezone.toLowerCase()) ||
        tz.value.toLowerCase().includes(searchTimezone.toLowerCase())
    );

    // Fetch existing schedule if any
    useEffect(() => {
        if (isOpen && campaignId) {
            fetchExistingSchedule();
        }
    }, [isOpen, campaignId, initialScheduleData]);

    const fetchExistingSchedule = async () => {
        // If parent provided data, use it immediately
        if (initialScheduleData) {
            const data = initialScheduleData;
            setScheduleId(data._id || data.id || null);
            setTimezone(data.timezone || 'Asia/Kolkata');
            setSendDays(data.sendDays || []);
            setFromTime(data.from || '09:00');
            setToTime(data.to || '18:00');
            setDelayInterval(data.intervalMinutes || 2);
            setStartDate(data.campaignStartDate ? data.campaignStartDate.split('T')[0] : '');
            setMaxLeads(data.maxLeadsPerDay || 20);
            return;
        }

        setIsLoading(true);
        let fetchSuccess = false;
        try {
            const response = await fetch(`${config.API_BASE_URL}/schedule-campaign/${campaignId}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('access_token')}`
                }
            });

            if (response.ok) {
                const result = await response.json();
                if (result.data) {
                    const data = result.data;
                    setScheduleId(data._id || data.id || null);
                    setTimezone(data.timezone || 'Asia/Kolkata');
                    setSendDays(data.sendDays || []);
                    setFromTime(data.from || '09:00');
                    setToTime(data.to || '18:00');
                    setDelayInterval(data.intervalMinutes || 2);
                    setStartDate(data.campaignStartDate?.split('T')[0] || '');
                    setMaxLeads(data.maxLeadsPerDay || 20);

                    // Persist to localStorage for Config page status
                    localStorage.setItem('draft_schedule', JSON.stringify(data));
                    fetchSuccess = true;
                }
            }
        } catch (error) {
            console.error('Error fetching schedule:', error);
        }

        if (!fetchSuccess) {
            setScheduleId(null);
            try {
                const savedStr = localStorage.getItem('draft_schedule');
                if (savedStr) {
                    const saved = JSON.parse(savedStr);
                    if (saved && saved.campaignId === campaignId) {
                        if (saved._id || saved.id) setScheduleId(saved._id || saved.id);
                        setTimezone(saved.timezone || 'Asia/Kolkata');
                        setSendDays(saved.sendDays || []);
                        setFromTime(saved.from || '09:00');
                        setToTime(saved.to || '18:00');
                        setDelayInterval(saved.intervalMinutes || 2);
                        setStartDate(saved.campaignStartDate ? saved.campaignStartDate.split('T')[0] : '');
                        setMaxLeads(saved.maxLeadsPerDay || 20);
                        setIsLoading(false);
                        return; // Successfully hydrated, do not reset!
                    }
                }
            } catch (e) { console.error("Draft parse error", e); }

            // Naya form hai toh reset kar do (Fallback)
            resetForm();
        }

        setIsLoading(false);
    };

    // Ek help function reset ke liye
    const resetForm = () => {
        const now = new Date();
        const currentHours = now.getHours().toString().padStart(2, '0');
        const currentMinutes = now.getMinutes().toString().padStart(2, '0');

        setTimezone('Asia/Kolkata');
        setSendDays([]);
        setFromTime(`${currentHours}:${currentMinutes}`);
        setToTime('18:00'); // Default to 6:00 PM (Business Hours)
        setDelayInterval('');

        // Fix: Get local date correctly instead of UTC offset
        const localDate = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().split('T')[0];
        setStartDate(localDate);
        setMaxLeads('');
    };

    if (!isOpen) return null;

    const handleDayToggle = (day) => {
        setSendDays(prev =>
            prev.includes(day)
                ? prev.filter(d => d !== day)
                : [...prev, day]
        );
    };

    const handleSave = async () => {
        if (sendDays.length === 0) {
            Swal.fire('Validation Error', 'Please select at least one day.', 'warning');
            return;
        }

        if (!fromTime || !toTime || !delayInterval || !startDate || !maxLeads) {
            Swal.fire('Validation Error', 'Please fill all the schedule fields before saving.', 'warning');
            return;
        }

        setIsSaving(true);
        try {
            const payload = {
                campaignId: campaignId,
                timezone: timezone,
                sendDays: sendDays,
                from: fromTime,
                to: toTime,
                intervalMinutes: parseInt(delayInterval),
                campaignStartDate: startDate,
                maxLeadsPerDay: parseInt(maxLeads)
            };

            // Switch between POST (Create) and PATCH (Edit)
            const url = scheduleId
                ? `${config.API_BASE_URL}/schedule-campaign/${scheduleId}`
                : `${config.API_BASE_URL}/schedule-campaign`;

            const method = scheduleId ? 'PATCH' : 'POST';

            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('access_token')}`
                },
                body: JSON.stringify(payload)
            });

            const result = await response.json();

            if (response.ok) {
                // Sync to localStorage and safely include ID for later edits
                const savedPayload = { ...payload };
                if (result.data && (result.data._id || result.data.id)) {
                    savedPayload._id = result.data._id || result.data.id;
                } else if (scheduleId) {
                    savedPayload._id = scheduleId;
                }
                localStorage.setItem('draft_schedule', JSON.stringify(savedPayload));

                Swal.fire({
                    title: scheduleId ? 'Updated!' : 'Scheduled!',
                    text: result.message || 'Configuration saved successfully.',
                    icon: 'success',
                    confirmButtonColor: '#5f49e0'
                });
                if (onSaveSuccess) onSaveSuccess(savedPayload);
                onClose();
            } else {
                throw new Error(result.message || 'Operation failed');
            }
        } catch (error) {
            Swal.fire('Error', error.message, 'error');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#00011566] backdrop-blur-[1px] font-sans animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-[850px] rounded-xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 border border-[#E2E8F0] relative" onClick={(e) => e.stopPropagation()}>

                {isLoading && (
                    <div className="absolute inset-0 bg-white/60 backdrop-blur-sm z-[60] flex items-center justify-center">
                        <Loader2 className="animate-spin text-primary" size={40} />
                    </div>
                )}

                {/* HEADER */}
                <div className="flex items-center justify-between px-8 py-5 border-b border-slate-100 bg-white">
                    <h2 className="text-[16px] font-bold text-[#282B42] tracking-tight">
                        {scheduleId ? 'Edit Schedule Settings' : 'Schedule Settings'}
                    </h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-all p-1">
                        <X size={20} />
                    </button>
                </div>

                {/* BODY */}
                <div className="p-10 space-y-10 overflow-y-auto max-h-[80vh] custom-scrollbar">

                    {/* Timezone Searchable Dropdown */}
                    <div className="space-y-2.5 relative">
                        <label className="text-[13px] font-bold text-[#475569]">Timezone</label>
                        <div className="relative">
                            <div
                                onClick={() => setIsTimezoneOpen(!isTimezoneOpen)}
                                className="w-full bg-white border border-[#DADDEC] px-5 py-3 rounded-lg text-[14px] text-[#282B42] cursor-pointer flex justify-between items-center font-medium shadow-sm hover:border-[#5f49e0] transition-all"
                            >
                                <span>{timezones.find(tz => tz.value === timezone)?.label || 'Select Timezone'}</span>
                                <ChevronDown size={18} className={`text-slate-400 transition-transform ${isTimezoneOpen ? 'rotate-180' : ''}`} />
                            </div>

                            {isTimezoneOpen && (
                                <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-[#DADDEC] rounded-xl shadow-2xl z-[70] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                                    <div className="p-3 border-b border-slate-100 bg-slate-50">
                                        <div className="relative">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                                            <input
                                                autoFocus
                                                type="text"
                                                placeholder="Search timezone (e.g. Kolkata, London...)"
                                                value={searchTimezone}
                                                onChange={(e) => setSearchTimezone(e.target.value)}
                                                className="w-full bg-white border border-slate-200 pl-9 pr-4 py-2 rounded-md text-[13px] outline-none focus:border-[#5f49e0] font-medium"
                                                onClick={(e) => e.stopPropagation()}
                                            />
                                        </div>
                                    </div>
                                    <div className="max-h-[250px] overflow-y-auto custom-scrollbar">
                                        {filteredTimezones.length > 0 ? (
                                            filteredTimezones.map((tz) => (
                                                <div
                                                    key={tz.value}
                                                    onClick={() => {
                                                        setTimezone(tz.value);
                                                        setIsTimezoneOpen(false);
                                                        setSearchTimezone('');
                                                    }}
                                                    className={`px-5 py-3 text-[13px] cursor-pointer transition-all flex items-center justify-between group
                                                        ${timezone === tz.value ? 'bg-[#5f49e0] text-white' : 'hover:bg-slate-50 text-slate-700'}`}
                                                >
                                                    <span className="font-semibold">{tz.label}</span>
                                                    {timezone === tz.value && <Check size={14} strokeWidth={3} />}
                                                </div>
                                            ))
                                        ) : (
                                            <div className="p-8 text-center text-slate-400 text-[13px] font-medium">No timezone found</div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Day Selection */}
                    <div className="space-y-4">
                        <label className="text-[13px] font-bold text-[#475569]">Send these days</label>
                        <div className="flex items-center justify-between bg-[#F8FAFC] p-5 rounded-xl border border-[#F1F5F9]">
                            {daysList.map((day) => (
                                <label key={day} className="flex items-center gap-2.5 cursor-pointer group">
                                    <input
                                        type="checkbox"
                                        checked={sendDays.includes(day)}
                                        onChange={() => handleDayToggle(day)}
                                        className="w-[18px] h-[18px] accent-[#5f49e0]"
                                    />
                                    <span className={`text-[13px] font-semibold transition-colors ${sendDays.includes(day) ? 'text-[#5f49e0]' : 'text-[#475569]'}`}>
                                        {day.slice(0, 3)}
                                    </span>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Time & Frequency Section - Redesigned */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Box 1: Time Window */}
                        <div className="bg-[#F8FAFC] border border-[#F1F5F9] p-6 rounded-2xl space-y-4">
                            <div>
                                <h3 className="text-[13px] font-bold text-[#282B42]">Daily Sending Window</h3>
                                <p className="text-[11px] font-medium text-slate-400">When should your emails go out?</p>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="flex-1 space-y-1.5">
                                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Start Time</span>
                                    <input
                                        type="time"
                                        value={fromTime || ''}
                                        onChange={(e) => setFromTime(e.target.value)}
                                        className="w-full bg-white border border-[#DADDEC] focus:border-[#5f49e0] px-3 py-2.5 rounded-lg text-[14px] font-bold outline-none transition-all"
                                    />
                                </div>
                                <div className="text-slate-300 pt-5 font-black shrink-0 text-xs">TO</div>
                                <div className="flex-1 space-y-1.5">
                                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">End Time</span>
                                    <input
                                        type="time"
                                        value={toTime || ''}
                                        onChange={(e) => setToTime(e.target.value)}
                                        className="w-full bg-white border border-[#DADDEC] focus:border-[#5f49e0] px-3 py-2.5 rounded-lg text-[14px] font-bold outline-none transition-all"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Box 2: Frequency */}
                        <div className="bg-[#F8FAFC] border border-[#F1F5F9] p-6 rounded-2xl space-y-4 pl-6">
                            <div>
                                <h3 className="text-[13px] font-bold text-[#282B42]">Email Frequency</h3>
                                <p className="text-[11px] font-medium text-slate-400">Delay between consecutive emails</p>
                            </div>
                            <div className="space-y-1.5 pt-0.5">
                                <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Wait Interval</span>
                                <div className="relative flex items-center">
                                    <input
                                        type="number"
                                        value={delayInterval || ''}
                                        onChange={(e) => setDelayInterval(e.target.value)}
                                        className="w-full bg-white border border-[#DADDEC] focus:border-[#5f49e0] pl-4 pr-16 py-[9px] rounded-lg text-[14px] font-black outline-none transition-all"
                                        placeholder="e.g. 5"
                                    />
                                    <span className="absolute right-4 text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-2 py-1 rounded">Mins</span>
                                </div>
                            </div>
                        </div>
                    </div>




                    {/* AI Variance Notice */}
                    <div className="bg-[#f0f7ff] border border-[#e0eefe] rounded-2xl p-6 relative overflow-hidden group mb-8">
                        <div className="absolute -right-6 -top-6 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl group-hover:bg-blue-500/10 transition-all"></div>
                        <div className="relative flex items-start gap-4">
                            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-blue-50 shrink-0">
                                <Zap size={22} className="text-[#5f49e0]" fill="currentColor" />
                            </div>
                            <div className="space-y-1.5">
                                <div className="flex items-center gap-2">
                                    <h4 className="text-[13px] font-black text-[#282B42] uppercase tracking-tight">AI Smart Delivery Variance</h4>
                                    <span className="bg-[#5f49e0] text-[9px] font-black text-white px-2 py-0.5 rounded uppercase tracking-widest">Human touch</span>
                                </div>
                                <p className="text-[12px] text-slate-500 font-medium leading-relaxed max-w-[550px]">
                                    Our AI introduces a <span className="text-[#5f49e0] font-bold">30 to 60-second</span> variance trigger, adding a human touch to enhance deliverability and protection.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Bottom Fields Row */}
                    <div className="grid grid-cols-2 gap-10 pt-2">
                        <div className="space-y-2.5">
                            <label className="text-[13px] font-bold text-[#475569]">Start Date</label>
                            <input
                                type="date"
                                value={startDate || ''}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="w-full bg-white border border-[#DADDEC] px-5 py-3 rounded-lg text-[14px] font-medium"
                            />
                        </div>
                        <div className="space-y-2.5">
                            <label className="text-[13px] font-bold text-[#475569]">Max Leads Per Day</label>
                            <input
                                type="number"
                                value={maxLeads || ''}
                                onChange={(e) => setMaxLeads(e.target.value)}
                                className="w-full bg-white border border-[#DADDEC] px-5 py-3 rounded-lg text-[14px] font-medium"
                            />
                        </div>
                    </div>
                </div>

                {/* FOOTER */}
                <div className="px-8 py-5 border-t border-slate-100 flex justify-end bg-[#FDFDFF] shrink-0">
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="bg-[#5f49e0] text-white px-12 py-3 rounded-lg text-[14px] font-black uppercase tracking-[0.1em] shadow-lg hover:bg-[#5f49e0]/90 transition-all flex items-center gap-3"
                    >
                        {isSaving ? <Loader2 size={18} className="animate-spin" /> : (scheduleId ? 'Update Settings' : 'Save Configuration')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ScheduleModal;
