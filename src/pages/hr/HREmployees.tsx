import React, { useState, useRef } from 'react';
import { 
  Search, 
  Plus, 
  Filter, 
  IdCard, 
  MoreHorizontal, 
  Mail, 
  Phone, 
  Users, 
  UserPlus, 
  Edit3, 
  Trash2, 
  Upload, 
  Download, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  FileSpreadsheet,
  Lock,
  KeyRound,
  Copy,
  Check,
  Eye,
  EyeOff,
  RefreshCw,
  Building,
  MapPin,
  Calendar,
  ShieldCheck,
  UploadCloud
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Avatar } from '../../components/ui/Avatar';
import { Modal } from '../../components/ui/Modal';
import { EmptyState } from '../../components/common/EmptyState';
import { useData } from '../../context/DataContext';
import { CreateEmployeeWizard } from '../../components/hr/CreateEmployeeWizard';
import { DigitalIDCardModal } from '../../components/employee/DigitalIDCardModal';
import { Employee } from '../../types/database';
import { uploadToCloudinary } from '../../lib/cloudinary';

// ─── CSV Row Type ────────────────────────────────────────────────────────────
interface CSVRow {
  first_name: string;
  last_name: string;
  email: string;
  designation: string;
  department_name: string;
  phone: string;
  work_location: string;
  joining_date: string;
  status: string;
  errors: string[];
}

const CSV_HEADERS = [
  'first_name', 'last_name', 'email', 'designation',
  'department_name', 'phone', 'work_location', 'joining_date', 'status',
];

const SAMPLE_CSV = [
  CSV_HEADERS.join(','),
  'Anjali,Sharma,anjali.sharma@veyrahr.com,Software Engineer,Engineering & Tech,9876543210,Chennai HQ,2024-03-01,Active',
  'Ravi,Kumar,ravi.kumar@veyrahr.com,HR Executive,Human Resources,9123456789,Coimbatore Branch,2024-05-15,Active',
  'Priya,Nair,priya.nair@veyrahr.com,Sales Manager,Sales & Marketing,9988776655,Madurai Regional Hub,2023-11-20,Active',
].join('\n');

function parseCSV(text: string): CSVRow[] {
  const lines = text.trim().split('\n').filter(Boolean);
  if (lines.length < 2) return [];
  const header = lines[0].split(',').map((h) => h.trim().toLowerCase().replace(/ /g, '_'));
  return lines.slice(1).map((line) => {
    const values = line.split(',').map((v) => v.trim());
    const row: Record<string, string> = {};
    header.forEach((h, i) => { row[h] = values[i] || ''; });
    const errors: string[] = [];
    if (!row.first_name) errors.push('First name required');
    if (!row.last_name) errors.push('Last name required');
    if (!row.email || !row.email.includes('@')) errors.push('Valid email required');
    if (!row.designation) errors.push('Designation required');
    if (!row.department_name) errors.push('Department required');
    return { ...row, errors } as CSVRow;
  });
}

export const HREmployees: React.FC = () => {
  const { employees, departments, branches, addEmployee, updateEmployee, deleteEmployee, refreshData } = useData();
  const [query, setQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshData();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const [isWizardOpen, setIsWizardOpen] = useState(false);

  // ── Import state ──────────────────────────────────────────────────────────
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [csvRows, setCsvRows] = useState<CSVRow[]>([]);
  const [importing, setImporting] = useState(false);
  const [importDone, setImportDone] = useState(false);
  const [importError, setImportError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.endsWith('.csv')) {
      setImportError('Please upload a .csv file.');
      return;
    }
    setImportError('');
    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      const rows = parseCSV(text);
      if (rows.length === 0) {
        setImportError('No valid rows found. Ensure the file matches the required format.');
      } else {
        setCsvRows(rows);
      }
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    const fakeEvent = { target: { files: [file] } } as any;
    handleFileChange(fakeEvent);
  };

  const handleImport = async () => {
    const validRows = csvRows.filter((r) => r.errors.length === 0);
    if (validRows.length === 0) return;
    setImporting(true);
    for (const row of validRows) {
      await addEmployee({
        company_id: 'comp_veyra_tn',
        first_name: row.first_name,
        last_name: row.last_name,
        email: row.email,
        designation: row.designation,
        department_name: row.department_name,
        phone: row.phone,
        work_location: row.work_location || 'Chennai HQ',
        joining_date: row.joining_date || new Date().toISOString().split('T')[0],
        status: (row.status || 'Active') as Employee['status'],
        password: 'Veyra@2026',
      });
    }
    setImporting(false);
    setImportDone(true);
    setTimeout(() => {
      setImportDone(false);
      setIsImportOpen(false);
      setCsvRows([]);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }, 1500);
  };

  const downloadSampleCSV = () => {
    const blob = new Blob([SAMPLE_CSV], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'veyra_employee_import_template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const validCount = csvRows.filter((r) => r.errors.length === 0).length;
  const errorCount = csvRows.filter((r) => r.errors.length > 0).length;
  const [selectedEmpForCard, setSelectedEmpForCard] = useState<Employee | null>(null);

  // Edit Employee State
  const [editingEmp, setEditingEmp] = useState<Employee | null>(null);
  const [editFirstName, setEditFirstName] = useState('');
  const [editLastName, setEditLastName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editDesignation, setEditDesignation] = useState('');
  const [editDept, setEditDept] = useState('');
  const [editBranch, setEditBranch] = useState('');
  const [editJoiningDate, setEditJoiningDate] = useState('');
  const [editWorkLocation, setEditWorkLocation] = useState('');
  const [editEmergencyContact, setEditEmergencyContact] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editAvatarUrl, setEditAvatarUrl] = useState('');
  const [editStatus, setEditStatus] = useState<'Active' | 'On Leave' | 'Inactive'>('Active');
  
  // Password Reset / Change State
  const [editPassword, setEditPassword] = useState('');
  const [showEditPassword, setShowEditPassword] = useState(false);
  const [passwordCopied, setPasswordCopied] = useState(false);
  const [passwordNotice, setPasswordNotice] = useState<string | null>(null);
  const [uploadingEditPhoto, setUploadingEditPhoto] = useState(false);
  const editPhotoInputRef = useRef<HTMLInputElement>(null);

  const openEditModal = (emp: Employee) => {
    setEditingEmp(emp);
    setEditFirstName(emp.first_name || '');
    setEditLastName(emp.last_name || '');
    setEditEmail(emp.email || '');
    setEditPhone(emp.phone || '');
    setEditDesignation(emp.designation || '');
    setEditDept(emp.department_name || (departments[0]?.name || 'Human Resources'));
    setEditBranch(emp.branch_name || (branches[0]?.name || 'Chennai HQ'));
    setEditJoiningDate(emp.joining_date || new Date().toISOString().split('T')[0]);
    setEditWorkLocation(emp.work_location || 'Chennai HQ, Tamil Nadu');
    setEditEmergencyContact(emp.emergency_contact || '');
    setEditAddress(emp.address || '');
    setEditAvatarUrl(emp.avatar_url || '');
    setEditStatus((emp.status as any) || 'Active');
    setEditPassword('');
    setShowEditPassword(false);
    setPasswordCopied(false);
    setPasswordNotice(null);
  };

  const generateEditPassword = () => {
    const randomDigits = Math.floor(1000 + Math.random() * 9000);
    const newPwd = `Veyra#${randomDigits}`;
    setEditPassword(newPwd);
  };

  const copyOnlyPassword = (pwd: string) => {
    if (!pwd) return;
    navigator.clipboard.writeText(pwd);
    setPasswordCopied(true);
    setTimeout(() => setPasswordCopied(false), 2000);
  };

  const handleEditPhotoUpload = async (file: File) => {
    setUploadingEditPhoto(true);
    try {
      const cdnUrl = await uploadToCloudinary(file, 'employee_photos');
      setEditAvatarUrl(cdnUrl);
    } catch (err) {
      console.warn('Photo upload fallback:', err);
    } finally {
      setUploadingEditPhoto(false);
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEmp) return;
    await updateEmployee(editingEmp.id, {
      first_name: editFirstName,
      last_name: editLastName,
      email: editEmail,
      phone: editPhone,
      designation: editDesignation,
      department_name: editDept,
      branch_name: editBranch,
      joining_date: editJoiningDate,
      work_location: editWorkLocation,
      emergency_contact: editEmergencyContact,
      address: editAddress,
      avatar_url: editAvatarUrl,
      status: editStatus,
    });
    setEditingEmp(null);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to remove this employee from your directory?')) {
      await deleteEmployee(id);
    }
  };

  const filteredEmployees = employees.filter((e) => {
    const fullName = `${e.first_name || ''} ${e.last_name || ''}`.trim();
    const empId = e.employee_id || '';
    const empEmail = e.email || '';
    const empDesignation = e.designation || '';
    const empBranch = e.branch_name || e.work_location || '';
    const empDept = e.department_name || '';
    const empPhone = e.phone || '';

    const searchTarget = `${fullName} ${empId} ${empEmail} ${empDesignation} ${empBranch} ${empDept} ${empPhone}`.toLowerCase();
    const matchesQuery = !query.trim() || searchTarget.includes(query.trim().toLowerCase());

    const matchesDept =
      selectedDept === 'ALL' ||
      (empDept && empDept.toLowerCase().trim() === selectedDept.toLowerCase().trim());

    const matchesStatus =
      selectedStatus === 'ALL' ||
      (e.status && e.status.toLowerCase().trim() === selectedStatus.toLowerCase().trim());

    return matchesQuery && matchesDept && matchesStatus;
  });

  return (
    <div className="space-y-6 text-left">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-2xl font-extrabold text-veyra-text tracking-tight">Employee Directory</h2>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-veyra-blue border border-blue-200">
              {employees.length} Total
            </span>
          </div>
          <p className="text-xs sm:text-sm text-veyra-text-sub font-medium mt-0.5">
            Manage workforce profiles, departments & digital QR credentials.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            loading={isRefreshing}
            onClick={handleRefresh}
            icon={<RefreshCw className="w-3.5 h-3.5 text-veyra-blue" />}
            title="Refresh employees from database"
          >
            Sync
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => { setCsvRows([]); setImportError(''); setIsImportOpen(true); }}
            icon={<Upload className="w-4 h-4" />}
          >
            Import CSV
          </Button>
          <Button
            variant="primary"
            onClick={() => setIsWizardOpen(true)}
            icon={<Plus className="w-4 h-4" />}
            className="font-bold shadow-xs"
          >
            Add Employee
          </Button>
        </div>
      </div>

      {/* SEARCH & FILTER CONTROLS */}
      {employees.length > 0 && (
        <Card padded={false} className="p-4 bg-white border-veyra-border flex flex-col md:flex-row items-center justify-between gap-3 shadow-xs">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-veyra-blue" />
            <input
              type="text"
              placeholder="Search by name, ID, designation, location..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full pl-10 pr-8 py-2.5 bg-veyra-bg-secondary rounded-xl text-xs font-medium text-veyra-text placeholder:text-veyra-text-muted focus:outline-none focus:ring-2 focus:ring-veyra-blue/20 border border-veyra-border/60"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="rounded-xl border border-veyra-border bg-white px-3 py-2 text-xs text-veyra-text font-medium"
            >
              <option value="ALL">All Departments</option>
              {departments.map((d) => (
                <option key={d.id} value={d.name}>
                  {d.name}
                </option>
              ))}
            </select>

            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="rounded-xl border border-veyra-border bg-white px-3 py-2 text-xs text-veyra-text font-medium"
            >
              <option value="ALL">All Statuses</option>
              <option value="Active">Active</option>
              <option value="On Leave">On Leave</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
        </Card>
      )}

      {/* EMPTY STATE OR DIRECTORY LIST */}
      {employees.length === 0 ? (
        <EmptyState
          icon={<Users className="w-8 h-8" />}
          title="No Employees Yet"
          description="No employees have been added to your organization database. Click below to add your first employee using the 5-step onboarding wizard."
          actionLabel="Add First Employee"
          onAction={() => setIsWizardOpen(true)}
          actionIcon={<UserPlus className="w-4 h-4" />}
        />
      ) : filteredEmployees.length === 0 ? (
        <div className="bg-white rounded-2xl border border-veyra-border p-12 text-center shadow-xs">
          <div className="w-12 h-12 rounded-2xl bg-veyra-blue-soft text-veyra-blue flex items-center justify-center mx-auto mb-3 border border-veyra-blue-border/60">
            <Users className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-veyra-text">No Matching Employees</h3>
          <p className="text-xs text-veyra-text-sub mt-1 max-w-sm mx-auto">
            No employee records match your search query or filters.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => { setQuery(''); setSelectedDept('ALL'); setSelectedStatus('ALL'); }}
            className="mt-4 text-xs font-bold"
          >
            Clear Filters
          </Button>
        </div>
      ) : (
        <>
          {/* DESKTOP TABLE VIEW */}
          <div className="hidden md:block bg-white rounded-2xl border border-veyra-border shadow-xs overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-veyra-bg-secondary border-b border-veyra-border text-veyra-text-sub font-extrabold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3.5 px-4">Employee</th>
                  <th className="py-3.5 px-4">Employee ID</th>
                  <th className="py-3.5 px-4">Department</th>
                  <th className="py-3.5 px-4">Branch</th>
                  <th className="py-3.5 px-4">Joining Date</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-veyra-border/60 font-medium">
                {filteredEmployees.map((emp) => (
                  <tr key={emp.id} className="hover:bg-veyra-bg-secondary/50 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <Avatar src={emp.avatar_url} name={`${emp.first_name || ''} ${emp.last_name || ''}`} size="sm" />
                        <div>
                          <p className="font-bold text-veyra-text">
                            {emp.first_name} {emp.last_name}
                          </p>
                          <p className="text-[11px] text-veyra-text-sub">{emp.designation}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded bg-veyra-blue-soft text-veyra-blue font-mono text-[11px] font-bold border border-veyra-blue-border/60">
                        {emp.employee_id}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-semibold text-veyra-blue">{emp.department_name || 'Engineering'}</td>
                    <td className="py-3 px-4 font-medium text-veyra-navy">{emp.branch_name || emp.work_location || 'Chennai HQ'}</td>
                    <td className="py-3 px-4 text-veyra-text-sub">{emp.joining_date}</td>
                    <td className="py-3 px-4">
                      <Badge variant={emp.status === 'Active' ? 'success' : 'warning'} size="sm" className="font-bold">
                        {emp.status}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="outline"
                          size="sm"
                          icon={<IdCard className="w-3.5 h-3.5 text-veyra-blue" />}
                          onClick={() => setSelectedEmpForCard(emp)}
                          className="bg-white font-bold text-xs"
                        >
                          ID Card
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          icon={<Edit3 className="w-3.5 h-3.5 text-slate-600" />}
                          onClick={() => openEditModal(emp)}
                          className="bg-white text-xs"
                        >
                          Edit
                        </Button>
                        <button
                          type="button"
                          onClick={() => handleDelete(emp.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                          title="Delete Employee"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* MOBILE CARD VIEW */}
          <div className="block md:hidden space-y-3">
            {filteredEmployees.map((emp) => (
              <Card key={emp.id} padded={false} className="p-4 bg-white border-veyra-border space-y-3 shadow-xs">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar src={emp.avatar_url} name={`${emp.first_name || ''} ${emp.last_name || ''}`} size="md" />
                    <div>
                      <h4 className="text-sm font-bold text-veyra-text">
                        {emp.first_name} {emp.last_name}
                      </h4>
                      <p className="text-xs text-veyra-text-sub">{emp.designation}</p>
                    </div>
                  </div>
                  <Badge variant={emp.status === 'Active' ? 'success' : 'warning'} size="sm" className="font-bold">
                    {emp.status}
                  </Badge>
                </div>

                <div className="flex items-center justify-between text-xs pt-2 border-t border-veyra-border/60">
                  <span className="font-mono text-veyra-blue font-bold">{emp.employee_id}</span>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      icon={<IdCard className="w-3.5 h-3.5 text-veyra-blue" />}
                      onClick={() => setSelectedEmpForCard(emp)}
                      className="bg-white text-xs font-bold"
                    >
                      Digital ID
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      icon={<Edit3 className="w-3.5 h-3.5 text-slate-600" />}
                      onClick={() => openEditModal(emp)}
                      className="bg-white text-xs"
                    >
                      Edit
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </>
      )}
      {/* MODALS */}
      <CreateEmployeeWizard
        isOpen={isWizardOpen}
        onClose={() => setIsWizardOpen(false)}
        onSuccess={(created) => setSelectedEmpForCard(created)}
      />

      {selectedEmpForCard && (
        <DigitalIDCardModal
          isOpen={!!selectedEmpForCard}
          onClose={() => setSelectedEmpForCard(null)}
          employee={selectedEmpForCard}
        />
      )}

      {/* ─── EDIT EMPLOYEE MODAL (ALL FIELDS + PASSWORD) ───────────── */}
      <Modal
        isOpen={!!editingEmp}
        onClose={() => setEditingEmp(null)}
        title="Edit Employee Profile & Credentials"
        maxWidth="lg"
      >
        {editingEmp && (
          <form onSubmit={handleSaveEdit} className="space-y-4 text-left max-h-[75vh] overflow-y-auto pr-1">
            {/* Header / ID Badge */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-blue-50/80 border border-blue-200">
              <div className="flex items-center gap-3">
                <Avatar 
                  name={`${editFirstName} ${editLastName}`} 
                  src={editAvatarUrl} 
                  size="md" 
                  className="rounded-xl ring-2 ring-blue-400/40" 
                />
                <div>
                  <h4 className="text-sm font-extrabold text-[#172033]">{editFirstName} {editLastName}</h4>
                  <p className="text-[11px] text-blue-700 font-mono font-bold">{editingEmp.employee_id}</p>
                </div>
              </div>
              <div>
                <input
                  ref={editPhotoInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && handleEditPhotoUpload(e.target.files[0])}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  loading={uploadingEditPhoto}
                  onClick={() => editPhotoInputRef.current?.click()}
                  icon={<UploadCloud className="w-3.5 h-3.5 text-veyra-blue" />}
                  className="bg-white text-xs font-bold"
                >
                  Change Photo
                </Button>
              </div>
            </div>

            {/* Section 1: Personal Info */}
            <div className="space-y-3 pt-1">
              <p className="text-xs font-extrabold text-[#172033] uppercase tracking-wider">1. Personal Information</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-veyra-text mb-1">First Name *</label>
                  <input
                    type="text"
                    value={editFirstName}
                    onChange={(e) => setEditFirstName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-veyra-border bg-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-veyra-blue"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-veyra-text mb-1">Last Name *</label>
                  <input
                    type="text"
                    value={editLastName}
                    onChange={(e) => setEditLastName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-veyra-border bg-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-veyra-blue"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-veyra-text mb-1">Work Email Address *</label>
                  <input
                    type="email"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-veyra-border bg-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-veyra-blue"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-veyra-text mb-1">Mobile Phone Number</label>
                  <input
                    type="text"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-veyra-border bg-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-veyra-blue"
                    placeholder="+91 98401 00000"
                  />
                </div>
              </div>
            </div>

            {/* Section 2: Employment & Assignment */}
            <div className="space-y-3 pt-2">
              <p className="text-xs font-extrabold text-[#172033] uppercase tracking-wider">2. Employment & Department</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-veyra-text mb-1">Job Designation *</label>
                  <input
                    type="text"
                    value={editDesignation}
                    onChange={(e) => setEditDesignation(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-veyra-border bg-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-veyra-blue"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-veyra-text mb-1">Assigned Department</label>
                  <select
                    value={editDept}
                    onChange={(e) => setEditDept(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-veyra-border bg-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-veyra-blue"
                  >
                    {departments.map((d) => (
                      <option key={d.id} value={d.name}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-veyra-text mb-1">Assigned Branch</label>
                  <select
                    value={editBranch}
                    onChange={(e) => setEditBranch(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-veyra-border bg-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-veyra-blue"
                  >
                    {branches.map((b) => (
                      <option key={b.id} value={b.name}>
                        {b.name} ({b.city})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-veyra-text mb-1">Employee Status</label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-veyra-border bg-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-veyra-blue"
                  >
                    <option value="Active">Active</option>
                    <option value="On Leave">On Leave</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-veyra-text mb-1">Joining Date</label>
                  <input
                    type="date"
                    value={editJoiningDate}
                    onChange={(e) => setEditJoiningDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-veyra-border bg-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-veyra-blue"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-veyra-text mb-1">Work Location</label>
                  <input
                    type="text"
                    value={editWorkLocation}
                    onChange={(e) => setEditWorkLocation(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-veyra-border bg-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-veyra-blue"
                  />
                </div>
              </div>
            </div>

            {/* Section 3: Contact & Address */}
            <div className="space-y-3 pt-2">
              <p className="text-xs font-extrabold text-[#172033] uppercase tracking-wider">3. Address & Emergency Contact</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-veyra-text mb-1">Emergency Contact</label>
                  <input
                    type="text"
                    value={editEmergencyContact}
                    onChange={(e) => setEditEmergencyContact(e.target.value)}
                    placeholder="e.g. Spouse / Parent (+91 98400 11111)"
                    className="w-full px-3 py-2 rounded-xl border border-veyra-border bg-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-veyra-blue"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-veyra-text mb-1">Residential Address</label>
                  <input
                    type="text"
                    value={editAddress}
                    onChange={(e) => setEditAddress(e.target.value)}
                    placeholder="Door No, Street, City, PIN"
                    className="w-full px-3 py-2 rounded-xl border border-veyra-border bg-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-veyra-blue"
                  />
                </div>
              </div>
            </div>

            {/* Section 4: Security & Password Management */}
            <div className="pt-2 p-3.5 bg-blue-50/60 rounded-2xl border border-blue-100 space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-veyra-text flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-veyra-blue" /> Change / Reset Employee Password
                </label>
                <button
                  type="button"
                  onClick={generateEditPassword}
                  className="text-[11px] font-bold text-veyra-blue hover:text-blue-700 flex items-center gap-1"
                >
                  <RefreshCw className="w-3 h-3" /> Auto-Generate
                </button>
              </div>

              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <input
                    type={showEditPassword ? 'text' : 'password'}
                    value={editPassword}
                    onChange={(e) => setEditPassword(e.target.value)}
                    placeholder="Enter new login password for employee"
                    className="w-full rounded-xl border border-veyra-border bg-white px-3.5 py-2 text-xs text-veyra-text font-medium pr-9 focus:outline-none focus:ring-2 focus:ring-veyra-blue"
                  />
                  <button
                    type="button"
                    onClick={() => setShowEditPassword(!showEditPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-veyra-text-sub hover:text-veyra-text"
                  >
                    {showEditPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>

                {editPassword && (
                  <button
                    type="button"
                    onClick={() => copyOnlyPassword(editPassword)}
                    className="px-3 py-2 bg-white border border-blue-200 rounded-xl text-veyra-blue text-xs font-bold hover:bg-blue-50 transition-colors flex items-center gap-1 shadow-2xs shrink-0"
                    title="Copy Password Only"
                  >
                    {passwordCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    {passwordCopied ? 'Copied Password!' : 'Copy Password'}
                  </button>
                )}
              </div>
              <p className="text-[10px] text-veyra-text-sub">
                Admin can set a new login password for this employee. Click "Copy Password" to copy only the password string.
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-veyra-border">
              <Button type="button" variant="outline" onClick={() => setEditingEmp(null)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" className="font-bold shadow-xs">
                Save Changes
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* ─── IMPORT EMPLOYEES MODAL ─────────────────────────────────────── */}
      <Modal
        isOpen={isImportOpen}
        onClose={() => { setIsImportOpen(false); setCsvRows([]); }}
        title="Import Employees from CSV"
      >
        <div className="space-y-5 text-left">
          {/* Download template */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-blue-50 border border-blue-200">
            <div className="flex items-center gap-2.5">
              <FileSpreadsheet className="w-5 h-5 text-blue-600 shrink-0" />
              <div>
                <p className="text-xs font-bold text-blue-900">Download Sample Template</p>
                <p className="text-[11px] text-blue-700">Use this CSV format when preparing your import file</p>
              </div>
            </div>
            <button
              onClick={downloadSampleCSV}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition-colors"
            >
              <Download className="w-3.5 h-3.5" /> Template
            </button>
          </div>

          {/* Required columns info */}
          <div className="rounded-xl border border-veyra-border bg-veyra-bg-secondary p-3">
            <p className="text-[11px] font-bold text-veyra-text uppercase tracking-wider mb-2">Required CSV Columns</p>
            <div className="flex flex-wrap gap-1.5">
              {CSV_HEADERS.map((h) => (
                <span key={h} className="px-2 py-1 bg-white border border-veyra-border rounded-lg text-[11px] font-mono font-semibold text-veyra-text">
                  {h}
                </span>
              ))}
            </div>
          </div>

          {/* Drop zone */}
          {csvRows.length === 0 && (
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-veyra-blue/40 rounded-2xl p-8 text-center cursor-pointer hover:border-veyra-blue hover:bg-veyra-blue-soft/20 transition-all group"
            >
              <Upload className="w-10 h-10 text-veyra-blue/50 mx-auto mb-3 group-hover:scale-110 transition-transform" />
              <p className="text-sm font-bold text-veyra-text">Drop your CSV file here</p>
              <p className="text-xs text-veyra-text-sub mt-1">or click to browse — .csv files only</p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>
          )}

          {/* Error message */}
          {importError && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 font-semibold">
              <AlertCircle className="w-4 h-4 shrink-0" /> {importError}
              <button onClick={() => setImportError('')} className="ml-auto"><X className="w-3.5 h-3.5" /></button>
            </div>
          )}

          {/* Preview table */}
          {csvRows.length > 0 && (
            <div className="space-y-3">
              {/* Summary badges */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="green" size="sm" icon={<CheckCircle2 className="w-3 h-3" />}>
                    {validCount} ready to import
                  </Badge>
                  {errorCount > 0 && (
                    <Badge variant="red" size="sm" icon={<AlertCircle className="w-3 h-3" />}>
                      {errorCount} with errors
                    </Badge>
                  )}
                </div>
                <button
                  onClick={() => { setCsvRows([]); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                  className="text-[11px] text-veyra-text-sub hover:text-red-500 font-semibold flex items-center gap-1"
                >
                  <X className="w-3 h-3" /> Clear
                </button>
              </div>

              {/* Scrollable preview */}
              <div className="overflow-auto max-h-64 rounded-xl border border-veyra-border">
                <table className="w-full text-xs text-left min-w-[600px]">
                  <thead className="bg-veyra-bg-secondary border-b border-veyra-border">
                    <tr>
                      <th className="py-2.5 px-3 font-bold text-veyra-text-sub uppercase tracking-wide">#</th>
                      <th className="py-2.5 px-3 font-bold text-veyra-text-sub uppercase tracking-wide">Name</th>
                      <th className="py-2.5 px-3 font-bold text-veyra-text-sub uppercase tracking-wide">Email</th>
                      <th className="py-2.5 px-3 font-bold text-veyra-text-sub uppercase tracking-wide">Designation</th>
                      <th className="py-2.5 px-3 font-bold text-veyra-text-sub uppercase tracking-wide">Department</th>
                      <th className="py-2.5 px-3 font-bold text-veyra-text-sub uppercase tracking-wide">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-veyra-border/50">
                    {csvRows.map((row, i) => (
                      <tr
                        key={i}
                        className={row.errors.length > 0 ? 'bg-red-50' : 'hover:bg-veyra-bg-secondary/50'}
                      >
                        <td className="py-2 px-3 text-veyra-text-muted font-mono">{i + 1}</td>
                        <td className="py-2 px-3 font-semibold text-veyra-text">
                          {row.first_name} {row.last_name}
                          {row.errors.length > 0 && (
                            <p className="text-[10px] text-red-600 mt-0.5">{row.errors.join(', ')}</p>
                          )}
                        </td>
                        <td className="py-2 px-3 text-veyra-text-sub">{row.email}</td>
                        <td className="py-2 px-3 text-veyra-text-sub">{row.designation}</td>
                        <td className="py-2 px-3 text-veyra-text-sub">{row.department_name}</td>
                        <td className="py-2 px-3">
                          {row.errors.length === 0 ? (
                            <span className="text-emerald-600 font-bold flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" /> Valid
                            </span>
                          ) : (
                            <span className="text-red-500 font-bold flex items-center gap-1">
                              <AlertCircle className="w-3 h-3" /> Error
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Import action */}
              <div className="flex justify-end gap-2 pt-1">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => { setIsImportOpen(false); setCsvRows([]); }}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  disabled={validCount === 0 || importing || importDone}
                  onClick={handleImport}
                  icon={importDone ? <CheckCircle2 className="w-4 h-4" /> : <Upload className="w-4 h-4" />}
                >
                  {importDone
                    ? `Imported ${validCount} employees!`
                    : importing
                    ? `Importing ${validCount}…`
                    : `Import ${validCount} Employee${validCount !== 1 ? 's' : ''}`}
                </Button>
              </div>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};

