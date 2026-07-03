import { useState } from 'react';
import { Save, CheckCircle2, Building2, Bell } from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';

const EMPTY = {
  schoolName: 'ARK Kidoid School', address: '', phone: '', email: '',
  academicYear: '2025-26', website: '', principalName: '',
};

export default function CMS() {
  const [form, setForm] = useState({ ...EMPTY });
  const [saved, setSaved] = useState(false);
  const [notifications, setNotifications] = useState({ attendance: true, feeReminder: true, assignments: true });

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const field = (label: string, key: keyof typeof form, type = 'text', placeholder = '') => (
    <div key={key}>
      <label className="label">{label}</label>
      <input
        className="input-field"
        type={type}
        placeholder={placeholder || label}
        value={form[key]}
        onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
      />
    </div>
  );

  const toggle = (key: keyof typeof notifications) =>
    setNotifications(p => ({ ...p, [key]: !p[key] }));

  return (
    <div className="page-container max-w-2xl">
      <PageHeader title="System Settings" subtitle="Configure school information and preferences" />

      <div className="card space-y-5">
        <div className="flex items-center gap-3 pb-4 border-b border-border-light">
          <div className="w-9 h-9 rounded-xl bg-primary-bg flex items-center justify-center">
            <Building2 className="w-4.5 h-4.5 text-primary" />
          </div>
          <p className="font-bold text-text">School Information</p>
        </div>
        {field('School Name', 'schoolName')}
        {field('Principal / Director Name', 'principalName')}
        {field('Address', 'address', 'text', '123 School St, City')}
        <div className="grid grid-cols-2 gap-4">
          {field('Phone Number', 'phone', 'tel', '+91 XXXXX XXXXX')}
          {field('Email', 'email', 'email', 'admin@school.com')}
        </div>
        <div className="grid grid-cols-2 gap-4">
          {field('Website', 'website', 'url', 'https://school.com')}
          {field('Academic Year', 'academicYear', 'text', '2025-26')}
        </div>
      </div>

      <div className="card space-y-4">
        <div className="flex items-center gap-3 pb-4 border-b border-border-light">
          <div className="w-9 h-9 rounded-xl bg-primary-bg flex items-center justify-center">
            <Bell className="w-4.5 h-4.5 text-primary" />
          </div>
          <p className="font-bold text-text">Notification Preferences</p>
        </div>
        {([
          { key: 'attendance', label: 'Send attendance notifications to parents' },
          { key: 'feeReminder', label: 'Send fee reminders before due date' },
          { key: 'assignments', label: 'Notify parents of new assignments' },
        ] as const).map(item => (
          <label key={item.key} className="flex items-center gap-3 cursor-pointer select-none group">
            <div
              className={`w-10 h-6 rounded-full transition-colors flex-shrink-0 flex items-center px-0.5 ${notifications[item.key] ? 'bg-primary' : 'bg-border'}`}
              onClick={() => toggle(item.key)}
            >
              <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${notifications[item.key] ? 'translate-x-4' : 'translate-x-0'}`} />
            </div>
            <span className="text-sm text-text group-hover:text-text/80 transition-colors">{item.label}</span>
          </label>
        ))}
        <p className="text-xs text-text-light pt-1">SMS via fast2sms will be configured separately.</p>
      </div>

      <div className="flex items-center gap-4">
        <button className="btn-primary" onClick={handleSave}>
          <Save className="w-3.5 h-3.5 mr-1.5" />
          {saved ? 'Saved!' : 'Save Settings'}
        </button>
        {saved && (
          <div className="flex items-center gap-1.5 text-success text-sm font-medium">
            <CheckCircle2 className="w-4 h-4" />Settings saved successfully
          </div>
        )}
      </div>
    </div>
  );
}
