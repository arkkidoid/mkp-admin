import { useNavigate } from 'react-router-dom';
import { Bell, LogOut, Menu } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

interface HeaderProps {
  onMenuClick: () => void;
}

export default function Header({ onMenuClick }: HeaderProps) {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  return (
    <header className="h-14 md:h-16 bg-surface border-b border-border-light flex items-center justify-between px-4 md:px-6 shadow-sm z-10 flex-shrink-0">
      {/* Left: hamburger (mobile) + title (mobile) */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="md:hidden p-2 rounded-xl text-text-secondary hover:bg-gray-100 transition-colors"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        <span className="md:hidden font-bold text-primary text-base">ARK Kidoid</span>
      </div>

      {/* Right: notifications + user + logout */}
      <div className="flex items-center gap-2 md:gap-4 ml-auto">
        <button
          className="relative p-2 text-text-secondary hover:text-primary transition-colors rounded-xl hover:bg-gray-50"
          onClick={() => navigate('/notifications')}
          aria-label="Notifications"
        >
          <Bell className="w-5 h-5" />
        </button>

        <div className="h-8 w-px bg-border-light hidden sm:block" />

        <div className="flex items-center gap-2 md:gap-3">
          <div className="text-right hidden md:block">
            <p className="text-sm font-semibold text-text leading-tight">{user?.name || 'Admin'}</p>
            <p className="text-xs text-text-secondary">Administrator</p>
          </div>
          <div className="w-8 h-8 md:w-9 md:h-9 rounded-full bg-primary flex items-center justify-center text-white font-bold text-sm shadow-soft flex-shrink-0">
            {(user?.name?.[0] ?? 'A').toUpperCase()}
          </div>
          <button
            onClick={() => logout()}
            className="p-1.5 text-text-light hover:text-error hover:bg-red-50 rounded-lg transition-colors"
            title="Logout"
          >
            <LogOut className="w-4 h-4 md:w-5 md:h-5" />
          </button>
        </div>
      </div>
    </header>
  );
}
