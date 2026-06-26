import { useState } from 'react';
import { Save } from 'lucide-react';

export default function CMS() {
  const [form, setForm] = useState({
    schoolName: 'ARK Kidoid School',
    address: '',
    phone: '',
    email: '',
    academicYear: '2025-26',
    website: '',
    principalName: '',
  });
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    // In production, POST to /admin/settings
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const field = (label: string, key: keyof typeof form, type = 'text', placeholder = '') => (
    <div key={key}>
      <label className="label">{label}</label>
      <input
        className="input-field"
        type={type}
        placeholder={placeholder || label}
        value={form[key]}
        onChange={(e) => setForm({ ...form, [key]: e.target.value })}
      />
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text">System Settings</h1>
        <p className="text-sm text-text-secondary mt-1">Configure your school information</p>
      </div>

      <div className="card border border-border-light space-y-5">
        <h2 className="text-lg font-bold text-text border-b border-border-light pb-4">School Information</h2>
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

      <div className="card border border-border-light space-y-4">
        <h2 className="text-lg font-bold text-text border-b border-border-light pb-4">Notifications</h2>
        <label className="flex items-center gap-3 cursor-pointer">
          <input type="checkbox" defaultChecked className="w-4 h-4 accent-primary" />
          <span className="text-sm text-text">Send attendance notifications to parents</span>
        </label>
        <label className="flex items-center gap-3 cursor-pointer">
          <input type="checkbox" defaultChecked className="w-4 h-4 accent-primary" />
          <span className="text-sm text-text">Send fee reminders before due date</span>
        </label>
        <label className="flex items-center gap-3 cursor-pointer">
          <input type="checkbox" defaultChecked className="w-4 h-4 accent-primary" />
          <span className="text-sm text-text">Notify parents of new assignments</span>
        </label>
        <p className="text-xs text-text-light">SMS notifications via fast2sms will be configured separately.</p>
      </div>

      <div className="flex items-center gap-4">
        <button className="btn-primary flex items-center" onClick={handleSave}>
          <Save className="w-4 h-4 mr-2" />
          {saved ? 'Saved!' : 'Save Settings'}
        </button>
        {saved && <p className="text-sm text-green-600 font-medium">Settings saved successfully</p>}
      </div>
    </div>
  );
}
