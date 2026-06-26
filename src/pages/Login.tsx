import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { Mail, Lock } from 'lucide-react';
import apiClient from '../api/client';
import { useAuthStore } from '../store/authStore';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { isAuthenticated, setUser } = useAuthStore();
  const navigate = useNavigate();

  if (isAuthenticated) return <Navigate to="/" replace />;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) { setError('Please enter email and password'); return; }

    setError('');
    setLoading(true);
    try {
      const res = await apiClient.post('/auth/login', { email, password });
      const { user, accessToken, refreshToken } = res.data.data;

      if (user.role !== 'admin') {
        setError('Access denied. This portal is for administrators only.');
        return;
      }

      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('user', JSON.stringify(user));
      setUser(user);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      {/* Logo + Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="mx-auto w-56 h-56 -mb-8 relative z-10">
          <img src="/logo.png" alt="ARK Kidoid Logo" className="w-full h-full object-contain scale-125 drop-shadow-md" />
        </div>
        <h1 className="text-3xl font-extrabold text-text tracking-tight">ARK Kidoid</h1>
        <p className="text-sm font-semibold text-primary mt-1">Masti Ki Pathshala</p>
        <p className="mt-2 text-sm text-text-secondary">Admin Portal — Sign in to manage the platform</p>
      </div>

      {/* Card */}
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-surface py-8 px-6 rounded-2xl border border-border-light" style={{ boxShadow: '0 8px 24px rgba(0,0,0,0.08)' }}>
          <form className="space-y-5" onSubmit={handleLogin}>

            {/* Email */}
            <div>
              <label htmlFor="email" className="label">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-light" />
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@arkkidoid.com"
                  className="input-field pl-10"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="label">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-light" />
                <input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="input-field pl-10"
                />
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="text-error text-sm font-medium text-center bg-red-50 py-2.5 px-4 rounded-xl border border-red-100">
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-3 px-4 rounded-xl text-sm font-bold text-white bg-primary hover:bg-primary-dark transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing in...
                </span>
              ) : 'Sign In'}
            </button>
          </form>

          {/* Hint */}
          <div className="mt-6 p-3 bg-primary-bg rounded-xl border border-primary/20">
            <p className="text-xs text-primary-dark font-medium text-center">
              Default credentials: admin@arkkidoid.com / Admin@123
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
