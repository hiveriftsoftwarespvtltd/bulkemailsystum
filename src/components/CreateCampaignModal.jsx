import React, { useState, useRef } from 'react';
import { X, Upload, FileText, ChevronRight, CheckCircle2, Loader2, ArrowLeft, ChevronDown, Eye } from 'lucide-react';
import Papa from 'papaparse';

const CreateCampaignModal = ({ isOpen, onClose }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [file, setFile] = useState(null);
  const [csvHeaders, setCsvHeaders] = useState([]);
  const [csvData, setCsvData] = useState([]); // Preview ke liye data yahan save hoga
  const [isUploading, setIsUploading] = useState(false);
  const [showPreview, setShowPreview] = useState(false); // Preview modal toggle
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const handleFile = (selectedFile) => {
    if (selectedFile && (selectedFile.name.endsWith('.csv'))) {
      setIsUploading(true);
      Papa.parse(selectedFile, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          setCsvHeaders(Object.keys(results.data[0] || {}));
          setCsvData(results.data.slice(0, 5)); // Sirf pehle 5 rows preview ke liye
          setFile(selectedFile);
          setIsUploading(false);
        }
      });
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-[2px]">
      
      {/* Main Modal */}
      <div className="bg-[#F8FAFC] w-full max-w-4xl rounded-[32px] shadow-2xl border border-border overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* HEADER */}
        <header className="bg-white px-8 py-5 border-b border-border flex items-center shrink-0">
          <button onClick={currentStep === 2 ? () => setCurrentStep(1) : onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 mr-2 transition-transform active:scale-90">
            <ArrowLeft size={20} strokeWidth={2.5} />
          </button>
          <h2 className="text-sm font-black text-slate-700 uppercase tracking-widest font-heading">
            {currentStep === 1 ? "Import Leads" : "Mapping Leads"}
          </h2>
          <div className="flex-1"></div>
          {/* Close button top right */}
          <button onClick={onClose} className="text-slate-300 hover:text-slate-600 transition-colors"><X size={24} /></button>
        </header>

        <div className="flex-1 overflow-y-auto p-10">
          
          {/* STEP 1: UPLOAD */}
          {currentStep === 1 && (
            <div className="max-w-2xl mx-auto py-10">
               <div 
                onClick={() => fileInputRef.current.click()}
                className={`border-2 border-dashed rounded-[32px] p-16 transition-all flex flex-col items-center text-center cursor-pointer bg-white ${file ? 'border-emerald-500 shadow-xl shadow-emerald-50' : 'border-slate-200 hover:border-primary'}`}
              >
                <input ref={fileInputRef} type="file" className="hidden" accept=".csv" onChange={(e) => handleFile(e.target.files[0])} />
                {isUploading ? <Loader2 className="text-primary animate-spin mb-4" size={40} /> : file ? <CheckCircle2 size={56} className="text-emerald-500 mb-4" /> : <Upload className="text-primary mb-6" size={40} />}
                <h3 className="text-lg font-black text-slate-800">{file ? file.name : "Select your CSV file"}</h3>
                {file && <p className="text-emerald-600 text-xs font-bold uppercase mt-2">File Uploaded Successfully</p>}
              </div>
            </div>
          )}

          {/* STEP 2: MAP FIELDS */}
          {currentStep === 2 && (
            <div className="max-w-3xl mx-auto space-y-6">
               {/* CSV Info Card */}
               <div className="bg-white rounded-2xl p-5 border border-border flex items-center gap-4">
                  <div className="bg-[#5CCA36] p-2.5 rounded-xl"><FileText className="text-white" size={20} /></div>
                  <div className="flex-1">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">CSV File</p>
                    <h4 className="text-sm font-bold text-slate-800">{file?.name}</h4>
                  </div>
                  <div className="flex gap-4 text-[10px] font-black text-primary uppercase">
                    {/* PREVIEW BUTTON */}
                    <button onClick={() => setShowPreview(true)} className="flex items-center gap-1 hover:underline">
                      <Eye size={14} /> Preview
                    </button>
                    <button onClick={() => setCurrentStep(1)} className="hover:underline">Reupload</button>
                    <button onClick={() => {setFile(null); setCurrentStep(1)}} className="text-rose-500 hover:underline">Delete</button>
                  </div>
               </div>

               {/* Mapping Section */}
               <div className="bg-white rounded-[24px] border border-border p-6 space-y-4">
                  <h3 className="text-xs font-black text-slate-800 uppercase tracking-[0.15em] mb-4">Column Mapping</h3>
                  {csvHeaders.map((header, idx) => (
                    <div key={idx} className="flex items-center gap-4 p-3.5 bg-slate-50/50 rounded-2xl border border-slate-100">
                       <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                          <FileText size={16} className="text-primary" />
                       </div>
                       <p className="flex-1 text-xs font-bold text-slate-600 truncate">{header}</p>
                       <div className="w-1/2 relative">
                          <select className="w-full bg-white border border-border p-2 rounded-xl text-xs font-bold outline-none focus:border-primary appearance-none">
                             <option>Select Variable</option>
                             <option>First Name</option>
                             <option>Email</option>
                             <option>Company</option>
                          </select>
                          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                       </div>
                    </div>
                  ))}
               </div>
            </div>
          )}
        </div>

        {/* FOOTER */}
        <footer className="bg-white px-8 py-5 border-t border-border flex justify-end gap-3 shrink-0">
           <button 
             onClick={currentStep === 1 ? (file ? () => setCurrentStep(2) : onClose) : () => setCurrentStep(1)} 
             className="px-6 py-2.5 text-xs font-black text-slate-400 uppercase tracking-widest hover:text-slate-600"
           >
             {currentStep === 2 ? 'Back' : 'Cancel'}
           </button>
           <button 
             onClick={currentStep === 1 ? () => setCurrentStep(2) : () => alert('Done')}
             disabled={!file}
             className={`min-w-[160px] px-8 py-2.5 rounded-xl text-xs font-black uppercase tracking-[0.2em] shadow-lg transition-all
               ${!file ? 'bg-slate-100 text-slate-300 cursor-not-allowed' : 'bg-primary text-white hover:bg-purple-700 active:scale-95'}`}
           >
             {currentStep === 1 ? 'Continue' : 'Save & Next'}
           </button>
        </footer>
      </div>

      {/* --- CSV PREVIEW SUB-MODAL --- */}
      {showPreview && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-3xl rounded-[24px] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95">
             <div className="p-5 border-b border-slate-100 flex justify-between items-center">
                <h3 className="text-sm font-black text-slate-700 uppercase tracking-widest">CSV Data Preview (Top 5 Rows)</h3>
                <button onClick={() => setShowPreview(false)} className="p-2 hover:bg-slate-50 rounded-full transition-colors"><X size={20}/></button>
             </div>
             <div className="flex-1 overflow-auto p-4 custom-scrollbar">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-400 uppercase font-black tracking-tighter">
                      {csvHeaders.map(h => <th key={h} className="p-3 border border-slate-100">{h}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {csvData.map((row, i) => (
                      <tr key={i} className="text-slate-600 font-medium">
                        {csvHeaders.map(h => <td key={h} className="p-3 border border-slate-100 truncate max-w-[150px]">{row[h]}</td>)}
                      </tr>
                    ))}
                  </tbody>
                </table>
             </div>
             <div className="p-4 bg-slate-50 text-right">
                <button onClick={() => setShowPreview(false)} className="bg-primary text-white px-6 py-2 rounded-xl text-xs font-bold uppercase shadow-md">Close Preview</button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreateCampaignModal;
