import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Trash2, Image } from 'lucide-react';
import apiClient from '../../api/client';

export default function GalleryManagement() {
  const qc = useQueryClient();
  const [batchId, setBatchId] = useState('');

  const { data: batchesData } = useQuery({
    queryKey: ['batches'],
    queryFn: async () => (await apiClient.get('/batches')).data.data,
  });

  const { data, isLoading } = useQuery({
    queryKey: ['gallery', batchId],
    queryFn: async () => {
      const params = batchId ? `?batchId=${batchId}` : '';
      return (await apiClient.get(`/gallery${params}`)).data.data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => apiClient.delete(`/gallery/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['gallery'] }),
  });

  const items = data || [];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-text">Gallery</h1>
          <p className="text-sm text-text-secondary mt-1">Manage classroom moments and photos</p>
        </div>
        <select className="input-field w-48 py-2" value={batchId} onChange={(e) => setBatchId(e.target.value)}>
          <option value="">All Batches</option>
          {batchesData?.map((b: any) => <option key={b._id} value={b._id}>{b.name}</option>)}
        </select>
      </div>

      {isLoading ? (
        <p className="text-center py-8 text-text-secondary">Loading...</p>
      ) : items.length === 0 ? (
        <div className="card border border-border-light text-center py-16">
          <Image className="w-12 h-12 text-border mx-auto mb-3" />
          <p className="text-text-secondary font-medium">No gallery items found</p>
          <p className="text-sm text-text-light mt-1">Teachers can upload moments from the mobile app</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {items.map((item: any) => (
            <div key={item._id} className="relative group rounded-2xl overflow-hidden border border-border-light shadow-soft">
              {item.mediaUrl ? (
                <img src={item.mediaUrl} alt={item.title} className="w-full h-48 object-cover" />
              ) : (
                <div className="w-full h-48 bg-gray-100 flex items-center justify-center">
                  <Image className="w-8 h-8 text-border" />
                </div>
              )}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
                <p className="text-white font-medium text-sm truncate">{item.title}</p>
                <p className="text-white/70 text-xs">{item.batch?.name} • {item.uploadedBy?.name}</p>
                <button
                  className="absolute top-2 right-2 p-1.5 bg-red-500 rounded-full text-white hover:bg-red-600"
                  onClick={() => deleteMutation.mutate(item._id)}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
