import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Inbox, Trash2, Phone, Mail, MapPin } from 'lucide-react';
import apiClient from '../../api/client';
import PageHeader from '../../components/ui/PageHeader';
import SearchInput from '../../components/ui/SearchInput';
import EmptyState from '../../components/ui/EmptyState';
import Modal from '../../components/ui/Modal';

const STATUSES = ['all', 'new', 'contacted', 'closed'] as const;
const STATUS_BADGE: Record<string, string> = { new: 'badge-orange', contacted: 'badge-blue', closed: 'badge-gray' };

export default function EnquiryList() {
  const qc = useQueryClient();
  const [status, setStatus] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<any>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['adminEnquiries', status],
    queryFn: async () => (await apiClient.get(`/admin/enquiries${status !== 'all' ? `?status=${status}` : ''}`)).data,
  });

  const enquiries = (data?.data ?? []).filter((e: any) =>
    (e.name ?? '').toLowerCase().includes(search.toLowerCase()) ||
    (e.phone ?? '').includes(search) ||
    (e.interestedIn ?? '').toLowerCase().includes(search.toLowerCase())
  );
  const newCount = data?.meta?.newCount ?? 0;

  const statusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => apiClient.put(`/admin/enquiries/${id}`, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['adminEnquiries'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => apiClient.delete(`/admin/enquiries/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['adminEnquiries'] }); setSelected(null); },
  });

  return (
    <div className="page-container">
      <PageHeader
        title="Enquiries"
        subtitle="Admission leads submitted from the app"
        action={newCount > 0 ? <span className="badge badge-orange">{newCount} new</span> : undefined}
      />

      <div className="card !p-0 overflow-hidden">
        <div className="p-4 border-b border-border-light flex flex-col sm:flex-row gap-3 sm:items-center">
          <SearchInput value={search} onChange={setSearch} placeholder="Search by name, phone or course…" className="flex-1 sm:max-w-72" />
          <div className="flex gap-1.5">
            {STATUSES.map(s => (
              <button
                key={s}
                onClick={() => setStatus(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors ${status === s ? 'bg-text text-white' : 'bg-background text-text-secondary hover:text-text'}`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px]">
            <thead className="bg-background border-b border-border-light">
              <tr>{['Name', 'Contact', 'Interested In', 'Received', 'Status', ''].map(h => <th key={h} className="table-header">{h}</th>)}</tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={6} className="py-16 text-center text-sm text-text-secondary">Loading…</td></tr>
              ) : enquiries.length === 0 ? (
                <tr><td colSpan={6}><EmptyState icon={Inbox} title="No enquiries yet" description="Leads from the app's ‘Explore School’ section will appear here." /></td></tr>
              ) : enquiries.map((e: any) => (
                <tr key={e._id} className="border-b border-border-light last:border-0 hover:bg-background/60 transition-colors cursor-pointer" onClick={() => setSelected(e)}>
                  <td className="table-cell">
                    <p className="font-semibold text-text">{e.name}</p>
                    {e.address ? <p className="text-xs text-text-light">{e.address}</p> : null}
                  </td>
                  <td className="table-cell">
                    <a href={`tel:${e.phone}`} onClick={ev => ev.stopPropagation()} className="text-sm text-text hover:text-primary block">{e.phone}</a>
                    {e.email ? <a href={`mailto:${e.email}`} onClick={ev => ev.stopPropagation()} className="text-xs text-text-light hover:text-primary">{e.email}</a> : null}
                  </td>
                  <td className="table-cell text-sm text-text-secondary">{e.interestedIn || '—'}</td>
                  <td className="table-cell text-sm text-text-secondary whitespace-nowrap">{new Date(e.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                  <td className="table-cell" onClick={ev => ev.stopPropagation()}>
                    <select
                      className={`badge ${STATUS_BADGE[e.status] ?? 'badge-gray'} capitalize cursor-pointer border-0 outline-none pr-1`}
                      value={e.status}
                      onChange={ev => statusMutation.mutate({ id: e._id, status: ev.target.value })}
                    >
                      <option value="new">New</option>
                      <option value="contacted">Contacted</option>
                      <option value="closed">Closed</option>
                    </select>
                  </td>
                  <td className="table-cell" onClick={ev => ev.stopPropagation()}>
                    <button className="btn-ghost !px-2 !py-1.5 hover:!text-error hover:!bg-red-50" onClick={() => { if (confirm('Delete this enquiry?')) deleteMutation.mutate(e._id); }} title="Delete"><Trash2 className="w-3.5 h-3.5" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={!!selected} onClose={() => setSelected(null)} title={selected?.name} subtitle="Admission enquiry">
        {selected && (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <span className={`badge ${STATUS_BADGE[selected.status] ?? 'badge-gray'} capitalize`}>{selected.status}</span>
              {selected.interestedIn ? <span className="badge badge-purple">{selected.interestedIn}</span> : null}
            </div>
            <div className="space-y-2.5">
              <a href={`tel:${selected.phone}`} className="flex items-center gap-2.5 text-sm text-text hover:text-primary"><Phone className="w-4 h-4 text-text-light" />{selected.phone}</a>
              {selected.email ? <a href={`mailto:${selected.email}`} className="flex items-center gap-2.5 text-sm text-text hover:text-primary"><Mail className="w-4 h-4 text-text-light" />{selected.email}</a> : null}
              {selected.address ? <div className="flex items-center gap-2.5 text-sm text-text-secondary"><MapPin className="w-4 h-4 text-text-light" />{selected.address}</div> : null}
            </div>
            {selected.message ? (
              <div>
                <p className="label">Message</p>
                <p className="text-sm text-text-secondary bg-background rounded-lg p-3 leading-relaxed">{selected.message}</p>
              </div>
            ) : null}
            <p className="text-xs text-text-light">Received {new Date(selected.createdAt).toLocaleString('en-IN')}</p>
          </div>
        )}
      </Modal>
    </div>
  );
}
