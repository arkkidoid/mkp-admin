import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Save, CheckCircle2, Building2, UserCog, Loader2 } from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import apiClient from '../../api/client';

export default function CMS() {
  const qc = useQueryClient();

  const { data, isLoading, isError } = useQuery({
    queryKey: ['adminSettings'],
    queryFn: async () => (await apiClient.get('/admin/settings')).data.data,
  });

  const [form, setForm] = useState({
    name: '', email: '', phone: '',
    schoolName: '', designation: '', schoolPhone: '', schoolEmail: '', schoolWebsite: '',
    street: '', city: '', state: '', pincode: '',
  });

  // Pre-fill form when data loads from DB
  useEffect(() => {
    if (!data) return;
    const u = data.user || {};
    const p = data.profile || {};
    const addr = p.schoolAddress || {};
    setForm({
      name: u.name || '',
      email: u.email || '',
      phone: u.phone || '',
      schoolName: p.schoolName || '',
      designation: p.designation || '',
      schoolPhone: p.schoolPhone || '',
      schoolEmail: p.schoolEmail || '',
      schoolWebsite: p.schoolWebsite || '',
      street: addr.street || '',
      city: addr.city || '',
      state: addr.state || '',
      pincode: addr.pincode || '',
    });
  }, [data]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      await apiClient.put('/admin/settings', {
        name: form.name,
        email: form.email,
        phone: form.phone,
        schoolName: form.schoolName,
        designation: form.designation,
        schoolPhone: form.schoolPhone,
        schoolEmail: form.schoolEmail,
        schoolWebsite: form.schoolWebsite,
        schoolAddress: {
          street: form.street,
          city: form.city,
          state: form.state,
          pincode: form.pincode,
        },
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['adminSettings'] });
    },
    onError: (e: any) => {
      alert(e?.response?.data?.message || 'Failed to save settings');
    },
  });

  const f = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(p => ({ ...p, [key]: e.target.value }));

  const field = (label: string, key: keyof typeof form, type = 'text', placeholder = '') => (
    <div key={key}>
      <label className="label">{label}</label>
      <input
        className="input-field"
        type={type}
        placeholder={placeholder || label}
        value={form[key]}
        onChange={f(key)}
      />
    </div>
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex items-center justify-center h-64 text-sm text-text-secondary">
        Failed to load settings — check if the backend is running.
      </div>
    );
  }

  return (
    <div className="page-container max-w-2xl">
      <PageHeader title="System Settings" subtitle="Configure school information and admin profile" />

      {/* Admin Profile */}
      <div className="card space-y-5">
        <div className="flex items-center gap-3 pb-4 border-b border-border-light">
          <div className="w-9 h-9 rounded-xl bg-purple-50 flex items-center justify-center">
            <UserCog className="w-4.5 h-4.5 text-purple-600" />
          </div>
          <p className="font-bold text-text">Admin Profile</p>
        </div>
        {field('Full Name', 'name')}
        <div className="grid grid-cols-2 gap-4">
          {field('Email', 'email', 'email', 'admin@school.com')}
          {field('Phone', 'phone', 'tel', '+91 XXXXX XXXXX')}
        </div>
        {field('Designation', 'designation', 'text', 'Founder & Director')}
      </div>

      {/* School Information */}
      <div className="card space-y-5 mt-6">
        <div className="flex items-center gap-3 pb-4 border-b border-border-light">
          <div className="w-9 h-9 rounded-xl bg-primary-bg flex items-center justify-center">
            <Building2 className="w-4.5 h-4.5 text-primary" />
          </div>
          <p className="font-bold text-text">School Information</p>
        </div>
        {field('School Name', 'schoolName')}
        {field('Address (Street)', 'street', 'text', '123 School St')}
        <div className="grid grid-cols-3 gap-4">
          {field('City', 'city', 'text', 'Greater Noida')}
          {field('State', 'state', 'text', 'Uttar Pradesh')}
          {field('Pincode', 'pincode', 'text', '201310')}
        </div>
        <div className="grid grid-cols-2 gap-4">
          {field('School Phone', 'schoolPhone', 'tel', '0120-4567890')}
          {field('School Email', 'schoolEmail', 'email', 'hello@school.com')}
        </div>
        {field('Website', 'schoolWebsite', 'url', 'https://school.com')}
      </div>

      {/* Save Button */}
      <div className="flex items-center gap-4 mt-6">
        <button
          className="btn-primary"
          onClick={() => saveMutation.mutate()}
          disabled={saveMutation.isPending}
        >
          {saveMutation.isPending ? (
            <><Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />Saving…</>
          ) : (
            <><Save className="w-3.5 h-3.5 mr-1.5" />Save Settings</>
          )}
        </button>
        {saveMutation.isSuccess && (
          <div className="flex items-center gap-1.5 text-success text-sm font-medium">
            <CheckCircle2 className="w-4 h-4" />Settings saved successfully
          </div>
        )}
      </div>
    </div>
  );
}
