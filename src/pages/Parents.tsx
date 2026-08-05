import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit2, Trash2, Users } from 'lucide-react';
import apiClient from '../api/client';
import Modal from '../components/ui/Modal';
import PageHeader from '../components/ui/PageHeader';
import SearchInput from '../components/ui/SearchInput';
import EmptyState from '../components/ui/EmptyState';

// Common country codes with flags
const COUNTRY_CODES = [
  { code: '+91',  flag: '🇮🇳', name: 'India' },
  { code: '+1',   flag: '🇺🇸', name: 'USA / Canada' },
  { code: '+44',  flag: '🇬🇧', name: 'UK' },
  { code: '+971', flag: '🇦🇪', name: 'UAE' },
  { code: '+966', flag: '🇸🇦', name: 'Saudi Arabia' },
  { code: '+974', flag: '🇶🇦', name: 'Qatar' },
  { code: '+968', flag: '🇴🇲', name: 'Oman' },
  { code: '+965', flag: '🇰🇼', name: 'Kuwait' },
  { code: '+973', flag: '🇧🇭', name: 'Bahrain' },
  { code: '+61',  flag: '🇦🇺', name: 'Australia' },
  { code: '+65',  flag: '🇸🇬', name: 'Singapore' },
  { code: '+60',  flag: '🇲🇾', name: 'Malaysia' },
  { code: '+49',  flag: '🇩🇪', name: 'Germany' },
  { code: '+33',  flag: '🇫🇷', name: 'France' },
  { code: '+81',  flag: '🇯🇵', name: 'Japan' },
  { code: '+86',  flag: '🇨🇳', name: 'China' },
  { code: '+92',  flag: '🇵🇰', name: 'Pakistan' },
  { code: '+880', flag: '🇧🇩', name: 'Bangladesh' },
  { code: '+94',  flag: '🇱🇰', name: 'Sri Lanka' },
  { code: '+977', flag: '🇳🇵', name: 'Nepal' },
  { code: '+27',  flag: '🇿🇦', name: 'South Africa' },
  { code: '+55',  flag: '🇧🇷', name: 'Brazil' },
];

const EMPTY = { name: '', phone: '', countryCode: '+91', email: '', occupation: '', accessCode: '', street: '', city: '', state: '', pincode: '' };

export default function Parents() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState<{ open: boolean; mode: 'add' | 'edit'; item?: any }>({ open: false, mode: 'add' });
  const [form, setForm] = useState({ ...EMPTY });
  const [err, setErr] = useState('');

  const { data: parents = [], isLoading } = useQuery({
    queryKey: ['adminParents'],
    queryFn: async () => (await apiClient.get('/admin/parents')).data.data ?? [],
  });

  const filtered = (parents as any[]).filter(p =>
    (p.name ?? '').toLowerCase().includes(search.toLowerCase()) ||
    (p.phone ?? '').includes(search)
  );

  // Parse existing phone to extract country code on edit
  const parsePhone = (phone: string) => {
    if (!phone) return { countryCode: '+91', local: '' };
    const match = COUNTRY_CODES.find(c => phone.startsWith(c.code));
    if (match) return { countryCode: match.code, local: phone.slice(match.code.length).trim() };
    return { countryCode: '+91', local: phone };
  };

  const openAdd = () => { setForm({ ...EMPTY }); setErr(''); setModal({ open: true, mode: 'add' }); };
  const openEdit = (p: any) => {
    const { countryCode, local } = parsePhone(p.phone ?? '');
    setForm({
      name: p.name,
      phone: local,
      countryCode,
      email: p.email ?? '',
      occupation: p.profile?.occupation ?? '',
      accessCode: '',
      street: p.address?.street ?? '',
      city: p.address?.city ?? '',
      state: p.address?.state ?? '',
      pincode: p.address?.pincode ?? '',
    });
    setErr('');
    setModal({ open: true, mode: 'edit', item: p });
  };
  const close = () => setModal({ open: false, mode: 'add' });

  const f = (k: keyof typeof EMPTY) => (e: React.ChangeEvent<HTMLInputElement>) => {
    if (k === 'phone') {
      setForm(p => ({ ...p, phone: e.target.value.replace(/[^\d\s\-()]/g, '') }));
    } else if (k === 'accessCode') {
      setForm(p => ({ ...p, [k]: e.target.value.replace(/\D/g, '').slice(0, 6) }));
    } else {
      setForm(p => ({ ...p, [k]: e.target.value }));
    }
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const fullPhone = `${form.countryCode}${form.phone.trim()}`;
      if (modal.mode === 'add' && form.accessCode.length !== 6) throw new Error('A 6-digit access code is required for new parents.');
      if (modal.mode === 'edit' && form.accessCode && form.accessCode.length !== 6) throw new Error('Access code must be exactly 6 digits.');

      const { street, city, state, pincode, countryCode, phone, ...rest } = form;
      const payload: any = { ...rest, phone: fullPhone, address: { street, city, state, pincode } };
      if (modal.mode === 'edit' && !payload.accessCode) delete payload.accessCode;

      if (modal.mode === 'add') await apiClient.post('/admin/parents', payload);
      else await apiClient.put(`/admin/parents/${modal.item._id}`, payload);
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['adminParents'] }); close(); },
    onError: (e: any) => setErr(e?.response?.data?.errors?.[0]?.message || e?.response?.data?.message || e?.message || 'Save failed'),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => apiClient.delete(`/admin/parents/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['adminParents'] }),
    onError: (e: any) => alert(e?.response?.data?.message || 'Delete failed'),
  });

  return (
    <div className="page-container">
      <PageHeader
        title="Parents"
        subtitle={`${(parents as any[]).length} registered parents`}
        action={<button className="btn-primary" onClick={openAdd}><Plus className="w-3.5 h-3.5 mr-1.5" />Add Parent</button>}
      />

      <div className="card !p-0 overflow-hidden">
        <div className="p-4 border-b border-border-light">
          <SearchInput value={search} onChange={setSearch} placeholder="Search by name or phone…" className="w-full sm:w-72" />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px]">
            <thead className="bg-background border-b border-border-light">
              <tr>
                {['Parent', 'Contact', 'Occupation', 'Children', 'Status', ''].map(h => (
                  <th key={h} className="table-header">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={6} className="py-16 text-center text-sm text-text-secondary">Loading…</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6}>
                  <EmptyState icon={Users} title="No parents found" description={search ? 'Try a different search.' : 'Add your first parent to get started.'} action={!search ? <button className="btn-primary" onClick={openAdd}><Plus className="w-3.5 h-3.5 mr-1.5" />Add Parent</button> : undefined} />
                </td></tr>
              ) : filtered.map((p: any) => (
                <tr key={p._id} className="border-b border-border-light last:border-0 hover:bg-background/60 transition-colors">
                  <td className="table-cell">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary-bg flex items-center justify-center text-xs font-bold text-primary-dark flex-shrink-0">
                        {(p.name?.[0] ?? '?').toUpperCase()}
                      </div>
                      <p className="font-semibold text-text text-sm">{p.name}</p>
                    </div>
                  </td>
                  <td className="table-cell">
                    <p className="text-sm text-text">{p.phone}</p>
                    <p className="text-xs text-text-light">{p.email || '—'}</p>
                  </td>
                  <td className="table-cell text-sm text-text-secondary">{p.profile?.occupation || '—'}</td>
                  <td className="table-cell">
                    <span className="badge badge-blue">{p.profile?.children?.length ?? 0} kids</span>
                  </td>
                  <td className="table-cell">
                    <span className={p.isActive ? 'badge badge-green' : 'badge badge-red'}>{p.isActive ? 'Active' : 'Inactive'}</span>
                  </td>
                  <td className="table-cell">
                    <div className="flex items-center justify-end gap-1">
                      <button className="btn-ghost !px-2 !py-1.5" onClick={() => openEdit(p)} title="Edit"><Edit2 className="w-3.5 h-3.5" /></button>
                      <button className="btn-ghost !px-2 !py-1.5 hover:!text-error hover:!bg-red-50" onClick={() => { if (confirm('Delete this parent?')) deleteMutation.mutate(p._id); }} title="Delete"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        open={modal.open}
        onClose={close}
        title={modal.mode === 'add' ? 'Add Parent' : 'Edit Parent'}
        footer={
          <div className="flex gap-3">
            <button className="btn-outline flex-1" onClick={close}>Cancel</button>
            <button className="btn-primary flex-1" onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
              {saveMutation.isPending ? 'Saving…' : 'Save'}
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          {/* Full Name */}
          <div>
            <label className="label">Full Name</label>
            <input className="input-field" type="text" value={form.name} onChange={f('name')} placeholder="Full Name" />
          </div>

          {/* Phone with country code dropdown */}
          <div>
            <label className="label">Phone Number</label>
            <div className="flex gap-2">
              <select
                className="input-field !w-auto !pr-8 flex-shrink-0 cursor-pointer"
                value={form.countryCode}
                onChange={e => setForm(p => ({ ...p, countryCode: e.target.value }))}
              >
                {COUNTRY_CODES.map(c => (
                  <option key={c.code} value={c.code}>
                    {c.flag} {c.code} {c.name}
                  </option>
                ))}
              </select>
              <input
                className="input-field flex-1"
                type="tel"
                value={form.phone}
                onChange={f('phone')}
                placeholder="Phone number"
                inputMode="numeric"
              />
            </div>
            <p className="text-xs text-text-light mt-1">
              Full number: <span className="font-medium text-text-secondary">{form.countryCode}{form.phone || 'XXXXXXXXXX'}</span>
            </p>
          </div>

          {/* Email */}
          <div>
            <label className="label">Email</label>
            <input className="input-field" type="email" value={form.email} onChange={f('email')} placeholder="Email" />
          </div>

          {/* Occupation */}
          <div>
            <label className="label">Occupation</label>
            <input className="input-field" type="text" value={form.occupation} onChange={f('occupation')} placeholder="Occupation" />
          </div>

          {/* Access Code */}
          <div>
            <label className="label">6-Digit Access Code {modal.mode === 'edit' && <span className="text-text-light font-normal">(Leave blank to keep current)</span>}</label>
            <input
              className="input-field"
              type="text"
              value={form.accessCode}
              onChange={f('accessCode')}
              placeholder="6-digit code"
              maxLength={6}
              inputMode="numeric"
            />
          </div>

          {/* Address Section */}
          <div>
            <p className="label mb-2">Address <span className="text-text-light font-normal">(optional)</span></p>
            <div className="space-y-2">
              <input className="input-field" placeholder="Street / Locality" value={form.street} onChange={f('street')} />
              <div className="grid grid-cols-2 gap-2">
                <input className="input-field" placeholder="City" value={form.city} onChange={f('city')} />
                <input className="input-field" placeholder="State" value={form.state} onChange={f('state')} />
              </div>
              <input
                className="input-field"
                placeholder="Pincode"
                value={form.pincode}
                onChange={e => setForm(p => ({ ...p, pincode: e.target.value.replace(/\D/g, '').slice(0, 6) }))}
                inputMode="numeric"
                maxLength={6}
              />
            </div>
          </div>

          {err && <p className="text-xs text-error bg-red-50 px-3 py-2 rounded-lg">{err}</p>}
        </div>
      </Modal>
    </div>
  );
}
