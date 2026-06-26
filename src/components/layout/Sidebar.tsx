import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Users, GraduationCap, BookOpen, Layers,
  Settings, CalendarDays, Image, Bell, BarChart3, DollarSign,
  ClipboardList, FileText, ChevronDown, ChevronRight,
} from 'lucide-react';

const navItems = [
  { name: 'Dashboard', path: '/', icon: LayoutDashboard },
  { name: 'Parents', path: '/parents', icon: Users },
  { name: 'Teachers', path: '/teachers', icon: GraduationCap },
  { name: 'Students', path: '/children', icon: BookOpen },
  { name: 'Batches', path: '/batches', icon: Layers },
  { name: 'Courses', path: '/courses', icon: FileText },
  {
    name: 'Academics',
    icon: ClipboardList,
    children: [
      { name: 'Attendance', path: '/attendance' },
      { name: 'Assignments', path: '/assignments' },
    ],
  },
  {
    name: 'Fees',
    icon: DollarSign,
    children: [
      { name: 'Fee Structure', path: '/fees' },
      { name: 'Payment History', path: '/fees/payments' },
    ],
  },
  { name: 'Events', path: '/events', icon: CalendarDays },
  { name: 'Gallery', path: '/gallery', icon: Image },
  { name: 'Notifications', path: '/notifications', icon: Bell },
  { name: 'Reports', path: '/reports', icon: BarChart3 },
  { name: 'Settings', path: '/settings', icon: Settings },
];

export default function Sidebar() {
  const [open, setOpen] = useState<string[]>([]);
  const toggle = (name: string) => setOpen((p) => p.includes(name) ? p.filter((n) => n !== name) : [...p, name]);

  return (
    <aside className="w-64 bg-surface border-r border-border-light flex flex-col h-full shadow-soft z-10 overflow-y-auto">
      <div className="h-20 flex items-center justify-center border-b border-border-light flex-shrink-0">
        <img src="/image.png" alt="Logo" className="w-16 h-16 object-contain mr-2 scale-125" />
        <h1 className="text-xl font-bold text-primary tracking-tight">ARK Kidoid</h1>
        <span className="ml-2 text-xs bg-primary-bg text-primary-dark px-2 py-0.5 rounded-full font-medium">Admin</span>
      </div>

      <nav className="flex-1 py-4 px-3 space-y-1">
        {navItems.map((item) => {
          if (item.children) {
            const isOpen = open.includes(item.name);
            return (
              <div key={item.name}>
                <button
                  onClick={() => toggle(item.name)}
                  className="w-full flex items-center px-4 py-3 rounded-xl text-text-secondary hover:bg-gray-50 hover:text-text font-medium transition-all"
                >
                  <item.icon className="w-5 h-5 mr-3" />
                  <span className="flex-1 text-left">{item.name}</span>
                  {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </button>
                {isOpen && (
                  <div className="ml-8 mt-1 space-y-1">
                    {item.children.map((child) => (
                      <NavLink
                        key={child.path}
                        to={child.path}
                        className={({ isActive }) =>
                          `block px-4 py-2 rounded-lg text-sm transition-all ${
                            isActive ? 'bg-primary-bg text-primary-dark font-semibold' : 'text-text-secondary hover:text-text'
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
              className={({ isActive }) =>
                `flex items-center px-4 py-3 rounded-xl transition-all duration-200 ${
                  isActive
                    ? 'bg-primary-bg text-primary-dark font-semibold'
                    : 'text-text-secondary hover:bg-gray-50 hover:text-text font-medium'
                }`
              }
            >
              <item.icon className="w-5 h-5 mr-3" />
              {item.name}
            </NavLink>
          );
        })}
      </nav>

      <div className="p-4 border-t border-border-light text-center flex-shrink-0">
        <p className="text-xs text-text-light font-medium">ARK Kidoid Admin v1.0</p>
      </div>
    </aside>
  );
}
