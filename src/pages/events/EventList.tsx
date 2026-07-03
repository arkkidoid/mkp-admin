import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit2, Trash2, CalendarDays, MapPin, Calendar } from 'lucide-react';
import apiClient from '../../api/client';
import Modal from '../../components/ui/Modal';
import PageHeader from '../../components/ui/PageHeader';
import EmptyState from '../../components/ui/EmptyState';

const EVENT_TYPES = ['academic', 'cultural', 'holiday', 'sports', 'other'];
const TYPE_COLORS: Record<string, string> = {
  academic: 'badge-blue', cultural: 'badge-purple', holiday: 'badge-green', sports: 'badge-orange', other: 'badge-gray',
};
const EMPTY = { title: '', description: '', startDate: '', location: '', type: 'academic' };

export default function EventList() {
  const qc = useQueryClient();
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ ...EMPTY });

  const { data, isLoading } = useQuery({
    queryKey: ['events'],
    queryFn: async () => (await apiClient.get('/events')).data.data ?? [],
  });

  const saveMutation = useMutation({
    mutationFn: async () => editing ? apiClient.put(`/events/${editing._id}`, form) : apiClient.post('/events', form),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['events'] }); setModal(false); setEditing(null); setForm({ ...EMPTY }); },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => apiClient.delete(`/events/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['events'] }),
  });

  const openEdit = (e: any) => { setEditing(e); setForm({ title: e.title, description: e.description || '', startDate: e.startDate?.slice(0, 10), location: e.location || '', type: e.type }); setModal(true); };
  const openAdd = () => { setEditing(null); setForm({ ...EMPTY }); setModal(true); };

  const events: any[] = data || [];

  return (
    <div className="page-container">
      <PageHeader
        title="Events"
        subtitle={`${events.length} event${events.length !== 1 ? 's' : ''} scheduled`}
        action={<button className="btn-primary" onClick={openAdd}><Plus className="w-3.5 h-3.5 mr-1.5" />Add Event</button>}
      />

      {isLoading ? (
        <div className="flex items-center justify-center py-24"><div className="w-7 h-7 border-2 border-primary/20 border-t-primary rounded-full animate-spin" /></div>
      ) : events.length === 0 ? (
        <EmptyState icon={CalendarDays} title="No events scheduled" description="Add upcoming events, holidays, and activities." action={<button className="btn-primary" onClick={openAdd}><Plus className="w-3.5 h-3.5 mr-1.5" />Add Event</button>} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {events.map((event: any) => (
            <div key={event._id} className="card hover:shadow-medium transition-shadow duration-200 group">
              <div className="flex items-center justify-between mb-3">
                <span className={`badge ${TYPE_COLORS[event.type] ?? 'badge-gray'} capitalize`}>{event.type}</span>
                <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button className="btn-ghost !px-2 !py-1.5" onClick={() => openEdit(event)}><Edit2 className="w-3.5 h-3.5" /></button>
                  <button className="btn-ghost !px-2 !py-1.5 hover:!text-error hover:!bg-red-50" onClick={() => { if (confirm('Delete this event?')) deleteMutation.mutate(event._id); }}><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>
              <h3 className="font-bold text-text mb-1.5">{event.title}</h3>
              {event.description && <p className="text-xs text-text-secondary mb-3 line-clamp-2">{event.description}</p>}
              <div className="flex flex-col gap-1 mt-auto pt-3 border-t border-border-light">
                <div className="flex items-center gap-2 text-xs text-text-secondary">
                  <Calendar className="w-3.5 h-3.5 text-text-light flex-shrink-0" />
                  {new Date(event.startDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                </div>
                {event.location && (
                  <div className="flex items-center gap-2 text-xs text-text-secondary">
                    <MapPin className="w-3.5 h-3.5 text-text-light flex-shrink-0" />{event.location}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={modal} onClose={() => { setModal(false); setEditing(null); }} title={editing ? 'Edit Event' : 'New Event'}
        footer={<div className="flex gap-3"><button className="btn-outline flex-1" onClick={() => setModal(false)}>Cancel</button><button className="btn-primary flex-1" onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>{saveMutation.isPending ? 'Saving…' : 'Save'}</button></div>}
      >
        <div className="space-y-4">
          <div><label className="label">Title</label><input className="input-field" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="Event title" /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">Date</label><input className="input-field" type="date" value={form.startDate} onChange={e => setForm(p => ({ ...p, startDate: e.target.value }))} /></div>
            <div><label className="label">Type</label>
              <select className="select-field" value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))}>
                {EVENT_TYPES.map(t => <option key={t} value={t}>{t[0].toUpperCase() + t.slice(1)}</option>)}
              </select>
            </div>
          </div>
          <div><label className="label">Location</label><input className="input-field" value={form.location} onChange={e => setForm(p => ({ ...p, location: e.target.value }))} placeholder="School hall, Ground…" /></div>
          <div><label className="label">Description</label><textarea className="input-field resize-none" rows={3} value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Brief description…" /></div>
        </div>
      </Modal>
    </div>
  );
}
