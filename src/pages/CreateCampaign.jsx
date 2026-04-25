import React, { useState, useRef, useMemo, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { X, Upload, FileText, ChevronRight, CheckCircle2, Loader2, ArrowLeft, ChevronDown, Eye, Users, ChevronLeft, Layout, Type, Sparkles, Send, Braces, Settings, Code, Pencil, Plus } from 'lucide-react';
import Papa from 'papaparse';
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

const CreateCampaign = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const queryParams = new URLSearchParams(location.search);
    const initialStep = parseInt(queryParams.get('step')) || 1;

    const [currentStep, setCurrentStep] = useState(initialStep);

    // Persistent States
    const [fileData, setFileData] = useState(JSON.parse(localStorage.getItem('draft_file_data') || '{"path": "", "name": ""}'));
    const [csvHeaders, setCsvHeaders] = useState(JSON.parse(localStorage.getItem('draft_csv_headers') || '[]'));

    const [file, setFile] = useState(null);
    const [csvData, setCsvData] = useState([]);
    const [totalLeads, setTotalLeads] = useState(parseInt(localStorage.getItem('draft_total_leads') || '0'));
    const [isUploading, setIsUploading] = useState(false);
    const [showPreview, setShowPreview] = useState(false);
    const fileInputRef = useRef(null);

    const [currentPage, setCurrentPage] = useState(1);
    const rowsPerPage = 10;

    const [subject, setSubject] = useState(localStorage.getItem('draft_subject') || '');
    const [editorData, setEditorData] = useState(localStorage.getItem('draft_editor_data') || '');
    const [companyField, setCompanyField] = useState(localStorage.getItem('draft_company_field') || 'Company Name');
    const [ownerField, setOwnerField] = useState(localStorage.getItem('draft_owner_field') || 'Owner Name');
    const [emailField, setEmailField] = useState(localStorage.getItem('draft_email_field') || 'Email');
    const [isVarDropdownOpen, setIsVarDropdownOpen] = useState(false);
    const [isSubjectVarOpen, setIsSubjectVarOpen] = useState(false);
    const [isHtmlMode, setIsHtmlMode] = useState(false);
    const subjectInputRef = useRef(null);
    const pencilBtnRef = useRef(null);
    const [subjectDropdownPos, setSubjectDropdownPos] = useState({ top: 0, left: 0 });

    // Save to localStorage on change
    useEffect(() => {
        localStorage.setItem('draft_file_data', JSON.stringify(fileData));
    }, [fileData]);

    useEffect(() => {
        localStorage.setItem('draft_csv_headers', JSON.stringify(csvHeaders));
    }, [csvHeaders]);

    useEffect(() => {
        localStorage.setItem('draft_total_leads', totalLeads);
    }, [totalLeads]);

    useEffect(() => {
        localStorage.setItem('draft_subject', subject);
        localStorage.setItem('draft_editor_data', editorData);
        localStorage.setItem('draft_company_field', companyField);
        localStorage.setItem('draft_owner_field', ownerField);
        localStorage.setItem('draft_email_field', emailField);
    }, [subject, editorData, companyField, ownerField, emailField]);

    // Hydrate existing campaign data if editing
    useEffect(() => {
        const campaignId = localStorage.getItem('current_campaign_id');
        if (!campaignId) return;

        const hydrateCampaign = async () => {
            try {
                const response = await fetch(`${config.API_BASE_URL}/create-campaign/${campaignId}`, {
                    headers: { 'Authorization': `Bearer ${localStorage.getItem('access_token')}` }
                });
                const result = await response.json();
                if (response.ok && result.data) {
                    const campaign = result.data;
                    
                    // Always overwrite with server data when editing
                    setSubject(campaign.subject || '');
                    setEditorData(campaign.body || '');
                    
                    if (campaign.companyField) setCompanyField(campaign.companyField);
                    if (campaign.ownerField) setOwnerField(campaign.ownerField);
                    if (campaign.emailField) setEmailField(campaign.emailField);
                    
                    if (campaign.filePath) {
                        const newFileData = { path: campaign.filePath, name: campaign.name || 'campaign_file.csv' };
                        setFileData(newFileData);
                        localStorage.setItem('draft_file_data', JSON.stringify(newFileData));
                    }

                    // Extract columns/headers
                    if (campaign.columns && campaign.columns.length > 0) {
                        setCsvHeaders(campaign.columns);
                        localStorage.setItem('draft_csv_headers', JSON.stringify(campaign.columns));
                    } else if (campaign.contacts && campaign.contacts.length > 0) {
                        const extracted = Object.keys(campaign.contacts[0]);
                        setCsvHeaders(extracted);
                        localStorage.setItem('draft_csv_headers', JSON.stringify(extracted));
                    }
                    
                    if (campaign.contacts) {
                        setTotalLeads(campaign.contacts.length);
                        localStorage.setItem('draft_total_leads', campaign.contacts.length.toString());
                    }
                }
            } catch (error) {
                console.error("Hydration error in CreateCampaign:", error);
            }
        };

        hydrateCampaign();
    }, []);

    const goToStep = (step) => {
        setCurrentStep(step);
        navigate(`/campaigns/create?step=${step}`, { replace: true });
    };

    useEffect(() => {
        const stepFromUrl = parseInt(new URLSearchParams(location.search).get('step')) || 1;
        if (stepFromUrl !== currentStep) {
            setCurrentStep(stepFromUrl);
        }
    }, [location.search]);



    const insertSubjectVariable = (varName) => {
        const tag = `{{${varName}}}`;
        const input = subjectInputRef.current;
        if (!input) return;
        const start = input.selectionStart ?? subject.length;
        const end = input.selectionEnd ?? subject.length;
        const newVal = subject.slice(0, start) + tag + subject.slice(end);
        setSubject(newVal);
        setIsSubjectVarOpen(false);
        setTimeout(() => {
            input.focus();
            input.setSelectionRange(start + tag.length, start + tag.length);
        }, 0);
    };

    const openSubjectVarDropdown = () => {
        if (pencilBtnRef.current) {
            const rect = pencilBtnRef.current.getBoundingClientRect();
            setSubjectDropdownPos({
                top: rect.bottom + 6,
                left: rect.right - 208,
            });
        }
        setIsSubjectVarOpen(prev => !prev);
    };

    const steps = [
        { id: 1, title: 'Import Leads', icon: <Users size={18} /> },
        { id: 2, title: 'Mapping', icon: <FileText size={18} /> },
        { id: 3, title: 'Content', icon: <Layout size={18} /> },
    ];

    const handleDeleteFile = (e) => {
        if (e) e.stopPropagation();
        setFileData({ path: '', name: '' });
        setFile(null);
        setCsvHeaders([]);
        setTotalLeads(0);
        localStorage.removeItem('draft_file_data');
        localStorage.removeItem('draft_csv_headers');
        localStorage.removeItem('draft_total_leads');
    };

    const handleFile = async (selectedFile) => {
        if (selectedFile && selectedFile.name.endsWith('.csv')) {
            setIsUploading(true);
            Papa.parse(selectedFile, {
                header: true,
                skipEmptyLines: true,
                complete: (results) => {
                    if (results.data && results.data.length > 0) {
                        // FIX: Only store first 10 rows for preview to save memory
                        const preview = results.data.slice(0, 10);
                        setCsvData(preview);
                        
                        const headers = Object.keys(results.data[0]);
                        setCsvHeaders(headers);
                        setTotalLeads(results.data.length);
                        setIsUploading(false);
                        
                        // Important fields cleanup
                        setCompanyField('Company Name');
                        setOwnerField('Owner Name');
                        setEmailField('Email');

                        Swal.fire({
                            title: 'Success!',
                            text: `${results.data.length} leads loaded successfully.`,
                            icon: 'success',
                            confirmButtonColor: '#5f49e0'
                        });
                        setFile(selectedFile);
                        setCurrentPage(1);
                    }
                }
            });

            const formData = new FormData();
            formData.append('file', selectedFile);

            try {
                const response = await fetch(`${config.API_BASE_URL}/create-campaign/upload`, {
                    method: 'POST',
                    body: formData,
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('access_token')}`
                    }
                });

                if (response.ok) {
                    const result = await response.json();
                    const csvInfo = result.data;
                    setCsvHeaders(csvInfo.columns);
                    setFileData({ path: csvInfo.filePath, name: csvInfo.fileName });
                } else {
                    throw new Error("Upload failed on server");
                }
            } catch (error) {
                console.error("Upload failed", error);
                Swal.fire('Error', 'File upload failed', 'error');
            } finally {
                setIsUploading(false);
            }
        }
    };

    const paginatedData = useMemo(() => {
        const startIndex = (currentPage - 1) * rowsPerPage;
        return csvData.slice(startIndex, startIndex + rowsPerPage);
    }, [csvData, currentPage]);

    const totalPages = Math.ceil(csvData.length / rowsPerPage);

    const insertVariable = (variable) => {
        const varString = `{{${variable}}}`;
        setEditorData(prev => prev + varString);
        setIsVarDropdownOpen(false);
    };

    const handleMapFields = async () => {
        setIsUploading(true);
        try {
            const payload = {
                filePath: fileData.path,
                companyField: companyField,
                ownerField: ownerField,
                emailField: emailField
            };

            const response = await fetch(`${config.API_BASE_URL}/create-campaign/map`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('access_token')}`
                },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                goToStep(3);
            } else {
                const data = await response.json();
                throw new Error(data.message || 'Failed to map fields on server');
            }
        } catch (error) {
            Swal.fire('Error', error.message, 'error');
        } finally {
            setIsUploading(false);
        }
    };

    const handleFinalCreate = async () => {
        setIsUploading(true);
        try {
            const payload = {
                name: fileData.name || "My Campaign", // Using file name as fallback name
                filePath: fileData.path,
                companyField: companyField,
                ownerField: ownerField,
                emailField: emailField,
                subject: subject,
                body: editorData
            };

            const response = await fetch(`${config.API_BASE_URL}/create-campaign/create`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('access_token')}`
                },
                body: JSON.stringify(payload)
            });

            const data = await response.json();

            if (response.ok) {
                localStorage.setItem('current_campaign_id', data.data.campaign?._id);
                Swal.fire({
                    title: 'Campaign Created!',
                    text: 'Leads processed successfully. Now configure your settings.',
                    icon: 'success',
                    confirmButtonColor: '#4f46e5'
                }).then(() => {
                    navigate('/campaigns/config');
                });
            } else {
                throw new Error(data.message || 'Failed to create campaign');
            }
        } catch (error) {
            Swal.fire('Error', error.message, 'error');
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="h-full flex flex-col bg-surface font-sans page-animate overflow-hidden fixed inset-0 z-50">
            {/* --- TOP HEADER (STEPPER) --- */}
            <div className="bg-background border-b border-border px-8 py-4 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => currentStep === 1 ? navigate('/campaigns') : goToStep(currentStep - 1)}
                        className="p-2 hover:bg-slate-50 rounded-full text-text-muted transition-all active:scale-90"
                    >
                        <ArrowLeft size={20} strokeWidth={2.5} />
                    </button>
                    <h2 className="text-lg font-black text-text-main uppercase tracking-widest font-heading">
                        Create New Campaign
                    </h2>
                </div>

                {/* Progress Stepper */}
                <div className="hidden md:flex items-center gap-8">
                    {steps.map((step) => (
                        <div key={step.id} className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-500 ${currentStep >= step.id ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-surface text-text-muted border border-border'
                                }`}>
                                {currentStep > step.id ? <CheckCircle2 size={16} /> : step.id}
                            </div>
                            <span className={`text-xs font-bold uppercase tracking-wider ${currentStep >= step.id ? 'text-text-main' : 'text-text-muted'
                                }`}>
                                {step.title}
                            </span>
                            {step.id < steps.length && <div className="w-12 h-px bg-border"></div>}
                        </div>
                    ))}
                </div>

                <div className="flex items-center gap-4">
                    <button onClick={() => navigate('/campaigns')} className="text-text-muted hover:text-text-main transition-colors">
                        <X size={24} />
                    </button>
                </div>
            </div>

            {/* --- MAIN CONTENT AREA --- */}
            <div className="flex-1 overflow-y-auto p-6 md:p-10">

                {/* STEP 1: IMPORT LEADS */}
                {currentStep === 1 && (
                    <div className="max-w-3xl mx-auto space-y-10 fade-in py-5">
                        <div className="space-y-4 text-center">
                            <h3 className="text-4xl font-black text-text-main tracking-tight">Import your leads</h3>
                            <p className="text-text-muted font-medium">Upload a CSV file with your contact information to start the campaign.</p>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center justify-between px-2">
                                <p className="text-[10px] font-black text-text-muted uppercase tracking-[0.3em]">Lead Acquisition</p>
                                {fileData.path && <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest flex items-center gap-1"><CheckCircle2 size={12} /> File Verified</span>}
                            </div>

                            <div
                                onClick={() => !isUploading && !fileData.path && fileInputRef.current.click()}
                                className={`relative rounded-[60px] p-24 text-center transition-all duration-700 overflow-hidden border-[3px] border-dashed group
                                    ${(fileData.path && !isUploading)
                                        ? 'bg-emerald-500 border-emerald-400 shadow-2xl shadow-emerald-200 cursor-default'
                                        : 'bg-white border-slate-200 hover:border-primary/40 hover:bg-slate-50 cursor-pointer'}`}
                            >
                                <input ref={fileInputRef} type="file" accept=".csv" className="hidden" onChange={(e) => handleFile(e.target.files[0])} />

                                {/* Delete Button */}
                                {fileData.path && !isUploading && (
                                    <button
                                        onClick={handleDeleteFile}
                                        className="absolute top-8 right-8 w-12 h-12 bg-white/20 hover:bg-white/40 text-white rounded-2xl flex items-center justify-center transition-all backdrop-blur-md z-20 group/del"
                                    >
                                        <X size={24} className="group-hover/del:rotate-90 transition-transform" />
                                    </button>
                                )}

                                <div className="relative z-10 space-y-8">
                                    <div className={`w-24 h-24 rounded-[36px] flex items-center justify-center mx-auto transition-all duration-700 shadow-2xl
                                        ${(fileData.path && !isUploading) ? 'bg-white text-emerald-500 rotate-[360deg] scale-110' : 'bg-slate-50 text-slate-300 group-hover:bg-primary group-hover:text-white scale-100'}`}>
                                        {isUploading ? <Loader2 size={40} className="animate-spin text-primary" /> : (fileData.path ? <CheckCircle2 size={48} /> : <Upload size={40} />)}
                                    </div>

                                    <div className="space-y-3">
                                        <p className={`text-xl font-black uppercase tracking-widest transition-colors duration-500
                                            ${(fileData.path && !isUploading) ? 'text-white' : 'text-slate-400 group-hover:text-primary'}`}>
                                            {isUploading ? "Uploading..." : (fileData.name || "Select Lead list (CSV)")}
                                        </p>

                                        {(fileData.path && !isUploading) ? (
                                            <div className="inline-flex items-center gap-3 px-6 py-2.5 bg-white/20 backdrop-blur-md rounded-full text-white font-black uppercase tracking-[0.2em] text-[11px] animate-bounce mt-4">
                                                <Users size={16} /> {totalLeads} Leads Found
                                            </div>
                                        ) : (
                                            <p className="text-xs text-slate-300 font-bold tracking-[0.2em] uppercase">
                                                {isUploading ? "Please wait a moment" : "Click to browse or drop here"}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {isUploading && (
                                    <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] flex items-end">
                                        <div className="h-1.5 bg-primary animate-progress-indefinite w-full shadow-[0_0_10px_rgba(95,73,224,0.3)]"></div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* STEP 2: MAPPING */}
                {currentStep === 2 && (
                    <div className="max-w-7xl mx-auto space-y-8 fade-in pb-20">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="space-y-1">
                                <h3 className="text-2xl font-black text-text-main">Field Mapping</h3>
                                <p className="text-text-muted font-medium italic">Connect your columns to lead variables below.</p>
                            </div>
                            <div className="bg-background rounded-2xl px-5 py-3 border border-border flex items-center gap-4 shadow-sm">
                                <FileText className="text-emerald-500" size={18} />
                                <div><h4 className="text-xs font-bold text-text-main">{file?.name} ({totalLeads} leads)</h4></div>
                                <button onClick={() => setShowPreview(true)} className="text-[10px] font-bold text-primary hover:underline border-l pl-4">Preview</button>
                            </div>
                        </div>
                        <div className="lg:col-span-2 bg-background rounded-[32px] border border-border p-6 md:p-8 shadow-soft">
                            <div className="space-y-4">
                                {(csvHeaders || []).length > 0 ? (csvHeaders || []).map((header, idx) => (
                                    <div key={idx} className="flex items-center gap-4 p-4 bg-surface border border-border rounded-2xl">
                                        <div className="w-10 h-10 rounded-xl bg-background flex items-center justify-center shrink-0 shadow-sm font-bold text-[11px] text-text-muted uppercase">{idx + 1}</div>
                                        <p className="flex-1 text-sm font-bold text-text-main">{header}</p>
                                        <div className="w-[200px] relative">
                                            <select
                                                className="w-full bg-background border border-border p-3 rounded-xl text-xs font-bold appearance-none text-text-main outline-none focus:border-primary"
                                                onChange={(e) => {
                                                    const val = e.target.value;
                                                    if (val === "Email") setEmailField(header);
                                                    if (val === "Company Name") setCompanyField(header);
                                                    if (val === "Owner Name") setOwnerField(header);
                                                }}
                                            >
                                                <option value="">Select Field...</option>
                                                <option value="Email" selected={emailField === header}>Email</option>
                                                <option value="Company Name" selected={companyField === header}>Company Name</option>
                                                <option value="Owner Name" selected={ownerField === header}>Owner Name</option>
                                            </select>
                                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted" size={14} />
                                        </div>
                                    </div>
                                )) : (
                                    <div className="text-center py-16 px-6">
                                        <div className="mx-auto w-16 h-16 bg-slate-50 border border-slate-100 rounded-full flex items-center justify-center mb-4">
                                            <FileText size={24} className="text-slate-400" />
                                        </div>
                                        <p className="text-[14px] font-black text-slate-700 mb-2">No File Detected</p>
                                        <p className="text-[11px] font-bold text-slate-400 mb-6 max-w-[250px] mx-auto">Please go back to Step 1 and upload a valid CSV file to map fields.</p>
                                        <button onClick={() => goToStep(1)} className="px-6 py-2.5 bg-primary text-white text-[11px] font-black uppercase tracking-widest rounded-xl hover:bg-primary/90 transition-all shadow-lg shadow-primary/20">Go To Import</button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* STEP 3: CONTENT EDITOR (USER DESIGN) */}
                {currentStep === 3 && (
                    <div className="max-w-4xl mx-auto space-y-8 fade-in pb-20">
                        <div className="space-y-1 text-center">
                            <h3 className="text-2xl font-black text-text-main">Email Campaign Content</h3>
                            <p className="text-text-muted font-medium italic">Craft your personalized message below.</p>
                        </div>

                        {/* Editor Module */}
                        <div className="bg-background rounded-[32px] border border-border shadow-soft overflow-visible relative">

                            {/* Editor Header: Subject & Dropdown Wrapper */}
                            <div className="p-8 pb-4 space-y-6">
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <label className="text-[10px] font-black text-text-muted uppercase tracking-widest leading-none ml-1">Email Subject Line</label>

                                        {/* PERSONALIZATION DROPDOWN */}
                                        <div className="relative">
                                            <button
                                                onClick={() => setIsVarDropdownOpen(!isVarDropdownOpen)}
                                                className="flex items-center gap-2 px-4 py-2 bg-primary/5 text-primary rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-primary/10 transition-all border border-primary/10"
                                            >
                                                <Braces size={14} strokeWidth={2.5} /> Personalization <ChevronDown size={14} />
                                            </button>

                                            {isVarDropdownOpen && (
                                                <>
                                                    <div className="fixed inset-0 z-40" onClick={() => setIsVarDropdownOpen(false)}></div>
                                                    <div className="absolute right-0 mt-2 w-56 bg-background rounded-2xl shadow-xl border border-border p-2 z-50 fade-in text-text-main">
                                                        <div className="p-2 px-3 border-b border-slate-50 mb-1">
                                                            <p className="text-[9px] font-black text-text-muted uppercase tracking-widest">Lead Variables</p>
                                                        </div>
                                                        <div className="max-h-[250px] overflow-y-auto">
                                                            {(csvHeaders && csvHeaders.length > 0 ? csvHeaders : ['firstName', 'lastName', 'email']).map((v) => (
                                                                <button
                                                                    key={v}
                                                                    onClick={() => insertVariable(v)}
                                                                    className="w-full text-left p-3 hover:bg-primary/5 rounded-xl text-xs font-bold transition-all flex items-center justify-between group"
                                                                >
                                                                    <span className="text-slate-400 group-hover:text-primary transition-colors">{`{{${v}}}`}</span>
                                                                    <div className="w-5 h-5 bg-surface rounded group-hover:bg-primary/20 flex items-center justify-center"><ChevronRight size={12} className="text-text-muted group-hover:text-primary" /></div>
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                    <div className="relative group">
                                        <Type className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-primary transition-colors" size={18} />
                                        <input
                                            ref={subjectInputRef}
                                            value={subject}
                                            onChange={(e) => setSubject(e.target.value)}
                                            type="text"
                                            placeholder="Enter campaign subject..."
                                            className="w-full bg-surface border border-border p-4 pl-12 pr-12 rounded-2xl outline-none focus:border-primary focus:bg-background transition-all text-sm font-bold text-text-main placeholder:text-text-muted"
                                        />

                                        {/* Pencil / Variable Picker Button */}
                                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                            <button
                                                ref={pencilBtnRef}
                                                type="button"
                                                onClick={() => setIsSubjectVarOpen(!isSubjectVarOpen)}
                                                className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all ${isSubjectVarOpen
                                                    ? 'bg-primary text-white shadow-lg shadow-primary/30'
                                                    : 'bg-surface text-text-muted hover:bg-primary/10 hover:text-primary border border-border'
                                                    }`}
                                            >
                                                <Pencil size={15} strokeWidth={2.5} />
                                            </button>

                                            {isSubjectVarOpen && (
                                                <>
                                                    <div className="fixed inset-0 z-[9998]" onClick={() => setIsSubjectVarOpen(false)}></div>
                                                    <div className="absolute left-full top-0 ml-6 w-64 bg-background rounded-[24px] shadow-[0_20px_60px_rgba(0,0,0,0.2)] border border-border p-3 z-[9999] animate-in slide-in-from-left-2 duration-200">
                                                        <div className="px-3 py-2 border-b border-border/50 mb-2">
                                                            <p className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">Insert variable</p>
                                                        </div>
                                                        <div className="max-h-[250px] overflow-y-auto custom-scrollbar">
                                                            {(csvHeaders && csvHeaders.length > 0 ? csvHeaders : ['firstName', 'lastName', 'email']).map((v) => (
                                                                <button
                                                                    key={v}
                                                                    onClick={() => insertSubjectVariable(v)}
                                                                    className="w-full text-left p-3 hover:bg-primary/5 rounded-xl text-xs font-bold text-text-main transition-all flex items-center justify-between group"
                                                                >
                                                                    <span className="text-slate-400 group-hover:text-primary transition-colors">{`{{${v}}}`}</span>
                                                                    <div className="w-5 h-5 bg-surface rounded group-hover:bg-primary/20 flex items-center justify-center">
                                                                        <Plus size={12} className="text-text-muted group-hover:text-primary" />
                                                                    </div>
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="px-8 pb-8">
                                <div className="flex items-center justify-end mb-3">
                                    <button
                                        type="button"
                                        onClick={() => setIsHtmlMode(!isHtmlMode)}
                                        className={`flex items-center gap-2 px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-[0.15em] transition-all border shadow-sm hover:scale-[1.02] active:scale-[0.98] ${isHtmlMode
                                            ? 'bg-slate-900 border-slate-800 text-white shadow-lg shadow-slate-200'
                                            : 'bg-white border-slate-200 text-slate-600 hover:border-primary/30 hover:text-primary'
                                            }`}
                                    >
                                        <Code size={14} strokeWidth={3} className={isHtmlMode ? "text-primary" : ""} />
                                        {isHtmlMode ? 'Back to Visual' : 'Edit HTML Source'}
                                    </button>
                                </div>

                                {isHtmlMode ? (
                                    <div className="border border-slate-900 rounded-[32px] overflow-hidden bg-[#0f172a] shadow-2xl animate-in zoom-in-95 duration-300">
                                        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 border-b border-slate-800">
                                            <div className="flex gap-2">
                                                <div className="w-3 h-3 rounded-full bg-[#ff5f56]"></div>
                                                <div className="w-3 h-3 rounded-full bg-[#ffbd2e]"></div>
                                                <div className="w-3 h-3 rounded-full bg-[#27c93f]"></div>
                                            </div>
                                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Source Editor</span>
                                        </div>
                                        <textarea
                                            value={editorData}
                                            onChange={(e) => setEditorData(e.target.value)}
                                            className="w-full min-h-[450px] bg-transparent text-[#e2e8f0] font-mono text-sm p-8 outline-none resize-none leading-relaxed"
                                            placeholder="<!-- Write custom HTML -->"
                                            spellCheck={false}
                                        />
                                    </div>
                                ) : (
                                    <div className="ck-editor-container border border-border rounded-[32px] overflow-hidden min-h-[450px] text-text-main shadow-sm bg-white animate-in fade-in duration-500">
                                        <CKEditor
                                            key={`editor-step-${currentStep}`}
                                            editor={ClassicEditor}
                                            data={editorData || ''}
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
                                                placeholder: 'Start writing your hyper-personalized email...',
                                                licenseKey: 'GPL',
                                                image: {
                                                    toolbar: [
                                                        'imageStyle:inline', 'imageStyle:block', 'imageStyle:side', '|',
                                                        'toggleImageCaption', 'imageTextAlternative'
                                                    ]
                                                }
                                            }}
                                            onChange={(event, editor) => setEditorData(editor.getData())}
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* --- BOTTOM ACTION BAR --- */}
            <div className="bg-background border-t border-border px-8 py-6 flex items-center justify-between shrink-0">
                <button
                    onClick={() => currentStep > 1 && goToStep(currentStep - 1)}
                    className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all ${currentStep === 1 ? 'opacity-0 pointer-events-none' : 'text-text-muted hover:bg-slate-50'}`}
                >
                    <ArrowLeft size={16} /> Back
                </button>
                <button
                    onClick={() => {
                        if (currentStep === 1) goToStep(2);
                        else if (currentStep === 2) handleMapFields();
                        else handleFinalCreate();
                    }}
                    disabled={isUploading || (currentStep === 1 && !fileData.path) || (currentStep === 3 && (!subject || !editorData || editorData === '<p>&nbsp;</p>'))}
                    className={`min-w-[220px] flex items-center justify-center gap-3 px-8 py-4 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] shadow-lg transition-all
                        ${(isUploading || (currentStep === 1 && !fileData.path) || (currentStep === 3 && (!subject || !editorData || editorData === '<p>&nbsp;</p>'))) ? 'bg-surface text-text-muted cursor-not-allowed shadow-none' : 'bg-primary text-white hover:bg-primary/90 hover:-translate-y-0.5 shadow-primary/10'}`}
                >
                    {isUploading ? <Loader2 size={16} className="animate-spin" /> : (
                        <>
                            {currentStep === 1 ? "Import Leads" : currentStep === 2 ? "Setup Content" : "Finalize & Launch"}
                            <ChevronRight size={16} />
                        </>
                    )}
                </button>
            </div>

            {/* --- PREVIEW MODAL --- */}
            {showPreview && (
                <div className="fixed inset-0 z-[300] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-6 fade-in">
                    <div className="bg-background w-full max-w-6xl h-[80vh] rounded-[40px] shadow-2xl flex flex-col overflow-hidden border border-border">
                        <div className="px-8 py-6 border-b border-border flex items-center justify-between bg-white text-text-main uppercase font-black tracking-widest">
                            <h3 className="text-xl">Lead Preview</h3>
                            <button onClick={() => setShowPreview(false)} className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-slate-50 text-text-muted"><X size={20} /></button>
                        </div>
                        <div className="flex-1 overflow-auto bg-white custom-scrollbar">
                            <table className="w-full text-left border-collapse">
                                <thead className="sticky top-0 bg-white z-10 border-b border-border shadow-sm">
                                    <tr className="text-[10px] font-black text-text-muted uppercase tracking-widest">
                                        <th className="px-8 py-4 w-16">#</th>
                                        {(csvHeaders || []).map(h => (
                                            <th key={h} className="px-6 py-4">{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {paginatedData.map((row, idx) => (
                                        <tr key={idx} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-8 py-4 text-xs font-bold text-text-muted">{(currentPage - 1) * rowsPerPage + idx + 1}</td>
                                            {(csvHeaders || []).map(h => (
                                                <td key={h} className="px-6 py-4 text-xs font-medium text-text-main">{row[h]}</td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div className="px-8 py-4 bg-slate-50 border-t border-border flex items-center justify-between">
                            <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Page {currentPage} of {totalPages}</p>
                            <div className="flex gap-2">
                                <button disabled={currentPage === 1} onClick={() => setCurrentPage(prev => prev - 1)} className="p-2 border border-border rounded-xl bg-white hover:bg-slate-50 disabled:opacity-50 transition-all font-bold text-text-main shadow-sm"><ChevronLeft size={16} /></button>
                                <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(prev => prev + 1)} className="p-2 border border-border rounded-xl bg-white hover:bg-slate-50 disabled:opacity-50 transition-all font-bold text-text-main shadow-sm"><ChevronRight size={16} /></button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CreateCampaign;
