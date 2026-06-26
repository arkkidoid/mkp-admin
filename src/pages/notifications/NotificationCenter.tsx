import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Send, Bell } from 'lucide-react';
import apiClient from '../../api/client';

export default function NotificationCenter() {
  const qc = useQueryClient();
  const [tab, setTab] = useState<'send' | 'history'>('send');
  const [form, setForm] = useState({ title: '', body: '', targetRole: 'all' });

  const { data: historyData, isLoading } = useQuery({
    queryKey: ['notificationHistory'],
    queryFn: async () => (await apiClient.get('/notifications')).data.data,
    enabled: tab === 'history',
  });

  const sendMutation = useMutation({
    mutationFn: async () => apiClient.post('/notifications', form),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notificationHistory'] });
      setForm({ title: '', body: '', targetRole: 'all' });
      alert('Notification sent successfully!');
    },
    onError: (e: any) => alert(e?.response?.data?.message || 'Failed to send'),
  });

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text">Notification Center</h1>
        <p className="text-sm text-text-secondary mt-1">Send announcements and view notification history</p>
      </div>

      <div className="flex gap-2 border-b border-border-light">
        {(['send', 'history'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`pb-3 px-4 font-semibold text-sm capitalize transition-colors border-b-2 ${
              tab === t ? 'border-primary text-primary' : 'border-transparent text-text-secondary hover:text-text'
            }`}
          >
            {t === 'send' ? 'Send Notification' : 'History'}
          </button>
        ))}
      </div>

      {tab === 'send' && (
        <div className="card border border-border-light">
          <h2 className="text-lg font-bold text-text mb-6">Send Notification</h2>
          <div className="space-y-4">
            <div>
              <label className="label">Target Audience</label>
              <select className="input-field" value={form.targetRole} onChange={(e) => setForm({ ...form, targetRole: e.target.value })}>
                <option value="all">Everyone</option>
                <option value="parent">Parents Only</option>
                <option value="teacher">Teachers Only</option>
              </select>
            </div>
            <div>
              <label className="label">Title</label>
              <input className="input-field" placeholder="Notification title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>
            <div>
              <label className="label">Message</label>
              <textarea
                className="input-field min-h-28 resize-none"
                placeholder="Write your message..."
                value={form.body}
                onChange={(e) => setForm({ ...form, body: e.target.value })}
              />
            </div>
            <button
              className="btn-primary flex items-center"
              onClick={() => sendMutation.mutate()}
              disabled={!form.title || !form.body || sendMutation.isPending}
            >
              <Send className="w-4 h-4 mr-2" />
              {sendMutation.isPending ? 'Sending...' : 'Send Notification'}
            </button>
          </div>
        </div>
      )}

      {tab === 'history' && (
        <div className="card border border-border-light">
          {isLoading ? (
            <p className="text-center py-8 text-text-secondary">Loading...</p>
          ) : (historyData || []).length === 0 ? (
            <div className="text-center py-12">
              <Bell className="w-10 h-10 text-border mx-auto mb-3" />
              <p className="text-text-secondary">No notifications sent yet</p>
            </div>
          ) : (
            <div className="divide-y divide-border-light">
              {(historyData || []).map((n: any) => (
                <div key={n._id} className="py-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold text-text">{n.title}</p>
                      <p className="text-sm text-text-secondary mt-1">{n.body}</p>
                    </div>
                    <div className="text-right flex-shrink-0 ml-4">
                      <span className="px-2 py-0.5 text-xs rounded-full bg-primary-bg text-primary-dark font-medium capitalize">{n.type || 'general'}</span>
                      <p className="text-xs text-text-light mt-1">{new Date(n.createdAt).toLocaleDateString('en-IN')}</p>
                    </div>
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
