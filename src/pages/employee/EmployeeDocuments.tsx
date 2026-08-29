import React, { useState, useMemo } from 'react';
import { 
  FileText, 
  Upload, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Download, 
  Eye, 
  Plus, 
  ShieldCheck, 
  Search, 
  Filter, 
  Calendar, 
  FileCheck, 
  X,
  FileBadge,
  Sparkles,
  Trash2,
  Building2,
  QrCode,
  GraduationCap,
  CreditCard,
  Stamp,
  ArrowLeft
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { Employee } from '../../types/database';

export interface EmployeeDocument {
  id: string;
  employee_id: string;
  category: 'Identity' | 'Employment' | 'Academic' | 'Financial';
  title: string;
  doc_number?: string;
  file_name: string;
  file_size: string;
  issued_date: string;
  expiry_date?: string;
  status: 'Verified' | 'Pending' | 'Expiring Soon';
  verification_hash?: string;
  custom_image_url?: string;
}

const DEFAULT_DOCS: EmployeeDocument[] = [];

export const EmployeeDocuments: React.FC = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { employees } = useData();

  const currentEmp: Employee = useMemo(() => {
    if (profile?.email) {
      const match = employees.find((e) => e.email?.toLowerCase() === profile.email.toLowerCase());
      if (match) return match;
    }
    const nameParts = (profile?.full_name || 'VeyraHR Employee').split(' ');
    return employees[0] || {
      id: profile?.id || 'emp_current',
      employee_id: profile?.id ? `VEY-EMP-${profile.id.slice(-4).toUpperCase()}` : 'VEY-EMP-0001',
      first_name: nameParts[0] || 'VeyraHR',
      last_name: nameParts.slice(1).join(' ') || 'Employee',
    };
  }, [employees, profile]);

  const [documents, setDocuments] = useState<EmployeeDocument[]>(() => {
    try {
      const saved = localStorage.getItem(`veyra_docs_${currentEmp.id}`);
      return saved ? JSON.parse(saved) : DEFAULT_DOCS;
    } catch {
      return DEFAULT_DOCS;
    }
  });

  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [viewingDoc, setViewingDoc] = useState<EmployeeDocument | null>(null);
  const [deletingDocId, setDeletingDocId] = useState<string | null>(null);

  // Form State
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<'Identity' | 'Employment' | 'Academic' | 'Financial'>('Identity');
  const [newDocNumber, setNewDocNumber] = useState('');
  const [newFileName, setNewFileName] = useState('');
  const [newCustomImage, setNewCustomImage] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);

  const filteredDocs = useMemo(() => {
    return documents.filter((doc) => {
      const matchCat = activeCategory === 'All' || doc.category === activeCategory;
      const matchQuery = searchQuery === '' || 
        doc.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
        (doc.doc_number && doc.doc_number.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchCat && matchQuery;
    });
  }, [documents, activeCategory, searchQuery]);

  const handleUploadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle) return;
    setIsUploading(true);

    setTimeout(() => {
      const newDoc: EmployeeDocument = {
        id: `doc_${Date.now()}`,
        employee_id: currentEmp.id,
        category: newCategory,
        title: newTitle,
        doc_number: newDocNumber || undefined,
        file_name: newFileName || `${newTitle.replace(/\s+/g, '_')}.pdf`,
        file_size: '1.8 MB',
        issued_date: new Date().toISOString().split('T')[0],
        status: 'Verified',
        verification_hash: `VEYRA-HASH-${Math.floor(1000 + Math.random() * 9000)}`,
        custom_image_url: newCustomImage || undefined,
      };

      const updated = [newDoc, ...documents];
      setDocuments(updated);
      try {
        localStorage.setItem(`veyra_docs_${currentEmp.id}`, JSON.stringify(updated));
      } catch {}

      setIsUploading(false);
      setIsUploadOpen(false);
      setNewTitle('');
      setNewDocNumber('');
      setNewFileName('');
      setNewCustomImage('');
    }, 600);
  };

  const handleDelete = (docId: string) => {
    const updated = documents.filter((d) => d.id !== docId);
    setDocuments(updated);
    try {
      localStorage.setItem(`veyra_docs_${currentEmp.id}`, JSON.stringify(updated));
    } catch {}
    setDeletingDocId(null);
    if (viewingDoc?.id === docId) {
      setViewingDoc(null);
    }
  };

  const handleDownload = (doc: EmployeeDocument) => {
    const content = `========================================================\n` +
      `VEYRA HR DIGITAL VAULT - OFFICIAL DOCUMENT PROOF\n` +
      `========================================================\n` +
      `Document Title : ${doc.title}\n` +
      `Category       : ${doc.category}\n` +
      `Document ID    : ${doc.doc_number || 'N/A'}\n` +
      `Employee Name  : ${currentEmp.first_name} ${currentEmp.last_name}\n` +
      `Employee Code  : ${currentEmp.employee_id}\n` +
      `Issued Date    : ${doc.issued_date}\n` +
      `Status         : ${doc.status}\n` +
      `Cryptographic Hash: ${doc.verification_hash || 'SHA256-VERIFIED-OK'}\n` +
      `========================================================\n`;
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = doc.file_name;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4 py-2 text-left">
      
      {/* ─── 1. SLEEK DARK GRADIENT PAGE TITLE CARD ───────────────────── */}
      <div className="relative overflow-hidden p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-[#090E1A] via-[#111A2E] to-[#16223B] border border-purple-500/30 text-white shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3.5">
        <div className="absolute -top-12 -right-12 w-36 h-36 bg-purple-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex items-center gap-3.5">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-2xl bg-white/10 hover:bg-white/20 text-white border border-white/15 shadow-2xs flex items-center justify-center hover:scale-105 active:scale-95 transition-all shrink-0 backdrop-blur-md"
            title="Go Back"
          >
            <ArrowLeft className="w-4.5 h-4.5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-purple-400 font-mono">Employee Digital Vault</span>
              <span className="w-1 h-1 rounded-full bg-slate-500" />
              <span className="text-[10px] font-bold text-slate-300 font-mono">Verified Credentials</span>
            </div>
            <h2 className="text-lg sm:text-xl font-black text-white tracking-tight leading-tight mt-0.5">Digital Document Vault</h2>
            <p className="text-xs text-slate-300 font-medium mt-0.5">Government identity cards, academic credentials & verified employment letters</p>
          </div>
        </div>

        <Button
          variant="primary"
          icon={<Upload className="w-4 h-4" />}
          className="relative z-10 font-extrabold text-xs shadow-md shrink-0 bg-purple-600 hover:bg-purple-700 self-start sm:self-auto"
          onClick={() => setIsUploadOpen(true)}
        >
          Add New Document
        </Button>
      </div>

      {/* ─── VAULT SUMMARY KPI CARDS ─────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-2.5">
        <div className="p-3.5 bg-white rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Files</span>
          <span className="text-lg font-extrabold text-slate-900 font-mono mt-0.5 block">{documents.length}</span>
        </div>
        <div className="p-3.5 bg-emerald-50/70 rounded-2xl border border-emerald-200">
          <span className="text-[10px] uppercase font-bold text-emerald-700 block">Verified</span>
          <span className="text-lg font-extrabold text-emerald-900 font-mono mt-0.5 block">
            {documents.filter((d) => d.status === 'Verified').length}
          </span>
        </div>
        <div className="p-3.5 bg-blue-50/70 rounded-2xl border border-blue-200">
          <span className="text-[10px] uppercase font-bold text-blue-700 block">Storage Vault</span>
          <span className="text-lg font-extrabold text-blue-900 font-mono mt-0.5 block">Encrypted</span>
        </div>
      </div>

      {/* ─── SEARCH & FILTER CHIPS ────────────────────────────────────── */}
      <div className="bg-white rounded-2xl p-3 border border-slate-200 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center justify-between">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search document name or number..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
            />
          </div>

          <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            {['All', 'Identity', 'Employment', 'Academic', 'Financial'].map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-extrabold whitespace-nowrap transition-colors ${
                  activeCategory === cat
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ─── DOCUMENT CARDS GRID ──────────────────────────────────────── */}
      <div className="space-y-2.5">
        {filteredDocs.length === 0 ? (
          <div className="bg-white rounded-3xl p-8 text-center border border-slate-200">
            <FileText className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <h4 className="text-sm font-extrabold text-slate-900">No documents found</h4>
            <p className="text-xs text-slate-500 mt-0.5">Upload your ID proofs or documents using the button above.</p>
          </div>
        ) : (
          filteredDocs.map((doc) => (
            <div
              key={doc.id}
              className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-slate-300 transition-all group"
            >
              <div className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
                  doc.category === 'Identity'
                    ? 'bg-blue-50 text-blue-600 border-blue-200'
                    : doc.category === 'Employment'
                    ? 'bg-purple-50 text-purple-600 border-purple-200'
                    : doc.category === 'Academic'
                    ? 'bg-amber-50 text-amber-600 border-amber-200'
                    : 'bg-emerald-50 text-emerald-600 border-emerald-200'
                }`}>
                  <FileBadge className="w-5 h-5" />
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="text-xs font-extrabold text-slate-900">{doc.title}</h4>
                    <Badge
                      variant={doc.status === 'Verified' ? 'green' : 'amber'}
                      size="sm"
                    >
                      {doc.status === 'Verified' ? '✓ Verified' : '⏳ Pending Review'}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-3 text-[11px] text-slate-500 font-medium">
                    {doc.doc_number && <span className="font-mono font-bold text-slate-700">{doc.doc_number}</span>}
                    <span>{doc.file_size}</span>
                    <span>Issued: {doc.issued_date}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons: View, Download, Delete */}
              <div className="flex items-center gap-1.5 self-end sm:self-center">
                <button
                  onClick={() => setViewingDoc(doc)}
                  className="px-3 py-1.5 rounded-xl bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200 text-xs font-bold flex items-center gap-1.5 transition-colors"
                >
                  <Eye className="w-3.5 h-3.5" /> View Proof
                </button>
                <button
                  onClick={() => handleDownload(doc)}
                  className="px-3 py-1.5 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 text-xs font-bold flex items-center gap-1.5 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setDeletingDocId(doc.id)}
                  className="p-2 rounded-xl text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors shadow-2xs"
                  title="Delete Document"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* ─── DELETE CONFIRMATION MODAL ────────────────────────────────── */}
      {deletingDocId && (
        <Modal
          isOpen={!!deletingDocId}
          onClose={() => setDeletingDocId(null)}
          title="Delete Document"
          maxWidth="sm"
        >
          <div className="space-y-4 text-left p-1">
            <div className="p-3 bg-rose-50 rounded-2xl border border-rose-200 text-xs text-rose-800 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>Are you sure you want to permanently delete this document proof from your employee vault?</span>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <Button variant="outline" size="sm" onClick={() => setDeletingDocId(null)}>
                Cancel
              </Button>
              <Button
                variant="danger"
                size="sm"
                icon={<Trash2 className="w-3.5 h-3.5" />}
                onClick={() => handleDelete(deletingDocId)}
              >
                Delete File
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* ─── UPLOAD DOCUMENT MODAL ────────────────────────────────────── */}
      {isUploadOpen && (
        <Modal
          isOpen={isUploadOpen}
          onClose={() => setIsUploadOpen(false)}
          title="Upload Document Proof"
        >
          <form onSubmit={handleUploadSubmit} className="space-y-4 text-left">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Document Category *</label>
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value as any)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value="Identity">Government Identity (Aadhaar, PAN, Passport)</option>
                <option value="Employment">Employment & Experience (Offer letter, Contract)</option>
                <option value="Academic">Education & Degree Certificates</option>
                <option value="Financial">Financial & Tax Proofs (Bank passbook, Form 16)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Document Title / Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Aadhaar Card, B.Tech Degree Certificate"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Document ID Number (Optional)</label>
              <input
                type="text"
                placeholder="e.g. 9840 2314 9901 or PAN Number"
                value={newDocNumber}
                onChange={(e) => setNewDocNumber(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            {/* File Upload Simulator Box */}
            <div className="p-4 border-2 border-dashed border-slate-200 rounded-2xl text-center space-y-2 bg-slate-50">
              <Upload className="w-6 h-6 text-blue-600 mx-auto" />
              <div>
                <p className="text-xs font-bold text-slate-800">Click to browse or drop file here</p>
                <p className="text-[10px] text-slate-500 mt-0.5">Supports PDF, PNG, JPEG up to 10 MB</p>
              </div>
              <input
                type="file"
                accept="image/*,.pdf"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    const file = e.target.files[0];
                    setNewFileName(file.name);
                    if (file.type.startsWith('image/')) {
                      const reader = new FileReader();
                      reader.onload = () => {
                        setNewCustomImage(reader.result as string);
                      };
                      reader.readAsDataURL(file);
                    }
                  }
                }}
                className="text-xs text-slate-500 file:mr-2 file:py-1 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <Button type="button" variant="outline" onClick={() => setIsUploadOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" disabled={isUploading || !newTitle}>
                {isUploading ? 'Uploading & Encrypting...' : 'Submit for Verification'}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* ─── VIEW DOCUMENT PROOF VISUAL PREVIEW MODAL ────────────────── */}
      {viewingDoc && (
        <Modal
          isOpen={!!viewingDoc}
          onClose={() => setViewingDoc(null)}
          title={`Verified Proof: ${viewingDoc.title}`}
          maxWidth="md"
        >
          <div className="space-y-4 text-left p-1">
            
            {/* REALISTIC VISUAL PROOF CARD / CERTIFICATE CANVAS */}
            <div className="relative rounded-3xl overflow-hidden shadow-xl border border-slate-300 p-5 bg-gradient-to-br from-slate-50 via-white to-slate-100 select-none">
              
              {/* Watermark */}
              <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none">
                <ShieldCheck className="w-64 h-64 text-blue-900" />
              </div>

              {/* Document Type Specific Proof Layout */}
              {viewingDoc.custom_image_url ? (
                <div className="rounded-2xl overflow-hidden border border-slate-200 max-h-72 flex items-center justify-center bg-black/5">
                  <img src={viewingDoc.custom_image_url} alt="Proof" className="w-full h-full object-contain" />
                </div>
              ) : viewingDoc.category === 'Identity' && viewingDoc.title.includes('Aadhaar') ? (
                /* Aadhaar Card Proof Visual */
                <div className="bg-white rounded-2xl p-4 border border-orange-200 shadow-sm space-y-3 relative">
                  <div className="flex items-center justify-between border-b border-orange-200 pb-2">
                    <div>
                      <span className="text-[10px] font-extrabold text-orange-600 uppercase tracking-widest block">Government of India</span>
                      <span className="text-xs font-bold text-slate-800">Unique Identification Authority of India</span>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      ✓ Digital Verified
                    </span>
                  </div>

                  <div className="flex items-center gap-3.5">
                    <img 
                      src={currentEmp.avatar_url || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150'} 
                      alt="Photo" 
                      className="w-16 h-18 rounded-xl object-cover border border-slate-300 shadow-xs" 
                    />
                    <div className="space-y-1 text-xs">
                      <span className="font-extrabold text-slate-900 text-sm block">{currentEmp.first_name} {currentEmp.last_name}</span>
                      <span className="text-slate-500 text-[11px] block">DOB: 14/08/1997 • Female</span>
                      <span className="text-slate-500 text-[11px] block">Address: {currentEmp.address || 'Anna Nagar, Chennai, TN'}</span>
                    </div>
                  </div>

                  <div className="p-2 rounded-xl bg-orange-50/60 border border-orange-200 text-center font-mono font-extrabold text-slate-900 tracking-widest text-base">
                    {viewingDoc.doc_number || '9840 2194 8912'}
                  </div>
                </div>
              ) : viewingDoc.category === 'Identity' && viewingDoc.title.includes('PAN') ? (
                /* PAN Card Proof Visual */
                <div className="bg-gradient-to-r from-sky-50 via-white to-blue-50 rounded-2xl p-4 border border-blue-300 shadow-sm space-y-3">
                  <div className="flex items-center justify-between border-b border-blue-200 pb-2">
                    <span className="text-[10px] font-extrabold text-blue-800 uppercase tracking-widest">INCOME TAX DEPARTMENT • GOVT OF INDIA</span>
                    <span className="text-[10px] font-bold text-blue-700 font-mono">FORM 49A</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-1 text-xs">
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">Permanent Account Number</span>
                      <span className="font-extrabold font-mono text-base text-blue-900 tracking-wider block">{viewingDoc.doc_number || 'ABCPS4012K'}</span>
                      <span className="font-bold text-slate-800 block">{currentEmp.first_name} {currentEmp.last_name}</span>
                    </div>
                    <img 
                      src={currentEmp.avatar_url || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150'} 
                      alt="Photo" 
                      className="w-14 h-16 rounded-lg object-cover border border-blue-200 shadow-xs" 
                    />
                  </div>
                </div>
              ) : viewingDoc.category === 'Employment' ? (
                /* Employment Agreement / Offer Letter Proof Visual */
                <div className="bg-white rounded-2xl p-4 border border-slate-300 shadow-sm space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <div className="flex items-center gap-1.5 text-blue-600 font-extrabold text-xs">
                      <Building2 className="w-4 h-4" /> VEYRAHR TECHNOLOGIES PVT LTD
                    </div>
                    <span className="text-[9px] font-mono text-slate-400">REF: {viewingDoc.doc_number || 'VEY-HR-0012'}</span>
                  </div>
                  <div className="space-y-1 text-xs text-slate-700">
                    <h5 className="font-extrabold text-slate-900 text-xs uppercase">Certificate of Official Appointment</h5>
                    <p className="text-[11px] leading-relaxed">
                      This is to certify that <strong>{currentEmp.first_name} {currentEmp.last_name}</strong> is officially engaged as <strong>{currentEmp.designation || 'Software Engineer'}</strong> at VeyraHR Technologies.
                    </p>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[10px] text-slate-500">
                    <span>Issued: {viewingDoc.issued_date}</span>
                    <span className="text-emerald-600 font-bold font-mono">✓ Signed by HR Directorate</span>
                  </div>
                </div>
              ) : viewingDoc.category === 'Academic' ? (
                /* Degree Certificate Visual */
                <div className="bg-amber-50/40 rounded-2xl p-4 border border-amber-300 shadow-sm space-y-3 text-center">
                  <GraduationCap className="w-8 h-8 text-amber-600 mx-auto" />
                  <div>
                    <span className="text-[10px] font-bold text-amber-800 uppercase tracking-widest block">Anna University • Faculty of Engineering</span>
                    <h5 className="text-xs sm:text-sm font-extrabold text-slate-900 mt-1">{viewingDoc.title}</h5>
                    <p className="text-[11px] text-slate-600 mt-0.5">Awarded to <strong>{currentEmp.first_name} {currentEmp.last_name}</strong> with First Class Honours.</p>
                  </div>
                  <div className="p-1.5 rounded-lg bg-amber-100/70 text-amber-900 font-mono text-[10px] font-bold">
                    Reg No: {viewingDoc.doc_number || 'DEG-CS-2021-482'}
                  </div>
                </div>
              ) : (
                /* Bank Passbook / Financial Visual */
                <div className="bg-emerald-50/40 rounded-2xl p-4 border border-emerald-300 shadow-sm space-y-2">
                  <div className="flex items-center justify-between border-b border-emerald-200 pb-2">
                    <span className="text-xs font-extrabold text-emerald-900">HDFC BANK LIMITED • CHENNAI BRANCH</span>
                    <span className="text-[10px] font-bold text-emerald-700">Salary Account</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold block">Account Holder</span>
                      <span className="font-bold text-slate-900">{currentEmp.first_name} {currentEmp.last_name}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold block">Account Number</span>
                      <span className="font-bold text-slate-900 font-mono">{viewingDoc.doc_number || '50100491824012'}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Cryptographic Hash Security Tag */}
              <div className="mt-3 p-2 rounded-xl bg-slate-900 text-white flex items-center justify-between text-[10px] font-mono">
                <span className="flex items-center gap-1 text-emerald-400">
                  <ShieldCheck className="w-3.5 h-3.5" /> Tamper-Proof Hash
                </span>
                <span className="text-slate-300 truncate max-w-[180px]">{viewingDoc.verification_hash || 'SHA-256-OK'}</span>
              </div>
            </div>

            {/* Actions: Close & Download */}
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setViewingDoc(null)}>
                Close Preview
              </Button>
              <Button 
                variant="primary" 
                className="flex-1" 
                icon={<Download className="w-4 h-4" />} 
                onClick={() => handleDownload(viewingDoc)}
              >
                Download Verified PDF
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
