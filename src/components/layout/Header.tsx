
import { useNavigate } from 'react-router-dom';
import { Bell, Search, LogOut } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

export default function Header() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  return (
    <header className="h-16 bg-surface border-b border-border-light flex items-center justify-between px-6 shadow-sm z-10">
      <div className="flex-1 flex items-center">
        <div className="relative w-64">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3">
            <Search className="w-4 h-4 text-text-light" />
          </span>
          <input
            type="text"
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border-none rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
            placeholder="Search anything..."
          />
        </div>
      </div>

      <div className="flex items-center space-x-6">
        <button 
          className="relative text-text-secondary hover:text-primary transition-colors"
          onClick={() => navigate('/notifications')}
        >
          <Bell className="w-5 h-5" />
        </button>

        <div className="h-8 w-px bg-border-light"></div>

        <div className="flex items-center space-x-3">
          <div className="text-right hidden md:block">
            <p className="text-sm font-semibold text-text leading-tight">{user?.name || 'Admin User'}</p>
            <p className="text-xs text-text-secondary font-medium">Administrator</p>
          </div>
          <div className="h-9 w-9 rounded-full bg-primary flex items-center justify-center text-white font-bold shadow-soft">
            {user?.name?.charAt(0) || 'A'}
          </div>
          <button 
            onClick={() => logout()}
            className="ml-2 p-1.5 text-text-light hover:text-error hover:bg-red-50 rounded-lg transition-colors"
            title="Logout"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
}
