import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Users, GraduationCap, BookOpen, Layers,
  Settings, CalendarDays, Image, Bell, BarChart3, DollarSign,
  ClipboardList, FileText, ChevronDown, ChevronRight, X,
} from 'lucide-react';

const navItems = [
  { name: 'Dashboard',     path: '/',              icon: LayoutDashboard },
  { name: 'Parents',       path: '/parents',        icon: Users },
  { name: 'Teachers',      path: '/teachers',       icon: GraduationCap },
  { name: 'Students',      path: '/children',       icon: BookOpen },
  { name: 'Batches',       path: '/batches',        icon: Layers },
  { name: 'Courses',       path: '/courses',        icon: FileText },
  {
    name: 'Academics', icon: ClipboardList,
    children: [
      { name: 'Attendance',  path: '/attendance' },
      { name: 'Assignments', path: '/assignments' },
    ],
  },
  {
    name: 'Fees', icon: DollarSign,
    children: [
      { name: 'Fee Records',      path: '/fees' },
      { name: 'Payment History',  path: '/fees/payments' },
    ],
  },
  { name: 'Events',        path: '/events',         icon: CalendarDays },
  { name: 'Gallery',       path: '/gallery',        icon: Image },
  { name: 'Notifications', path: '/notifications',  icon: Bell },
  { name: 'Reports',       path: '/reports',        icon: BarChart3 },
  { name: 'Settings',      path: '/settings',       icon: Settings },
];

interface SidebarProps {
  onClose?: () => void;
}

export default function Sidebar({ onClose }: SidebarProps) {
  const [open, setOpen] = useState<string[]>([]);
  const toggle = (name: string) =>
    setOpen((p) => (p.includes(name) ? p.filter((n) => n !== name) : [...p, name]));

  return (
    <aside className="w-64 bg-surface border-r border-border-light flex flex-col h-full shadow-soft overflow-y-auto">
      {/* Logo row */}
      <div className="h-14 md:h-20 flex items-center px-4 border-b border-border-light flex-shrink-0 gap-2">
        <img src="/image.png" alt="Logo" className="w-10 h-10 md:w-12 md:h-12 object-contain" />
        <div className="flex-1 min-w-0">
          <p className="font-bold text-primary text-base leading-tight">ARK Kidoid</p>
          <span className="text-xs bg-primary-bg text-primary-dark px-2 py-0.5 rounded-full font-medium">Admin</span>
        </div>
        {/* Close button — only visible on mobile */}
        {onClose && (
          <button
            onClick={onClose}
            className="md:hidden p-1.5 rounded-lg text-text-light hover:text-text hover:bg-gray-100 transition-colors flex-shrink-0"
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          if (item.children) {
            const isOpen = open.includes(item.name);
            return (
              <div key={item.name}>
                <button
                  onClick={() => toggle(item.name)}
                  className="w-full flex items-center px-3 py-2.5 rounded-xl text-text-secondary hover:bg-gray-50 hover:text-text font-medium transition-all text-sm"
                >
                  <item.icon className="w-4 h-4 mr-3 flex-shrink-0" />
                  <span className="flex-1 text-left">{item.name}</span>
                  {isOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                </button>
                {isOpen && (
                  <div className="ml-7 mt-0.5 space-y-0.5 border-l-2 border-border-light pl-3">
                    {item.children.map((child) => (
                      <NavLink
                        key={child.path}
                        to={child.path}
                        onClick={onClose}
                        className={({ isActive }) =>
                          `block px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                            isActive
                              ? 'bg-primary-bg text-primary-dark font-semibold'
                              : 'text-text-secondary hover:text-text hover:bg-gray-50'
                          }`
                        }
                      >
                        {child.name}
                      </NavLink>
                    ))}
                  </div>
                )}
              </div>
            );
          }

          return (
            <NavLink
              key={item.name}
              to={item.path!}
              end={item.path === '/'}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center px-3 py-2.5 rounded-xl text-sm transition-all duration-150 ${
                  isActive
                    ? 'bg-primary-bg text-primary-dark font-semibold'
                    : 'text-text-secondary hover:bg-gray-50 hover:text-text font-medium'
                }`
              }
            >
              <item.icon className="w-4 h-4 mr-3 flex-shrink-0" />
              {item.name}
            </NavLink>
          );
        })}
      </nav>

      <div className="p-3 border-t border-border-light text-center flex-shrink-0">
        <p className="text-xs text-text-light font-medium">ARK Kidoid Admin v1.0</p>
      </div>
    </aside>
  );
}
