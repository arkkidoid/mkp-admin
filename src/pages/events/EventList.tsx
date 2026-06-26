import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import apiClient from '../../api/client';

const EVENT_TYPES = ['academic', 'cultural', 'holiday', 'sports', 'other'];

export default function EventList() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ title: '', description: '', startDate: '', location: '', type: 'academic' });

  const { data, isLoading } = useQuery({
    queryKey: ['events'],
    queryFn: async () => (await apiClient.get('/events')).data.data,
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (editing) {
        await apiClient.put(`/events/${editing._id}`, form);
      } else {
        await apiClient.post('/events', form);
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['events'] });
      setShowForm(false);
      setEditing(null);
      setForm({ title: '', description: '', startDate: '', location: '', type: 'academic' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => apiClient.delete(`/events/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['events'] }),
  });

  const openEdit = (event: any) => {
    setEditing(event);
    setForm({ title: event.title, description: event.description || '', startDate: event.startDate?.slice(0, 10), location: event.location || '', type: event.type });
    setShowForm(true);
  };

  const events = data || [];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-text">Events</h1>
          <p className="text-sm text-text-secondary mt-1">Manage school events and activities</p>
        </div>
        <button className="btn-primary flex items-center" onClick={() => { setShowForm(true); setEditing(null); }}>
          <Plus className="w-5 h-5 mr-2" />Add Event
        </button>
      </div>

      {showForm && (
        <div className="card border border-border-light">
          <h2 className="text-lg font-bold text-text mb-4">{editing ? 'Edit Event' : 'New Event'}</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="label">Title</label>
              <input className="input-field" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Event title" />
            </div>
            <div>
              <label className="label">Date</label>
              <input className="input-field" type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
            </div>
            <div>
              <label className="label">Type</label>
              <select className="input-field" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                {EVENT_TYPES.map((t) => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Location</label>
              <input className="input-field" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="School hall, Ground..." />
            </div>
            <div>
              <label className="label">Description</label>
              <input className="input-field" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Brief description" />
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <button className="btn-primary" onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
              {saveMutation.isPending ? 'Saving...' : 'Save'}
            </button>
            <button className="btn-outline" onClick={() => setShowForm(false)}>Cancel</button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          <p className="col-span-3 text-center py-8 text-text-secondary">Loading...</p>
        ) : events.length === 0 ? (
          <p className="col-span-3 text-center py-8 text-text-secondary">No events scheduled.</p>
        ) : events.map((event: any) => (
          <div key={event._id} className="card border border-border-light hover:shadow-medium transition-shadow">
            <div className="flex justify-between items-start mb-3">
              <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-primary-bg text-primary-dark capitalize">{event.type}</span>
              <div className="flex gap-1">
                <button className="p-1 text-text-light hover:text-primary" onClick={() => openEdit(event)}><Edit2 className="w-4 h-4" /></button>
                <button className="p-1 text-text-light hover:text-error" onClick={() => deleteMutation.mutate(event._id)}><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
            <h3 className="font-bold text-text text-lg mb-1">{event.title}</h3>
            {event.description && <p className="text-sm text-text-secondary mb-3 line-clamp-2">{event.description}</p>}
            <div className="flex items-center gap-4 text-xs text-text-secondary mt-2">
              <span>📅 {new Date(event.startDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
              {event.location && <span>📍 {event.location}</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
