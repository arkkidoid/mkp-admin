import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Trash2, Image } from 'lucide-react';
import apiClient from '../../api/client';
import PageHeader from '../../components/ui/PageHeader';
import EmptyState from '../../components/ui/EmptyState';

export default function GalleryManagement() {
  const qc = useQueryClient();
  const [batchId, setBatchId] = useState('');

  const { data: batchesData } = useQuery({
    queryKey: ['batches'],
    queryFn: async () => (await apiClient.get('/batches')).data.data,
  });

  const { data, isLoading } = useQuery({
    queryKey: ['gallery', batchId],
    queryFn: async () => (await apiClient.get(`/gallery${batchId ? `?batchId=${batchId}` : ''}`)).data.data,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => apiClient.delete(`/gallery/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['gallery'] }),
  });

  const items: any[] = data || [];

  return (
    <div className="page-container">
      <PageHeader
        title="Gallery"
        subtitle="Classroom moments and photos uploaded by teachers"
        action={
          <select className="select-field w-44" value={batchId} onChange={e => setBatchId(e.target.value)}>
            <option value="">All Batches</option>
            {batchesData?.map((b: any) => <option key={b._id} value={b._id}>{b.name}</option>)}
          </select>
        }
      />

      {isLoading ? (
        <div className="flex items-center justify-center py-24">
          <div className="w-7 h-7 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
        </div>
      ) : items.length === 0 ? (
        <EmptyState icon={Image} title="No gallery items" description="Teachers can upload moments from the mobile app." />
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {items.map((item: any) => (
            <div key={item._id} className="relative group rounded-2xl overflow-hidden border border-border-light shadow-soft aspect-square">
              {item.mediaUrl ? (
                <img src={item.mediaUrl} alt={item.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-background flex items-center justify-center">
                  <Image className="w-8 h-8 text-border" />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
                <p className="text-white font-semibold text-sm truncate leading-tight">{item.title}</p>
                <p className="text-white/70 text-xs mt-0.5">{item.batch?.name} · {item.uploadedBy?.name}</p>
              </div>
              <button
                className="absolute top-2 right-2 p-1.5 bg-red-500 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 shadow-soft"
                onClick={() => { if (confirm('Delete this photo?')) deleteMutation.mutate(item._id); }}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
