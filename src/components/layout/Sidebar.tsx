import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Users, GraduationCap, BookOpen, Layers,
  Settings, CalendarDays, Image, Bell, BarChart3, DollarSign,
  ClipboardList, FileText, ChevronDown, X, CreditCard, Inbox,
} from 'lucide-react';

const NAV_GROUPS = [
  {
    label: 'Overview',
    items: [
      { name: 'Dashboard', path: '/', icon: LayoutDashboard, end: true },
    ],
  },
  {
    label: 'People',
    items: [
      { name: 'Students',  path: '/children',  icon: BookOpen },
      { name: 'Teachers',  path: '/teachers',  icon: GraduationCap },
      { name: 'Parents',   path: '/parents',   icon: Users },
    ],
  },
  {
    label: 'Academics',
    items: [
      { name: 'Batches',      path: '/batches',     icon: Layers },
      { name: 'Courses',      path: '/courses',     icon: FileText },
      { name: 'Attendance',   path: '/attendance',  icon: ClipboardList },
      { name: 'Assignments',  path: '/assignments', icon: ClipboardList },
    ],
  },
  {
    label: 'Finance',
    items: [
      { name: 'Fee Records',  path: '/fees',          icon: DollarSign },
      { name: 'Payments',     path: '/fees/payments', icon: CreditCard },
    ],
  },
  {
    label: 'Management',
    items: [
      { name: 'Enquiries',      path: '/enquiries',     icon: Inbox },
      { name: 'Events',         path: '/events',        icon: CalendarDays },
      { name: 'Gallery',        path: '/gallery',       icon: Image },
      { name: 'Notifications',  path: '/notifications', icon: Bell },
    ],
  },
  {
    label: 'Insights',
    items: [
      { name: 'Reports', path: '/reports', icon: BarChart3 },
    ],
  },
  {
    label: 'System',
    items: [
      { name: 'Settings', path: '/settings', icon: Settings },
    ],
  },
];

interface SidebarProps {
  onClose?: () => void;
}

export default function Sidebar({ onClose }: SidebarProps) {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState<string[]>([]);

  const toggleGroup = (label: string) =>
    setCollapsed(p => p.includes(label) ? p.filter(l => l !== label) : [...p, label]);

  const isGroupActive = (items: typeof NAV_GROUPS[0]['items']) =>
    items.some(i => i.path === '/'
      ? location.pathname === '/'
      : location.pathname.startsWith(i.path));

  return (
    <aside className="w-60 bg-surface border-r border-border-light flex flex-col h-full overflow-hidden">
      {/* Logo */}
      <div className="h-14 flex items-center gap-2.5 px-4 border-b border-border-light flex-shrink-0">
        <img src="/image.png" alt="Logo" className="w-7 h-7 object-contain rounded-lg" />
        <div className="flex-1 min-w-0">
          <p className="font-bold text-text text-sm leading-tight">ARK Kidoid</p>
          <p className="text-[10px] text-text-light font-medium">Admin Panel</p>
        </div>
        {onClose && (
          <button onClick={onClose} className="md:hidden p-1 rounded-lg text-text-light hover:text-text hover:bg-border-light">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-2 px-2">
        {NAV_GROUPS.map(group => {
          const isOpen = !collapsed.includes(group.label);
          const active = isGroupActive(group.items);
          return (
            <div key={group.label}>
              <button
                onClick={() => toggleGroup(group.label)}
                className="section-title w-full flex items-center justify-between hover:text-text-secondary transition-colors cursor-pointer group"
              >
                <span className={active && !isOpen ? 'text-primary' : ''}>{group.label}</span>
                <ChevronDown className={`w-3 h-3 text-text-light transition-transform ${isOpen ? 'rotate-0' : '-rotate-90'}`} />
              </button>

              {isOpen && group.items.map(item => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={('end' in item && item.end) || false}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all duration-100 mb-0.5 ${
                      isActive
                        ? 'bg-primary-bg text-primary font-semibold'
                        : 'text-text-secondary hover:bg-border-light hover:text-text font-medium'
                    }`
                  }
                >
                  <item.icon className="w-4 h-4 flex-shrink-0" />
                  {item.name}
                </NavLink>
              ))}
            </div>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-border-light flex-shrink-0">
        <p className="text-[10px] text-text-light font-medium text-center">MKP Admin · v1.0</p>
      </div>
    </aside>
  );
}
