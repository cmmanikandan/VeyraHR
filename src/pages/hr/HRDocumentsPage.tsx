import React, { useState, useMemo } from 'react';
import { 
  FileText, 
  FolderOpen, 
  Search, 
  Plus, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Download, 
  Eye, 
  Trash2, 
  ShieldCheck, 
  Users, 
  Building2, 
  Briefcase, 
  FileCheck, 
  FileX, 
  ChevronRight, 
  ArrowLeft,
  Calendar,
  Lock,
  ExternalLink
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Avatar } from '../../components/ui/Avatar';
import { EmptyState } from '../../components/common/EmptyState';
import { useData } from '../../context/DataContext';
import { Employee } from '../../types/database';

export interface EmployeeDocRecord {
  id: string;
  employee_id: string;
  category: 'Identity' | 'Employment' | 'Academic' | 'Financial' | 'Medical';
  title: string;
  doc_number?: string;
  file_name: string;
  file_size: string;
  issued_date: string;
  expiry_date?: string;
  status: 'Verified' | 'Pending' | 'Expiring Soon' | 'Rejected';
  verification_hash?: string;
}

const DEFAULT_DOC_TEMPLATES: Record<string, EmployeeDocRecord[]> = {
  // If an employee doesn't have custom docs, standard template items can be loaded
};

export const HRDocumentsPage: React.FC = () => {
  const { employees, branches } = useData();

  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedBranch, setSelectedBranch] = useState<string>('All');

  // Preview & Upload Modals
  const [viewingDoc, setViewingDoc] = useState<EmployeeDocRecord | null>(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  // Form State
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<EmployeeDocRecord['category']>('Identity');
  const [newDocNumber, setNewDocNumber] = useState('');
  const [newFileName, setNewFileName] = useState('');

  // Storage for all employees documents
  const [docsMap, setDocsMap] = useState<Record<string, EmployeeDocRecord[]>>(() => {
    const saved = localStorage.getItem('veyra_hr_employee_docs');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {}
    }
    return {};
  });

  const getEmployeeDocs = (empId: string): EmployeeDocRecord[] => {
    if (docsMap[empId]) return docsMap[empId];
    // Check if employee has custom localstorage docs
    const savedEmpDocs = localStorage.getItem(`veyra_docs_${empId}`);
    if (savedEmpDocs) {
      try {
        const parsed = JSON.parse(savedEmpDocs);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch {}
    }
    return [
      {
        id: `doc_id_${empId}_1`,
        employee_id: empId,
        category: 'Identity',
        title: 'Aadhaar Card (National ID)',
        doc_number: '•••• •••• 9842',
        file_name: 'Aadhaar_National_ID.pdf',
        file_size: '1.4 MB',
        issued_date: '2022-04-10',
        status: 'Verified',
        verification_hash: 'UIDAI-VERIFIED-7812',
      },
      {
        id: `doc_id_${empId}_2`,
        employee_id: empId,
        category: 'Identity',
        title: 'Permanent Account Number (PAN)',
        doc_number: 'ABCPS••••K',
        file_name: 'PAN_Card_Signed.pdf',
        file_size: '820 KB',
        issued_date: '2021-08-15',
        status: 'Verified',
        verification_hash: 'ITD-PAN-VERIFIED',
      },
      {
        id: `doc_id_${empId}_3`,
        employee_id: empId,
        category: 'Employment',
        title: 'Appointment Offer Letter',
        doc_number: 'VEY-ENG-2024-001',
        file_name: 'VeyraHR_Appointment_Offer.pdf',
        file_size: '2.4 MB',
        issued_date: '2024-03-01',
        status: 'Verified',
        verification_hash: 'DS-SIGN-OFFICIAL',
      },
    ];
  };

  const handleUpdateDocStatus = (docId: string, status: 'Verified' | 'Rejected') => {
    if (!selectedEmployee) return;
    const currentList = getEmployeeDocs(selectedEmployee.id);
    const updated = currentList.map((d) => (d.id === docId ? { ...d, status } : d));
    const nextMap = { ...docsMap, [selectedEmployee.id]: updated };
    setDocsMap(nextMap);
    localStorage.setItem('veyra_hr_employee_docs', JSON.stringify(nextMap));
    localStorage.setItem(`veyra_docs_${selectedEmployee.id}`, JSON.stringify(updated));
    if (viewingDoc && viewingDoc.id === docId) {
      setViewingDoc({ ...viewingDoc, status });
    }
  };

  const handleUploadDoc = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmployee || !newTitle) return;

    const newDoc: EmployeeDocRecord = {
      id: `doc_${Date.now()}`,
      employee_id: selectedEmployee.id,
      category: newCategory,
      title: newTitle,
      doc_number: newDocNumber || undefined,
      file_name: newFileName || `${newTitle.replace(/\s+/g, '_')}.pdf`,
      file_size: `${(Math.random() * 2 + 0.5).toFixed(1)} MB`,
      issued_date: new Date().toISOString().split('T')[0],
      status: 'Verified',
      verification_hash: `HR-UPLOAD-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
    };

    const currentList = getEmployeeDocs(selectedEmployee.id);
    const updated = [newDoc, ...currentList];
    const nextMap = { ...docsMap, [selectedEmployee.id]: updated };
    setDocsMap(nextMap);
    localStorage.setItem('veyra_hr_employee_docs', JSON.stringify(nextMap));
    localStorage.setItem(`veyra_docs_${selectedEmployee.id}`, JSON.stringify(updated));

    setIsUploadModalOpen(false);
    setNewTitle('');
    setNewDocNumber('');
    setNewFileName('');
  };

  const filteredEmployees = useMemo(() => {
    return employees.filter((emp) => {
      const matchSearch =
        `${emp.first_name} ${emp.last_name}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
        emp.employee_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        emp.department_name?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchBranch = selectedBranch === 'All' || emp.branch_name === selectedBranch;
      return matchSearch && matchBranch;
    });
  }, [employees, searchQuery, selectedBranch]);

  const activeEmployeeDocs = useMemo(() => {
    if (!selectedEmployee) return [];
    const list = getEmployeeDocs(selectedEmployee.id);
    if (selectedCategory === 'All') return list;
    return list.filter((d) => d.category === selectedCategory);
  }, [selectedEmployee, docsMap, selectedCategory]);

  return (
    <div className="space-y-6 text-left max-w-7xl mx-auto">
      {/* ─── HEADER ────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            {selectedEmployee && (
              <button
                onClick={() => setSelectedEmployee(null)}
                className="p-1.5 hover:bg-slate-100 rounded-xl transition-colors text-slate-600 mr-1"
                title="Back to Employee List"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              {selectedEmployee ? `${selectedEmployee.first_name} ${selectedEmployee.last_name}'s Dossier` : 'Employee Document Repository'}
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
            {selectedEmployee
              ? `Compliance, ID verification, credentials & offer letters for ${selectedEmployee.employee_id}`
              : 'Enterprise KYC, statutory compliance, signed contracts, and verified academic credentials.'}
          </p>
        </div>

        {selectedEmployee && (
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsUploadModalOpen(true)}
            icon={<Plus className="w-4 h-4" />}
            className="font-bold shadow-xs"
          >
            Upload Document for Employee
          </Button>
        )}
      </div>

      {/* ─── VIEW 1: EMPLOYEE SELECTION LIST ───────────────────────── */}
      {!selectedEmployee ? (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-[#E8E2D9] shadow-2xs">
            <div className="relative flex-1 w-full max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search staff by name, code or department..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-veyra-blue"
              />
            </div>

            <select
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              className="w-full sm:w-auto px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none"
            >
              <option value="All">All Branches</option>
              {branches.map((b) => (
                <option key={b.id} value={b.name}>{b.name}</option>
              ))}
            </select>
          </div>

          {/* Employees List Grid */}
          {filteredEmployees.length === 0 ? (
            <Card className="text-center py-12 bg-white border-[#E8E2D9]">
              <EmptyState
                icon={<Users className="w-10 h-10" />}
                title="No Staff Accounts Found"
                description="Once employees are registered in the directory, their compliance dossiers will appear here."
              />
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredEmployees.map((emp) => {
                const docs = getEmployeeDocs(emp.id);
                const verifiedCount = docs.filter((d) => d.status === 'Verified').length;

                return (
                  <Card
                    key={emp.id}
                    padded={false}
                    className="p-5 bg-white border-[#E8E2D9] rounded-2xl shadow-2xs hover:border-veyra-blue/50 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
                    onClick={() => setSelectedEmployee(emp)}
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Avatar name={`${emp.first_name} ${emp.last_name}`} src={emp.avatar_url} size="md" />
                          <div>
                            <h3 className="text-sm font-extrabold text-slate-900 group-hover:text-veyra-blue transition-colors">
                              {emp.first_name} {emp.last_name}
                            </h3>
                            <span className="text-[11px] font-mono text-slate-500">{emp.employee_id}</span>
                          </div>
                        </div>
                        <Badge variant={verifiedCount === docs.length ? 'green' : 'blue'} size="sm">
                          {verifiedCount}/{docs.length} Verified
                        </Badge>
                      </div>

                      <div className="text-xs text-slate-600 space-y-1 pt-2 border-t border-slate-100">
                        <p className="flex items-center gap-1.5">
                          <Briefcase className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">{emp.designation || 'Staff Member'}</span>
                        </p>
                        <p className="flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">{emp.branch_name || 'Chennai HQ'}</span>
                        </p>
                      </div>
                    </div>

                    <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-veyra-blue">
                      <span>Open Document Vault</span>
                      <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* ─── VIEW 2: SELECTED EMPLOYEE DOCUMENT DOSSIER ───────────── */
        <div className="space-y-5">
          {/* Employee Snapshot Bar */}
          <div className="bg-white p-5 rounded-2xl border border-[#E8E2D9] shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Avatar name={`${selectedEmployee.first_name} ${selectedEmployee.last_name}`} src={selectedEmployee.avatar_url} size="lg" />
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-black text-slate-900">
                    {selectedEmployee.first_name} {selectedEmployee.last_name}
                  </h2>
                  <Badge variant="blue">{selectedEmployee.employee_id}</Badge>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  {selectedEmployee.designation} • {selectedEmployee.department_name} • {selectedEmployee.branch_name}
                </p>
              </div>
            </div>

            {/* Category Filter Pills */}
            <div className="flex flex-wrap gap-1.5">
              {['All', 'Identity', 'Employment', 'Academic', 'Financial', 'Medical'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                    selectedCategory === cat
                      ? 'bg-veyra-blue text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Documents Grid */}
          {activeEmployeeDocs.length === 0 ? (
            <Card className="text-center py-12 bg-white border-[#E8E2D9]">
              <p className="text-xs text-slate-500">No documents found in category "{selectedCategory}".</p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {activeEmployeeDocs.map((doc) => (
                <Card
                  key={doc.id}
                  padded={false}
                  className="p-5 bg-white border-[#E8E2D9] rounded-2xl shadow-2xs hover:border-veyra-blue/40 transition-all flex flex-col justify-between space-y-3"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-veyra-blue shrink-0">
                        <FileText className="w-5 h-5" />
                      </div>
                      <Badge
                        variant={
                          doc.status === 'Verified' ? 'green' : doc.status === 'Rejected' ? 'red' : 'amber'
                        }
                        size="sm"
                      >
                        {doc.status}
                      </Badge>
                    </div>

                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 font-mono tracking-wider">{doc.category}</span>
                      <h4 className="text-sm font-extrabold text-slate-900 leading-snug">{doc.title}</h4>
                      {doc.doc_number && (
                        <p className="text-xs font-mono text-slate-500 mt-0.5">ID: {doc.doc_number}</p>
                      )}
                    </div>

                    <div className="p-2.5 bg-slate-50 rounded-xl text-[11px] text-slate-500 font-mono space-y-1">
                      <div className="flex justify-between">
                        <span>File:</span>
                        <span className="font-bold text-slate-700 truncate max-w-[150px]">{doc.file_name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Size:</span>
                        <span>{doc.file_size}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setViewingDoc(doc)}
                      icon={<Eye className="w-3.5 h-3.5" />}
                      className="text-xs font-bold flex-1"
                    >
                      Inspect
                    </Button>

                    {doc.status !== 'Verified' ? (
                      <Button
                        variant="success"
                        size="sm"
                        onClick={() => handleUpdateDocStatus(doc.id, 'Verified')}
                        icon={<FileCheck className="w-3.5 h-3.5" />}
                        className="text-xs font-bold"
                      >
                        Verify
                      </Button>
                    ) : (
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => handleUpdateDocStatus(doc.id, 'Rejected')}
                        icon={<FileX className="w-3.5 h-3.5" />}
                        className="text-xs font-bold"
                      >
                        Revoke
                      </Button>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ─── MODAL: INSPECT DOCUMENT PREVIEW ─────────────────────────── */}
      <Modal isOpen={!!viewingDoc} onClose={() => setViewingDoc(null)} title={viewingDoc?.title || 'Document Dossier'}>
        {viewingDoc && (
          <div className="space-y-4 text-left">
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500">Document Type</span>
                <Badge variant="blue">{viewingDoc.category}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500">Verification Status</span>
                <Badge variant={viewingDoc.status === 'Verified' ? 'green' : 'amber'}>{viewingDoc.status}</Badge>
              </div>
              <div className="flex items-center justify-between font-mono text-xs">
                <span className="text-slate-500">Security Hash</span>
                <span className="font-bold text-slate-800">{viewingDoc.verification_hash || 'SHA256-CERTIFIED'}</span>
              </div>
            </div>

            {/* Document Digital Frame Mock */}
            <div className="w-full h-48 bg-slate-900 rounded-2xl border border-slate-800 flex flex-col items-center justify-center text-white p-6 text-center space-y-2">
              <ShieldCheck className="w-10 h-10 text-emerald-400" />
              <p className="text-sm font-bold">{viewingDoc.file_name}</p>
              <span className="text-xs text-slate-400 font-mono">Encrypted Enterprise Document • Verified by VeyraHR Security</span>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setViewingDoc(null)}>
                Close
              </Button>
              {viewingDoc.status !== 'Verified' && (
                <Button
                  variant="primary"
                  onClick={() => handleUpdateDocStatus(viewingDoc.id, 'Verified')}
                  className="font-bold"
                >
                  Confirm & Mark Verified
                </Button>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* ─── MODAL: UPLOAD NEW DOCUMENT ──────────────────────────────── */}
      <Modal isOpen={isUploadModalOpen} onClose={() => setIsUploadModalOpen(false)} title="Upload Document for Staff">
        <form onSubmit={handleUploadDoc} className="space-y-4 text-left">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Document Title *</label>
            <input
              type="text"
              placeholder="e.g. Relieving Letter & Service Certificate"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-veyra-blue"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Category</label>
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value as any)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-bold"
              >
                <option value="Identity">Identity (Aadhaar/PAN/Passport)</option>
                <option value="Employment">Employment (Offer/Appraisal)</option>
                <option value="Academic">Academic (Degree/Certificates)</option>
                <option value="Financial">Financial (Bank/Cheque/Tax)</option>
                <option value="Medical">Medical (Health Checkup)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Document / ID Number</label>
              <input
                type="text"
                placeholder="e.g. VEY-DOC-9821"
                value={newDocNumber}
                onChange={(e) => setNewDocNumber(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-veyra-blue"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">File Name</label>
            <input
              type="text"
              placeholder="e.g. Signed_Service_Letter.pdf"
              value={newFileName}
              onChange={(e) => setNewFileName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-veyra-blue"
            />
          </div>

          <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={() => setIsUploadModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" className="font-bold shadow-xs">
              Save to Dossier
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
