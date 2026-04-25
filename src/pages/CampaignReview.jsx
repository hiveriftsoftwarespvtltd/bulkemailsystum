import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ArrowLeft,
    X,
    CheckCircle2,
    Send,
    Upload,
    FileText,
    Layout,
    Settings,
    Search,
    Filter,
    Monitor,
    Smartphone,
    ChevronDown,
    Info,
    Check,
    ShieldAlert,
    Zap,
    Save,
    RotateCcw,
    Loader2
} from 'lucide-react';
import { CKEditor } from '@ckeditor/ckeditor5-react';
import {
    ClassicEditor,
    Bold,
    Italic,
    Link,
    List,
    Heading,
    BlockQuote,
    Essentials,
    Paragraph,
    Undo,
    Image,
    ImageBlock,
    ImageInline,
    ImageUpload,
    Base64UploadAdapter,
    ImageToolbar,
    ImageCaption,
    ImageStyle,
    ImageResize,
    SourceEditing,
    GeneralHtmlSupport
} from 'ckeditor5';
import 'ckeditor5/ckeditor5.css';
import Swal from 'sweetalert2';
import config from '../config';
import SendTestEmailModal from '../components/SendTestEmailModal';

const CampaignReview = () => {
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const [isTestModalOpen, setIsTestModalOpen] = useState(false);
    const [activeLeadId, setActiveLeadId] = useState(1);
    const [viewMode, setViewMode] = useState('desktop');
    const [campaignName, setCampaignName] = useState(localStorage.getItem('draft_campaign_name') || 'Untitled Campaign');

    const [senderEmail, setSenderEmail] = useState('Fetching...');
    useEffect(() => {
        const fetchSenderEmail = async () => {
            try {
                const storedEmails = localStorage.getItem('selected_sender_emails');
                if (storedEmails) {
                    const parsed = JSON.parse(storedEmails);
                    if (parsed && parsed.length > 0) {
                        setSenderEmail(parsed[0]);
                        return;
                    }
                }
                const idsRaw = localStorage.getItem('selected_sender_ids');
                if (idsRaw) {
                    const ids = JSON.parse(idsRaw);
                    if (ids && ids.length > 0) {
                        const res = await fetch(`${config.API_BASE_URL}/smtp-sender`, {
                            headers: { 'Authorization': `Bearer ${localStorage.getItem('access_token')}` }
                        });
                        if (res.ok) {
                            const result = await res.json();
                            const matched = (result.data || []).find(acc => ids.includes(acc._id));
                            if (matched && matched.fromEmail) {
                                setSenderEmail(matched.fromEmail);
                                localStorage.setItem('selected_sender_emails', JSON.stringify([matched.fromEmail]));
                                return;
                            }
                        }
                    }
                }
                setSenderEmail('Pending SMTP Selection');
            } catch (e) {
                setSenderEmail('Pending SMTP Selection');
            }
        };
        fetchSenderEmail();
    }, []);

    // Campaign Data States
    const [subject, setSubject] = useState('');
    const [editorData, setEditorData] = useState('');
    const [isLoadingData, setIsLoadingData] = useState(true);
    const [isUpdating, setIsUpdating] = useState(false);
    const [contacts, setContacts] = useState(() => {
        const saved = localStorage.getItem('draft_contacts');
        return saved ? JSON.parse(saved) : [];
    });

    const campaignId = localStorage.getItem('current_campaign_id');

    // Fetch initial data
    useEffect(() => {
        if (campaignId) {
            fetchCampaignDetails();
        } else {
            setIsLoadingData(false);
        }
    }, [campaignId]);

    const fetchCampaignDetails = async () => {
        try {
            const response = await fetch(`${config.API_BASE_URL}/create-campaign/${campaignId}`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('access_token')}` }
            });

            if (response.status === 404) {
                // Agar campaign delete ho chuka hai ya nahi mila
                console.warn("Campaign not found. Redirecting...");
                localStorage.removeItem('current_campaign_id');
                Swal.fire('Oops!', 'This campaign no longer exists.', 'error');
                navigate('/campaigns'); // Wapas list par bhej do
                return;
            }

            const result = await response.json();
            if (response.ok && result.data) {
                const campaign = result.data;
                setCampaignName(campaign.name || 'Untitled Campaign');
                setSubject(campaign.subject || '');
                setEditorData(campaign.body || '');

                const fetchedContacts = campaign.contacts || [];
                setContacts(fetchedContacts);
                try {
                    localStorage.setItem('draft_contacts', JSON.stringify(fetchedContacts));
                } catch (e) {
                    console.warn("Dataset too large for localStorage saving, kept in memory only to prevent quota crash.");
                }
            }
        } catch (error) {
            console.error("Error fetching campaign details:", error);
        } finally {
            setIsLoadingData(false);
        }
    };

    const handleUpdateCampaign = async () => {
        setIsUpdating(true);
        try {
            const response = await fetch(`${config.API_BASE_URL}/create-campaign/${campaignId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('access_token')}`
                },
                body: JSON.stringify({
                    subject: subject,
                    body: editorData
                })
            });

            if (response.ok) {
                Swal.fire({
                    toast: true,
                    position: 'top-end',
                    icon: 'success',
                    title: 'Campaign content updated!',
                    showConfirmButton: false,
                    timer: 3000
                });
            } else {
                throw new Error("Update failed");
            }
        } catch (error) {
            Swal.fire('Error', 'Failed to update content', 'error');
        } finally {
            setIsUpdating(false);
        }
    };

    const [isLaunching, setIsLaunching] = useState(false);

    const handleLaunchCampaign = async () => {
        // Get the selected sender ID from localStorage
        const savedSenderIds = localStorage.getItem('selected_sender_ids');
        let smtpAccountId = null;

        if (savedSenderIds) {
            const ids = JSON.parse(savedSenderIds);
            if (ids.length > 0) smtpAccountId = ids[0]; // Take the first selected account
        }

        if (!smtpAccountId) {
            Swal.fire('Error', 'Please select at least one sender account in Step 4.', 'error');
            return;
        }

        setIsLaunching(true);
        try {
            const response = await fetch(`${config.API_BASE_URL}/create-campaign/${campaignId}/start`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('access_token')}`
                },
                body: JSON.stringify({ smtpAccountId })
            });

            const result = await response.json();

            if (response.ok) {
                Swal.fire({
                    title: 'Campaign Launched!',
                    text: result.message || 'Your campaign has been successfully started.',
                    icon: 'success',
                    confirmButtonColor: '#5f49e0',
                    showConfirmButton: true,
                    confirmButtonText: 'Go to Dashboard'
                }).then(() => {
                    // --- CLEANUP DRAFT DATA ---
                    const draftKeys = [
                        'draft_file_data',
                        'draft_csv_headers',
                        'draft_total_leads',
                        'draft_subject',
                        'draft_editor_data',
                        'draft_company_field',
                        'draft_owner_field',
                        'draft_email_field',
                        'draft_campaign_name',
                        'current_campaign_id',
                        'selected_sender_ids',
                        'selected_sender_emails',
                        'draft_schedule'
                    ];
                    draftKeys.forEach(key => localStorage.removeItem(key));
                    navigate('/campaigns');
                });
            } else {
                throw new Error(result.message || "Failed to start campaign");
            }
        } catch (error) {
            console.error("Launch error:", error);
            Swal.fire('Launch Failed', error.message, 'error');
        } finally {
            setIsLaunching(false);
        }
    };

    const currentLead = contacts.length > 0
        ? (contacts[activeLeadId - 1] || contacts[0])
        : { email: 'Searching for leads...' };
    const leadsCount = contacts.length;

    const steps = [
        { id: 1, title: 'Import Leads', icon: <Upload size={16} /> },
        { id: 2, title: 'Sequences', icon: <FileText size={16} /> },
        { id: 3, title: 'Setup', icon: <Layout size={16} /> },
        { id: 4, title: 'Final Review', icon: <CheckCircle2 size={16} /> },
    ];

    if (isLoadingData) {
        return (
            <div className="h-screen flex items-center justify-center bg-white z-[60] fixed inset-0">
                <div className="flex flex-col items-center gap-4">
                    <Zap size={40} className="text-[#5f49e0] animate-pulse" />
                    <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Loading Campaign Details...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="h-screen flex flex-col bg-[#FDFDFF] font-sans overflow-hidden fixed inset-0 z-50">

            {/* --- TOP HEADER --- */}
            <div className="bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between shrink-0 z-10">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate('/campaigns/config')} className="p-2 text-slate-400 hover:text-slate-900 transition-all">
                        <ArrowLeft size={20} />
                    </button>
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-[#5f49e0] rounded-lg flex items-center justify-center text-white">
                            <Zap size={18} fill="currentColor" />
                        </div>
                        <h2 className="text-[17px] font-black text-[#282B42]">{campaignName}</h2>
                    </div>
                </div>

                {/* Final Status Indicator */}
                <div className="px-5 py-2.5 bg-emerald-50 rounded-full border border-emerald-100 flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                    <span className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.2em]">Ready for Launch</span>
                </div>

                <button onClick={() => navigate('/campaigns')} className="text-slate-400 hover:text-slate-900 border border-slate-100 p-2 rounded-xl transition-all"><X size={20} /></button>
            </div>

            {/* --- MAIN CONTENT LAYOUT --- */}
            <div className="flex-1 flex overflow-hidden">
                <div className="flex-1 overflow-y-auto bg-[#F8FAFC] p-8 flex flex-col items-center custom-scrollbar">

                    {/* View Switcher */}
                    <div className="flex bg-white p-1 rounded-lg border border-slate-100 mb-8 self-center shadow-sm">
                        <button onClick={() => setViewMode('desktop')} className={`p-2 rounded ${viewMode === 'desktop' ? 'bg-[#5f49e0] text-white shadow-lg shadow-indigo-100' : 'text-slate-400'}`}>
                            <Monitor size={18} />
                        </button>
                        <button onClick={() => setViewMode('mobile')} className={`p-2 rounded ${viewMode === 'mobile' ? 'bg-[#5f49e0] text-white shadow-lg shadow-indigo-100' : 'text-slate-400'}`}>
                            <Smartphone size={18} />
                        </button>
                    </div>

                    {/* Email Card Template */}
                    <div className={`bg-white rounded-xl shadow-soft border border-slate-100 flex flex-col overflow-hidden transition-all duration-500 ease-in-out ${viewMode === 'mobile' ? 'w-[375px]' : 'w-full max-w-[900px]'
                        }`}>

                        {/* Email Fields */}
                        <div className="px-8 py-6 space-y-4 border-b border-slate-50 bg-white">
                            <div className="flex items-center gap-4">
                                <label className="text-[13px] font-bold text-slate-400 w-16 uppercase tracking-wider">From</label>
                                <p className="text-[14px] font-semibold text-slate-600 font-sans tracking-tight">{senderEmail}</p>
                            </div>
                            <div className="flex items-center gap-4">
                                <label className="text-[13px] font-bold text-slate-400 w-16 uppercase tracking-wider">Subject</label>
                                <input
                                    type="text"
                                    value={subject}
                                    onChange={(e) => setSubject(e.target.value)}
                                    className="flex-1 text-[14px] font-bold text-slate-800 outline-none border-b border-transparent focus:border-[#5f49e0]/30 pb-1"
                                />
                            </div>
                        </div>

                        {/* Editor Area */}
                        <div className="p-8 pb-12 bg-white min-h-[400px]">
                            <div className="border border-slate-100 rounded-xl overflow-y-auto max-h-[600px] custom-scrollbar shadow-sm">
                                <CKEditor
                                    editor={ClassicEditor}
                                    data={editorData}
                                    config={{
                                        plugins: [
                                            Essentials, Paragraph, Heading, Bold, Italic, Link, List, BlockQuote, Undo,
                                            Image, ImageBlock, ImageInline, ImageUpload, Base64UploadAdapter, ImageToolbar, ImageCaption, ImageStyle, ImageResize, 
                                            SourceEditing, GeneralHtmlSupport
                                        ],
                                        toolbar: [
                                            'sourceEditing', '|',
                                            'heading', '|',
                                            'bold', 'italic', 'link', 'bulletedList', 'numberedList', 'blockQuote', '|',
                                            'uploadImage', '|',
                                            'undo', 'redo'
                                        ],
                                        htmlSupport: {
                                            allow: [
                                                { name: /.*/, attributes: true, classes: true, styles: true },
                                                { name: 'style' },
                                                { name: 'img', attributes: { src: true, alt: true, width: true, height: true, style: true } }
                                            ]
                                        },
                                        placeholder: 'Start writing your message...',
                                        licenseKey: 'GPL'
                                    }}
                                    onChange={(event, editor) => setEditorData(editor.getData())}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* --- STICKY FOOTER --- */}
            <div className="bg-white border-t border-slate-100 px-10 py-5 flex justify-end items-center gap-6 shrink-0 z-10 shadow-[0_-4px_20px_0_rgba(0,0,0,0.02)]">

                <button
                    onClick={handleUpdateCampaign}
                    disabled={isUpdating}
                    className="flex items-center gap-2 px-6 py-3 bg-slate-100/50 text-slate-500 rounded-xl text-[12px] font-black uppercase tracking-widest hover:bg-slate-100 transition-all border border-slate-100"
                >
                    {isUpdating ? <RotateCcw size={16} className="animate-spin" /> : <Save size={16} />}
                    Update Content
                </button>

                <div className="h-8 w-px bg-slate-100"></div>

                {/* <button className="text-[12px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-600 transition-all">Run Spam Test</button> */}
                <button
                    onClick={() => setIsTestModalOpen(true)}
                    className="flex items-center gap-2 px-6 py-3 bg-[#eef2ff] text-[#5f49e0] border border-[#e0e7ff] rounded-xl text-[12px] font-black uppercase tracking-widest hover:bg-[#e0e7ff] hover:-translate-y-0.5 transition-all shadow-sm"
                >
                    <Send size={16} />
                    Send Test Email
                </button>

                <button
                    onClick={handleLaunchCampaign}
                    disabled={isLaunching}
                    className="bg-emerald-500 text-white px-12 py-3 rounded-xl text-[12px] font-black uppercase tracking-[0.2em] shadow-xl shadow-emerald-100 hover:bg-emerald-600 hover:-translate-y-1 transition-all active:scale-95 flex items-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                    {isLaunching ? (
                        <>
                            LAUNCHING...
                            <Loader2 size={16} className="animate-spin" />
                        </>
                    ) : (
                        <>
                            LAUNCH CAMPAIGN
                            <Zap size={16} fill="white" />
                        </>
                    )}
                </button>
            </div>

            <SendTestEmailModal
                isOpen={isTestModalOpen}
                onClose={() => setIsTestModalOpen(false)}
                campaignId={campaignId}
                subject={subject}
                body={editorData}
            />
        </div>
    );
};

export default CampaignReview;
