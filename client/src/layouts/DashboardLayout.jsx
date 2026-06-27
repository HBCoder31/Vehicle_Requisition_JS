import { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { parseDate } from '../utils/date';
import {
  LayoutDashboard, FileText, CheckSquare, Truck, Users, ScrollText,
  Menu, X, LogOut, ChevronDown, Shield, Bell, Check, TrendingUp, Search, RefreshCw, MapPin, History
} from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import socket from '../services/socket';

const roleNavConfig = {
  Employee: [
    { to: '/employee', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/employee/new-request', icon: FileText, label: 'New Request' },
    { to: '/requests/history', icon: History, label: 'Request History' },
    { to: '/employee/travel-ledger', icon: ScrollText, label: 'Travel Ledger' },
  ],
  HOD: [
    { to: '/hod', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/hod/approvals', icon: CheckSquare, label: 'Pending Approvals' },
    { to: '/hod/history', icon: History, label: 'Approval History' },
    { to: '/requests/history', icon: History, label: 'Request History' },
    { to: '/delegations', icon: Users, label: 'Delegations' },
    { to: '/fleet-analytics', icon: TrendingUp, label: 'Fleet Analytics' },
    { to: '/employee/travel-ledger', icon: ScrollText, label: 'My Travel Ledger' },
  ],
  'GM-HR': [
    { to: '/gmhr', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/gmhr/approvals', icon: CheckSquare, label: 'Pending Approvals' },
    { to: '/gmhr/history', icon: History, label: 'Approval History' },
    { to: '/requests/history', icon: History, label: 'Request History' },
    { to: '/delegations', icon: Users, label: 'Delegations' },
    { to: '/fleet-analytics', icon: TrendingUp, label: 'Fleet Analytics' },
    { to: '/employee/travel-ledger', icon: ScrollText, label: 'My Travel Ledger' },
  ],
  COO: [
    { to: '/coo', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/coo/approvals', icon: CheckSquare, label: 'Pending Approvals' },
    { to: '/coo/history', icon: History, label: 'Approval History' },
    { to: '/requests/history', icon: History, label: 'Request History' },
    { to: '/delegations', icon: Users, label: 'Delegations' },
    { to: '/fleet-analytics', icon: TrendingUp, label: 'Fleet Analytics' },
    { to: '/employee/travel-ledger', icon: ScrollText, label: 'My Travel Ledger' },
  ],
  Garage: [
    { to: '/garage', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/garage/fleet-operations', icon: Truck, label: 'Fleet Operations' },
    { to: '/garage/history', icon: ScrollText, label: 'Vehicle History' },
    { to: '/garage/drivers', icon: Users, label: 'Driver Management' },
    { to: '/garage/maintenance', icon: CheckSquare, label: 'Maintenance' },
    { to: '/garage/fuel', icon: FileText, label: 'Fuel Logs' },
    { to: '/delegations', icon: Users, label: 'Delegations' },
    { to: '/employee/travel-ledger', icon: ScrollText, label: 'My Travel Ledger' },
  ],
  Admin: [
    { to: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/admin/analytics', icon: TrendingUp, label: 'Analytics & Reports' },
    { to: '/fleet-analytics', icon: TrendingUp, label: 'Fleet Analytics' },
    { to: '/admin/billing', icon: ScrollText, label: 'Billing Management' },
    { to: '/admin/payments', icon: ScrollText, label: 'Payment Tracking' },
    { to: '/admin/employees', icon: Users, label: 'Manage Employees' },
    { to: '/admin/drivers', icon: Users, label: 'Driver Management' },
    { to: '/admin/vehicles', icon: Truck, label: 'Vehicle Management' },
    { to: '/garage', icon: LayoutDashboard, label: 'Garage Dispatch' },
    { to: '/garage/fleet-operations', icon: Truck, label: 'Fleet Operations' },
    { to: '/garage/maintenance', icon: CheckSquare, label: 'Maintenance' },
    { to: '/garage/fuel', icon: FileText, label: 'Fuel Logs' },
    { to: '/security/gate', icon: Shield, label: 'Gate Operations' },
    { to: '/requests/history', icon: History, label: 'All Request History' },
    { to: '/admin/audit-logs', icon: ScrollText, label: 'Audit Logs' },
    { to: '/delegations', icon: Users, label: 'Delegations' },
    { to: '/employee/travel-ledger', icon: ScrollText, label: 'My Travel Ledger' },
  ],
  'Security Guard': [
    { to: '/security/gate', icon: Shield, label: 'Gate Operations' },
  ],
};

const roleBadgeColors = {
  Employee: 'bg-primary-100 text-primary-700',
  HOD:      'bg-warning-50 text-warning-600',
  'GM-HR':  'bg-indigo-50 text-indigo-700',
  COO:      'bg-success-50 text-success-700',
  Garage:   'bg-info-50 text-primary-700',
  Admin:    'bg-danger-50 text-danger-700',
  'Security Guard': 'bg-slate-100 text-slate-700',
};

const getPopupStyles = (notif) => {
  if (!notif) return {};
  const type = (notif.type || '').toLowerCase();
  const title = (notif.title || '').toLowerCase();
  const msg = (notif.message || '').toLowerCase();

  if (type === 'approval' || title.includes('approval') || msg.includes('approval') || title.includes('pending')) {
    return {
      bg: 'bg-amber-50/95 border-amber-200/60 text-amber-800 border-l-warning-500',
      iconBg: 'bg-amber-100 text-amber-600',
      progressBarBg: 'bg-warning-500',
      badge: 'Approval'
    };
  }
  if (type === 'request' || title.includes('approved') || msg.includes('approved') || title.includes('success')) {
    return {
      bg: 'bg-emerald-50/95 border-emerald-200/60 text-emerald-800 border-l-success-500',
      iconBg: 'bg-emerald-100 text-emerald-600',
      progressBarBg: 'bg-success-500',
      badge: 'Approved'
    };
  }
  if (type === 'vehicle_assigned' || type === 'vehicle_reassigned' || title.includes('assigned') || title.includes('reassigned') || msg.includes('assigned') || msg.includes('driver')) {
    return {
      bg: 'bg-blue-50/95 border-blue-200/60 text-blue-800 border-l-info-500',
      iconBg: 'bg-blue-100 text-blue-600',
      progressBarBg: 'bg-info-500',
      badge: 'Trip Update'
    };
  }
  return {
    bg: 'bg-slate-50/95 border-slate-200/60 text-slate-800 border-l-primary-500',
    iconBg: 'bg-slate-100 text-slate-600',
    progressBarBg: 'bg-primary-500',
    badge: 'System'
  };
};

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 1024);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [newNotificationPopup, setNewNotificationPopup] = useState(null);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [searchOpen, setSearchOpen] = useState(false);

  // States for dimming the in-app refresh button after 5 seconds of inactivity
  const [isRefreshDimmed, setIsRefreshDimmed] = useState(false);
  const [isRefreshHovered, setIsRefreshHovered] = useState(false);

  useEffect(() => {
    if (isRefreshHovered) {
      setIsRefreshDimmed(false);
      return;
    }

    const timer = setTimeout(() => {
      setIsRefreshDimmed(true);
    }, 5000);

    return () => clearTimeout(timer);
  }, [isRefreshHovered]);

  const userRoles = user?.effectiveRoles || (user?.role ? [user.role] : []);
  const navItems = [];
  const addedPaths = new Set();
  
  for (const r of userRoles) {
    const items = roleNavConfig[r] || [];
    for (const item of items) {
      if (!addedPaths.has(item.to)) {
        addedPaths.add(item.to);
        navItems.push(item);
      }
    }
  }

  // Search logic
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (searchQuery.length >= 2) {
        try {
          const { data } = await api.get(`/search?q=${searchQuery}`);
          setSearchResults(data.data);
          setSearchOpen(true);
        } catch (err) { console.error(err); }
      } else {
        setSearchResults(null);
        setSearchOpen(false);
      }
    }, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      const { data } = await api.get('/notifications');
      setNotifications(data.data || []);
    } catch (err) {
      console.error('Failed to fetch notifications');
    }
  };

  useEffect(() => {
    if (user?.id) {
      fetchNotifications();
      // Setup Socket.IO / SSE
      socket.connect();
      socket.on('notification', (newNotif) => {
        setNotifications((prev) => [newNotif, ...prev]);
        setNewNotificationPopup(newNotif);
      });
      return () => {
        socket.off('notification');
        socket.disconnect();
      };
    }
  }, [user]);

  useEffect(() => {
    if (newNotificationPopup) {
      const timer = setTimeout(() => {
        setNewNotificationPopup(null);
      }, 6000); // Auto close after 6 seconds
      return () => clearTimeout(timer);
    }
  }, [newNotificationPopup]);

  useEffect(() => {
    // Warn user before reloading/unloading normally
    const handleBeforeUnload = (e) => {
      if (sessionStorage.getItem('inAppRefresh') !== 'true') {
        e.preventDefault();
        e.returnValue = 'Warning: If you reload the page normally, you will be redirected to the login page.';
        return e.returnValue;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const handleMarkAsRead = async (id) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: 1 } : n));
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await api.patch(`/notifications/read-all`);
      setNotifications(prev => prev.map(n => ({ ...n, is_read: 1 })));
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar Overlay (mobile) */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 lg:hidden no-print"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside className={`
        fixed inset-y-0 left-0 z-50 bg-primary-900 text-white
        transform transition-all duration-300 ease-in-out
        flex flex-col h-screen lg:static
        ${sidebarOpen ? 'translate-x-0 w-64' : '-translate-x-full w-64 lg:translate-x-0 lg:w-20'}
      `}>
        {/* Logo */}
        <div className={`flex items-center h-16 border-b border-primary-800 shrink-0 ${sidebarOpen ? 'justify-between px-6' : 'justify-center px-0'}`}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg overflow-hidden shrink-0">
              <img src="/logo-icon.png?v=2" alt="VRTP" className="w-full h-full object-cover" />
            </div>
            {sidebarOpen && <span className="text-sm font-bold tracking-wide">VRTP</span>}
          </div>
          <button
            className="lg:hidden p-2 rounded hover:bg-primary-800 transition-colors"
            onClick={() => setSidebarOpen(false)}
          >
            <div className="animated-hamburger open text-white">
              <span></span><span></span><span></span>
            </div>
          </button>
        </div>

        {/* Nav Items */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto sidebar-scrollbar">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === `/${user?.role?.toLowerCase()}`}
              onClick={() => { if(window.innerWidth < 1024) setSidebarOpen(false); }}
              className={({ isActive }) =>
                `flex items-center gap-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200
                ${sidebarOpen ? 'px-3' : 'justify-center px-0'}
                ${isActive
                  ? 'bg-white/15 text-white shadow-sm'
                  : 'text-primary-200 hover:bg-white/10 hover:text-white'}`
              }
              title={!sidebarOpen ? label : ''}
            >
              <Icon className="w-5 h-5 shrink-0" />
              {sidebarOpen && <span className="truncate">{label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* Sidebar Footer */}
        <div className={`p-4 border-t border-primary-800 shrink-0 ${sidebarOpen ? '' : 'flex justify-center'}`}>
          <div className={`flex items-center ${sidebarOpen ? 'gap-3' : 'justify-center'}`}>
            {user?.avatar_url ? (
              <img src={user.avatar_url} alt="" className="w-8 h-8 rounded-full ring-2 ring-primary-700 shrink-0" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-primary-700 flex items-center justify-center text-xs font-semibold shrink-0">
                {user?.full_name?.charAt(0) || '?'}
              </div>
            )}
            {sidebarOpen && (
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate">{user?.full_name}</p>
                <p className="text-[10px] text-primary-300 truncate">{user?.email}</p>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Top Navbar — always visible, never scrolls away */}
        <header className="h-16 bg-white border-b border-border flex items-center justify-between px-4 sm:px-8 z-10 shrink-0 shadow-sm">
          <div className="flex items-center gap-4 flex-1">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-3 -ml-2 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors"
            >
              <div className={`animated-hamburger ${sidebarOpen ? 'open' : ''}`}>
                <span></span><span></span><span></span>
              </div>
            </button>

            {/* Global Search */}
            <div className="relative max-w-md w-full hidden sm:block">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Search requests, vehicles, drivers..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-full text-sm focus:bg-white focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all"
                />
              </div>

              {searchOpen && searchResults && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setSearchOpen(false)} />
                  <div className="absolute top-full left-0 mt-2 w-full max-h-96 overflow-y-auto bg-white rounded-xl border border-border shadow-xl z-50 animate-fade-in p-2 space-y-4">
                    {/* Requests */}
                    {searchResults.requests?.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-slate-500 uppercase px-2 mb-1">Requests</p>
                        {searchResults.requests.map(r => (
                          <Link key={`req-${r.id}`} to={`/requests/${r.id}`} onClick={() => setSearchOpen(false)} className="block px-3 py-2 rounded hover:bg-slate-50 text-sm">
                            <span className="font-medium text-slate-900">#{r.id} {r.destination}</span>
                            <span className="block text-xs text-slate-500">{r.status}</span>
                          </Link>
                        ))}
                      </div>
                    )}
                    {/* Vehicles */}
                    {searchResults.vehicles?.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-slate-500 uppercase px-2 mb-1">Vehicles</p>
                        {searchResults.vehicles.map(v => (
                          <div key={`veh-${v.id}`} className="block px-3 py-2 rounded hover:bg-slate-50 text-sm">
                            <span className="font-medium text-slate-900">{v.registration_no}</span>
                            <span className="block text-xs text-slate-500">{v.make} {v.model}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {/* Drivers */}
                    {searchResults.drivers?.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-slate-500 uppercase px-2 mb-1">Drivers</p>
                        {searchResults.drivers.map(d => (
                          <div key={`drv-${d.id}`} className="block px-3 py-2 rounded hover:bg-slate-50 text-sm">
                            <span className="font-medium text-slate-900">{d.full_name}</span>
                            <span className="block text-xs text-slate-500">EMP: {d.employee_number}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {searchResults.requests?.length === 0 && searchResults.vehicles?.length === 0 && searchResults.drivers?.length === 0 && (
                      <div className="p-4 text-center text-sm text-slate-500">No results found.</div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Company Logo */}
            <img 
              src="/logo.png" 
              alt="CK Birla Group - Orient Paper" 
              className="h-8 md:h-10 object-contain hidden sm:block border-r border-slate-200 pr-4" 
            />

            {/* Role Badge */}
            <span className={`hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${roleBadgeColors[user?.role] || ''}`}>
              <Shield className="w-3 h-3" />
              {user?.role}
            </span>

            {/* Notification Bell */}
            <div className="relative">
              <button
                className="relative p-2 rounded-full hover:bg-slate-100 transition-colors"
                onClick={() => { setNotifOpen(!notifOpen); setProfileOpen(false); }}
              >
                <Bell className="w-5 h-5 text-slate-600" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-danger-500 px-1 text-[9px] font-extrabold text-white border-2 border-white shadow-sm">
                    {unreadCount}
                  </span>
                )}
              </button>

              {newNotificationPopup && !notifOpen && (() => {
                const styles = getPopupStyles(newNotificationPopup);
                return (
                  <div className={`absolute right-0 top-12 w-80 bg-white/95 backdrop-blur-md border ${styles.bg} border-l-4 rounded-r-xl rounded-l-md shadow-[0_10px_30px_rgba(0,0,0,0.15)] overflow-hidden z-50 animate-fade-in`}>
                    <div className="p-4">
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg shrink-0 ${styles.iconBg}`}>
                          <Bell className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start gap-1">
                            <span className="text-[10px] font-bold uppercase tracking-wider opacity-75">
                              {styles.badge}
                            </span>
                            <button
                              onClick={() => setNewNotificationPopup(null)}
                              className="text-slate-400 hover:text-slate-600 hover:bg-slate-100/50 rounded-full p-0.5 transition-all"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <p className="text-sm font-semibold text-slate-900 leading-tight mt-0.5">
                            {newNotificationPopup.title}
                          </p>
                          <p className="text-xs text-slate-600 mt-1 line-clamp-2">
                            {newNotificationPopup.message}
                          </p>
                        </div>
                      </div>
                    </div>
                    {/* Shrinking progress bar */}
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-100/50">
                      <div className={`h-full ${styles.progressBarBg} animate-progress-shrink`} />
                    </div>
                  </div>
                );
              })()}

              {notifOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setNotifOpen(false)} />
                  <div className="absolute right-0 mt-2 w-80 max-h-96 overflow-y-auto bg-surface rounded-xl border border-border shadow-xl z-50 animate-fade-in flex flex-col">
                    <div className="p-3 border-b border-border flex justify-between items-center bg-slate-50 rounded-t-xl sticky top-0">
                      <p className="text-sm font-semibold text-slate-800">Notifications</p>
                      {unreadCount > 0 && (
                        <button onClick={handleMarkAllAsRead} className="text-xs text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1">
                          <Check className="w-3 h-3" /> Mark all read
                        </button>
                      )}
                    </div>
                    <div className="flex-1 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="p-6 text-center text-sm text-slate-500">No notifications yet.</div>
                      ) : (
                        <div className="divide-y divide-border">
                          {notifications.map(n => (
                            <div key={n.id} className={`p-3 transition-colors ${n.is_read ? 'bg-white' : 'bg-primary-50/30'}`}>
                              <div className="flex justify-between items-start gap-2">
                                <p className={`text-sm ${n.is_read ? 'text-slate-700' : 'text-slate-900 font-medium'}`}>{n.title}</p>
                                {!n.is_read && (
                                  <button onClick={() => handleMarkAsRead(n.id)} className="shrink-0 text-primary-500 hover:text-primary-700" title="Mark as read">
                                    <span className="w-2 h-2 rounded-full bg-primary-500 block"></span>
                                  </button>
                                )}
                              </div>
                              <p className="text-xs text-slate-500 mt-1">{n.message}</p>
                              <p className="text-[10px] text-slate-400 mt-2">{parseDate(n.created_at)?.toLocaleString()}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Profile Dropdown */}
            <div className="relative">
              <button
                className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
                onClick={() => { setProfileOpen(!profileOpen); setNotifOpen(false); }}
              >
                {user?.avatar_url ? (
                  <img src={user.avatar_url} alt="" className="w-8 h-8 rounded-full" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-sm font-semibold">
                    {user?.full_name?.charAt(0) || '?'}
                  </div>
                )}
                <ChevronDown className="w-4 h-4 text-slate-400" />
              </button>

              {profileOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setProfileOpen(false)} />
                  <div className="absolute right-0 mt-2 w-56 bg-surface rounded-xl border border-border shadow-xl z-50 animate-fade-in">
                    <div className="p-3 border-b border-border">
                      <p className="text-sm font-medium text-slate-800">{user?.full_name}</p>
                      <p className="text-xs text-muted truncate">{user?.email}</p>
                    </div>
                    <div className="p-1.5">
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-danger-600 rounded-lg hover:bg-danger-50 transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 lg:p-6 overflow-auto">
          <Outlet />
        </main>
      </div>

      {/* Global Refresh Button */}
      <button
        onClick={() => {
          sessionStorage.setItem('inAppRefresh', 'true');
          window.location.reload();
        }}
        onMouseEnter={() => setIsRefreshHovered(true)}
        onMouseLeave={() => setIsRefreshHovered(false)}
        title="Refresh Data"
        className={`fixed z-50 p-3 bg-primary-600 text-white rounded-full shadow-xl hover:bg-primary-700 hover:scale-105 active:scale-95 bottom-8 right-4 lg:right-8 transition-all duration-300 ${
          isRefreshDimmed ? 'opacity-50' : 'opacity-100'
        }`}
      >
        <RefreshCw className="w-5 h-5" />
      </button>
    </div>
  );
}
