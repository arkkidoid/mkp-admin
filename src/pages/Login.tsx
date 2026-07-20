import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { KeyRound, Eye, EyeOff } from 'lucide-react';
import apiClient from '../api/client';
import { useAuthStore } from '../store/authStore';

export default function Login() {
  const [accessCode, setAccessCode] = useState('');
  const [showCode, setShowCode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { isAuthenticated, setUser } = useAuthStore();
  const navigate = useNavigate();

  if (isAuthenticated) return <Navigate to="/" replace />;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessCode.trim()) { setError('Please enter your access code'); return; }
    setError('');
    setLoading(true);
    try {
      const res = await apiClient.post('/auth/admin-login', { accessCode: accessCode.trim() });
      const { user, accessToken, refreshToken } = res.data.data;
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('user', JSON.stringify(user));
      setUser(user);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid access code.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-12">
      {/* Brand */}
      <div className="flex flex-col items-center mb-8">
        <div className="w-20 h-20 mb-4">
          <img src="/image.png" alt="ARK Kidoid" className="w-full h-full object-contain drop-shadow-sm" />
        </div>
        <p className="text-xs font-bold text-primary uppercase tracking-widest">Masti Ki Paathshaala</p>
        <p className="mt-1.5 text-sm text-text-secondary">Admin Portal</p>
      </div>

      {/* Card */}
      <div className="w-full max-w-sm">
        <div className="bg-surface rounded-2xl border border-border-light p-7 shadow-card">
          <h1 className="text-lg font-bold text-text mb-1">Welcome back</h1>
          <p className="text-sm text-text-secondary mb-6">Enter your access code to continue</p>

          <form className="space-y-4" onSubmit={handleLogin}>
            <div>
              <label htmlFor="accessCode" className="label">Access Code</label>
              <div className="relative mt-1.5">
                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-light pointer-events-none" />
                <input
                  id="accessCode"
                  type={showCode ? 'text' : 'password'}
                  autoComplete="off"
                  autoFocus
                  required
                  value={accessCode}
                  onChange={e => { setAccessCode(e.target.value); if (error) setError(''); }}
                  placeholder="Enter access code"
                  className="input-field pl-9 pr-10"
                />
                <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-text-light hover:text-text transition-colors" onClick={() => setShowCode(v => !v)}>
                  {showCode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="text-error text-sm font-medium bg-red-50 py-2.5 px-3.5 rounded-xl border border-red-100">
                {error}
              </div>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-3 mt-2">
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing in…
                </span>
              ) : 'Sign In'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
