import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Send, Bell, Users, GraduationCap, Globe, User, ChevronDown, X } from 'lucide-react';
import apiClient from '../../api/client';
import PageHeader from '../../components/ui/PageHeader';
import EmptyState from '../../components/ui/EmptyState';

const TARGETS = [
  { value: 'all',     label: 'Everyone',      icon: Globe,         desc: 'All parents & teachers' },
  { value: 'parent',  label: 'Parents Only',  icon: Users,         desc: 'All parents' },
  { value: 'teacher', label: 'Teachers Only', icon: GraduationCap, desc: 'All teachers' },
];

const FEE_TEMPLATES = [
  { id: 'due',     label: 'Fee Due',      title: 'Fee Payment Reminder',   body: (n: string) => `Dear ${n}, your child's fee is due. Please make the payment at the earliest.` },
  { id: 'overdue', label: 'Overdue',      title: 'Fee Payment Overdue',    body: (n: string) => `Dear ${n}, your child's fee payment is overdue. Kindly clear the dues immediately.` },
  { id: 'receipt', label: 'Received',     title: 'Fee Payment Confirmed',  body: (n: string) => `Dear ${n}, we have received your fee payment. Thank you!` },
  { id: 'custom',  label: 'Custom',       title: '',                       body: () => '' },
];

type TabType = 'broadcast' | 'direct' | 'history';

export default function NotificationCenter() {
  const qc = useQueryClient();
  const [tab, setTab] = useState<TabType>('broadcast');
  const [form, setForm] = useState({ title: '', body: '', targetRole: 'all' });
  const [selectedParent, setSelectedParent] = useState<any>(null);
  const [parentSearch, setParentSearch] = useState('');
  const [showParentDrop, setShowParentDrop] = useState(false);
  const [template, setTemplate] = useState('due');
  const [directTitle, setDirectTitle] = useState('');
  const [directBody, setDirectBody] = useState('');

  const { data: historyData, isLoading: historyLoading } = useQuery({
    queryKey: ['notificationHistory'],
    queryFn: async () => (await apiClient.get('/notifications')).data.data,
    enabled: tab === 'history',
  });

  const { data: parentsData } = useQuery({
    queryKey: ['adminParentsList'],
    queryFn: async () => (await apiClient.get('/admin/parents')).data.data,
    enabled: tab === 'direct',
  });

  const parents: any[] = parentsData || [];
  const filteredParents = parents.filter(p => (p.name || '').toLowerCase().includes(parentSearch.toLowerCase()) || (p.phone || '').includes(parentSearch));

  const broadcastMutation = useMutation({
    mutationFn: async () => apiClient.post('/notifications', form),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['notificationHistory'] }); setForm({ title: '', body: '', targetRole: 'all' }); alert('Notification sent!'); },
    onError: (e: any) => alert(e?.response?.data?.message || 'Failed'),
  });

  const directMutation = useMutation({
    mutationFn: async () => apiClient.post('/notifications', { targetUserId: selectedParent._id, title: directTitle, body: directBody, type: template === 'custom' ? 'general' : 'fee' }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['notificationHistory'] }); setSelectedParent(null); setParentSearch(''); setDirectTitle(''); setDirectBody(''); setTemplate('due'); alert('Message sent!'); },
    onError: (e: any) => alert(e?.response?.data?.message || 'Failed'),
  });

  const applyTemplate = (tplId: string, name: string) => {
    const tpl = FEE_TEMPLATES.find(t => t.id === tplId);
    if (!tpl || tplId === 'custom') { setDirectTitle(''); setDirectBody(''); return; }
    setDirectTitle(tpl.title);
    setDirectBody(tpl.body(name || 'Parent'));
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <PageHeader title="Notifications" subtitle="Send announcements or direct messages" />

      {/* Tabs */}
      <div className="flex gap-0 border-b border-border-light">
        {(['broadcast', 'direct', 'history'] as TabType[]).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`pb-3 px-4 text-sm font-semibold capitalize transition-colors border-b-2 ${tab === t ? 'border-primary text-primary' : 'border-transparent text-text-secondary hover:text-text'}`}
          >
            {t === 'direct' ? 'Direct Message' : t === 'broadcast' ? 'Broadcast' : 'History'}
          </button>
        ))}
      </div>

      {/* BROADCAST */}
      {tab === 'broadcast' && (
        <div className="card space-y-5">
          <div>
            <label className="label mb-2">Target Audience</label>
            <div className="grid grid-cols-3 gap-3">
              {TARGETS.map(t => (
                <button key={t.value} type="button" onClick={() => setForm(p => ({ ...p, targetRole: t.value }))}
                  className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all text-center ${form.targetRole === t.value ? 'border-primary bg-primary-bg' : 'border-border hover:border-primary/40'}`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${form.targetRole === t.value ? 'bg-primary text-white' : 'bg-background text-text-secondary'}`}>
                    <t.icon className="w-4 h-4" />
                  </div>
                  <p className={`text-xs font-semibold leading-tight ${form.targetRole === t.value ? 'text-primary' : 'text-text-secondary'}`}>{t.label}</p>
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="label">Title</label>
            <input className="input-field" placeholder="e.g. Holiday Announcement" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} />
          </div>
          <div>
            <label className="label">Message</label>
            <textarea className="input-field resize-none min-h-28" placeholder="Write your announcement here…" value={form.body} onChange={e => setForm(p => ({ ...p, body: e.target.value }))} />
          </div>
          <button className="btn-primary w-full sm:w-auto" onClick={() => broadcastMutation.mutate()} disabled={!form.title || !form.body || broadcastMutation.isPending}>
            <Send className="w-3.5 h-3.5 mr-1.5" />{broadcastMutation.isPending ? 'Sending…' : 'Send Notification'}
          </button>
        </div>
      )}

      {/* DIRECT MESSAGE */}
      {tab === 'direct' && (
        <div className="card space-y-5">
          <div>
            <label className="label">Select Parent</label>
            <div className="relative mt-1.5">
              {selectedParent ? (
                <div className="flex items-center gap-3 p-3 rounded-xl border-2 border-primary bg-primary-bg">
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white text-xs font-bold flex-shrink-0">{selectedParent.name?.[0] ?? 'P'}</div>
                  <div className="flex-1 min-w-0"><p className="text-sm font-semibold text-text">{selectedParent.name}</p><p className="text-xs text-text-secondary">{selectedParent.phone}</p></div>
                  <button onClick={() => { setSelectedParent(null); setDirectTitle(''); setDirectBody(''); }} className="p-1 hover:bg-black/10 rounded-full"><X className="w-3.5 h-3.5 text-text-secondary" /></button>
                </div>
              ) : (
                <button type="button" onClick={() => setShowParentDrop(v => !v)} className="w-full flex items-center gap-2 p-3 rounded-xl border border-border hover:border-primary/50 text-left bg-surface transition-colors">
                  <User className="w-4 h-4 text-text-light" />
                  <span className="flex-1 text-sm text-text-light">Choose a parent…</span>
                  <ChevronDown className="w-3.5 h-3.5 text-text-light" />
                </button>
              )}
              {showParentDrop && !selectedParent && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-surface border border-border-light rounded-xl shadow-medium z-20 overflow-hidden">
                  <div className="p-2 border-b border-border-light">
                    <input className="w-full px-3 py-2 text-sm bg-background rounded-lg outline-none" placeholder="Search name or phone…" value={parentSearch} onChange={e => setParentSearch(e.target.value)} autoFocus />
                  </div>
                  <div className="max-h-52 overflow-y-auto">
                    {filteredParents.length === 0 ? <p className="text-center text-sm text-text-secondary py-6">No parents found</p>
                    : filteredParents.map((p: any) => (
                      <button key={p._id} type="button" onClick={() => { setSelectedParent(p); setShowParentDrop(false); applyTemplate(template, p.name); }} className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-background text-left">
                        <div className="w-8 h-8 rounded-full bg-primary-bg flex items-center justify-center text-primary text-xs font-bold flex-shrink-0">{p.name?.[0] ?? 'P'}</div>
                        <div className="min-w-0"><p className="text-sm font-semibold text-text truncate">{p.name}</p><p className="text-xs text-text-secondary">{p.phone}</p></div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="label">Template</label>
            <div className="grid grid-cols-4 gap-2 mt-1.5">
              {FEE_TEMPLATES.map(t => (
                <button key={t.id} type="button" onClick={() => { setTemplate(t.id); applyTemplate(t.id, selectedParent?.name); }}
                  className={`py-2 px-1 rounded-lg border-2 text-xs font-semibold transition-all ${template === t.id ? 'border-primary bg-primary-bg text-primary' : 'border-border text-text-secondary hover:border-primary/40'}`}
                >{t.label}</button>
              ))}
            </div>
          </div>

          <div><label className="label">Title</label><input className="input-field" value={directTitle} onChange={e => setDirectTitle(e.target.value)} placeholder="Notification title" /></div>
          <div><label className="label">Message</label><textarea className="input-field resize-none min-h-28" value={directBody} onChange={e => setDirectBody(e.target.value)} placeholder="Write your message…" /></div>

          <button className="btn-primary w-full sm:w-auto" onClick={() => directMutation.mutate()} disabled={!selectedParent || !directTitle || !directBody || directMutation.isPending}>
            <Send className="w-3.5 h-3.5 mr-1.5" />{directMutation.isPending ? 'Sending…' : `Send to ${selectedParent?.name ?? 'Parent'}`}
          </button>
        </div>
      )}

      {/* HISTORY */}
      {tab === 'history' && (
        <div className="card !p-0 overflow-hidden">
          {historyLoading ? (
            <div className="flex items-center justify-center py-16"><div className="w-6 h-6 border-2 border-primary/20 border-t-primary rounded-full animate-spin" /></div>
          ) : !(historyData?.length) ? (
            <EmptyState icon={Bell} title="No notifications sent" description="Use Broadcast or Direct Message to get started." />
          ) : (
            <div className="divide-y divide-border-light">
              {(historyData || []).map((n: any) => (
                <div key={n._id} className="flex items-start gap-3 px-5 py-4">
                  <div className="w-8 h-8 rounded-lg bg-primary-bg flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Bell className="w-3.5 h-3.5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-text">{n.title}</p>
                    <p className="text-xs text-text-secondary mt-0.5 line-clamp-2">{n.body}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className={`badge ${n.type === 'fee' ? 'badge-orange' : 'badge-gray'} mb-1`}>{n.type ?? 'general'}</span>
                    <p className="text-[10px] text-text-light">{new Date(n.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
