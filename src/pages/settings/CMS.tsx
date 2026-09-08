import { useState, useEffect } from 'react';
import { Save, CheckCircle2, Building2, Bell, LayoutTemplate, Smartphone, AlertTriangle } from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import api from '../../api/client';

const EMPTY = {
  schoolName: 'ARK Kidoid', address: '', phone: '', email: '',
  academicYear: '2025-26', website: '', principalName: '',
  guestHeroTitle: 'A joyful place to learn & grow',
  guestHeroBody: 'Explore our courses, facilities and campus life. Robotics, coding, chess & more.',
  guestAboutText: 'Masti Ki Paathshaala is dedicated to providing an enriching and joyful learning environment for children.'
};

export default function CMS() {
  const [form, setForm] = useState({ ...EMPTY });
  const [saved, setSaved] = useState(false);
  const [notifications, setNotifications] = useState({ attendance: true, feeReminder: true, assignments: true });
  const [appUpdate, setAppUpdate] = useState({
    enabled: false,
    minVersionIos: '1.0.0',
    minVersionAndroid: '1.0.0',
    title: 'Update required',
    message: 'A newer version of ARK Connect is required to continue. Please update to carry on.',
    iosUrl: 'https://apps.apple.com/in/app/ark-connect-mkp/id6792667854',
    androidUrl: 'https://play.google.com/store/apps/details?id=com.arkkidoid.app&hl=en_IN',
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/settings').then(res => {
      const data = res.data.data;
      if (data) {
        setForm(prev => ({ ...prev, ...data }));
        if (data.notifications) {
          setNotifications(prev => ({ ...prev, ...data.notifications }));
        }
        if (data.appUpdate) {
          setAppUpdate(prev => ({ ...prev, ...data.appUpdate }));
        }
      }
    }).catch(console.error)
    .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    try {
      await api.put('/admin/settings', { ...form, notifications, appUpdate });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      console.error('Failed to save settings', err);
    }
  };

  const field = (label: string, key: keyof typeof form, type = 'text', placeholder = '') => (
    <div key={key}>
      <label className="label">{label}</label>
      {type === 'textarea' ? (
        <textarea
          className="input-field min-h-[80px]"
          placeholder={placeholder || label}
          value={form[key]}
          onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
        />
      ) : (
        <input
          className="input-field"
          type={type}
          placeholder={placeholder || label}
          value={form[key]}
          onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
        />
      )}
    </div>
  );

  const toggle = (key: keyof typeof notifications) =>
    setNotifications(p => ({ ...p, [key]: !p[key] }));

  if (loading) {
    return <div className="p-8 text-center text-text-light">Loading settings...</div>;
  }

  return (
    <div className="page-container max-w-3xl">
      <PageHeader title="System Settings" subtitle="Configure school information and mobile guest view" />

      <div className="card space-y-5">
        <div className="flex items-center gap-3 pb-4 border-b border-border-light">
          <div className="w-9 h-9 rounded-xl bg-primary-bg flex items-center justify-center">
            <Building2 className="w-4.5 h-4.5 text-primary" />
          </div>
          <p className="font-bold text-text">School Information</p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {field('School Name', 'schoolName')}
          {field('Principal / Director Name', 'principalName')}
        </div>
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

      <div className="card space-y-5">
        <div className="flex items-center gap-3 pb-4 border-b border-border-light">
          <div className="w-9 h-9 rounded-xl bg-orange-50 flex items-center justify-center">
            <LayoutTemplate className="w-4.5 h-4.5 text-orange-500" />
          </div>
          <p className="font-bold text-text">Mobile App Guest View</p>
        </div>
        {field('Hero Title', 'guestHeroTitle', 'text', 'A joyful place to learn & grow')}
        {field('Hero Subtitle / Body', 'guestHeroBody', 'textarea', 'Explore our courses...')}
        {field('About Us Text', 'guestAboutText', 'textarea', 'Masti Ki Paathshaala is dedicated to...')}
      </div>

      <div className="card space-y-4">
        <div className="flex items-center gap-3 pb-4 border-b border-border-light">
          <div className="w-9 h-9 rounded-xl bg-purple-50 flex items-center justify-center">
            <Bell className="w-4.5 h-4.5 text-purple-500" />
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
      </div>

      <div className="card space-y-4">
        <div className="flex items-center gap-3 pb-4 border-b border-border-light">
          <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center">
            <Smartphone className="w-4.5 h-4.5 text-blue-500" />
          </div>
          <div className="flex-1">
            <p className="font-bold text-text">App Version Control</p>
            <p className="text-xs text-text-secondary mt-0.5">
              Force parents and teachers onto a newer build of ARK Connect
            </p>
          </div>
        </div>

        <label className="flex items-center gap-3 cursor-pointer select-none group">
          <div
            className={`w-10 h-6 rounded-full transition-colors flex-shrink-0 flex items-center px-0.5 ${appUpdate.enabled ? 'bg-primary' : 'bg-border'}`}
            onClick={() => setAppUpdate(p => ({ ...p, enabled: !p.enabled }))}
          >
            <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${appUpdate.enabled ? 'translate-x-4' : 'translate-x-0'}`} />
          </div>
          <span className="text-sm text-text">Require a minimum app version</span>
        </label>

        {appUpdate.enabled && (
          <div className="flex gap-2.5 p-3 rounded-xl bg-orange-50 border border-orange-100">
            <AlertTriangle className="w-4 h-4 text-warning flex-shrink-0 mt-0.5" />
            <p className="text-xs text-text-secondary leading-relaxed">
              Anyone on an older build is fully blocked until they update — they cannot
              log in or browse. Set these to a version that is <strong>already live</strong> on
              the store, or you will lock people out with nothing to update to.
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Minimum iOS version</label>
            <input
              className="input-field font-mono"
              value={appUpdate.minVersionIos}
              onChange={e => setAppUpdate(p => ({ ...p, minVersionIos: e.target.value }))}
              placeholder="1.1.0"
              disabled={!appUpdate.enabled}
            />
          </div>
          <div>
            <label className="label">Minimum Android version</label>
            <input
              className="input-field font-mono"
              value={appUpdate.minVersionAndroid}
              onChange={e => setAppUpdate(p => ({ ...p, minVersionAndroid: e.target.value }))}
              placeholder="1.1.0"
              disabled={!appUpdate.enabled}
            />
          </div>
        </div>

        <div>
          <label className="label">Screen title</label>
          <input
            className="input-field"
            value={appUpdate.title}
            onChange={e => setAppUpdate(p => ({ ...p, title: e.target.value }))}
            disabled={!appUpdate.enabled}
          />
        </div>

        <div>
          <label className="label">Message shown to the user</label>
          <textarea
            className="input-field min-h-[80px]"
            value={appUpdate.message}
            onChange={e => setAppUpdate(p => ({ ...p, message: e.target.value }))}
            disabled={!appUpdate.enabled}
          />
        </div>

        <details className="rounded-xl border border-border-light">
          <summary className="px-3 py-2.5 text-xs font-semibold text-text-secondary cursor-pointer select-none">
            Store links
          </summary>
          <div className="px-3 pb-3 pt-1 space-y-3">
            <div>
              <label className="label">App Store (iOS)</label>
              <input
                className="input-field text-xs"
                value={appUpdate.iosUrl}
                onChange={e => setAppUpdate(p => ({ ...p, iosUrl: e.target.value }))}
              />
            </div>
            <div>
              <label className="label">Play Store (Android)</label>
              <input
                className="input-field text-xs"
                value={appUpdate.androidUrl}
                onChange={e => setAppUpdate(p => ({ ...p, androidUrl: e.target.value }))}
              />
            </div>
          </div>
        </details>
      </div>

      <div className="flex items-center gap-4">
        <button className="btn-primary px-8" onClick={handleSave}>
          <Save className="w-4 h-4 mr-2" />
          {saved ? 'Saved!' : 'Save Settings'}
        </button>
        {saved && (
          <div className="flex items-center gap-1.5 text-success text-sm font-medium">
            <CheckCircle2 className="w-4 h-4" /> Settings updated securely.
          </div>
        )}
      </div>
    </div>
  );
}
