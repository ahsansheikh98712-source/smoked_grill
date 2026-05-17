'use client';

import Link from 'next/link';
import { useState, useEffect, useRef, useCallback } from 'react';
import { Menu, X, Flame, User, LogOut, ChefHat, Bell, Search } from 'lucide-react';
import { useSession, signOut } from 'next-auth/react';

interface Notification {
  id: string;
  type: string;
  message: string;
  link?: string | null;
  read: boolean;
  actorName?: string | null;
  createdAt: string;
}

export default function Navigation() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const { data: session, status } = useSession();

  useEffect(() => {
    if (!session?.user) return;
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, [session]);

  const fetchNotifications = async () => {
    try {
      const res = await fetch('/api/notifications');
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications);
        setUnreadCount(data.unreadCount);
      }
    } catch {}
  };

  const markAllRead = async () => {
    await fetch('/api/notifications', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) });
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  const markRead = async (id: string) => {
    await fetch('/api/notifications', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const handleSignOut = async () => {
    setIsDropdownOpen(false);
    await signOut({ callbackUrl: '/' });
  };

  const handleSearch = useCallback(async (q: string) => {
    setSearchQuery(q);
    if (q.trim().length < 2) { setSearchResults([]); return; }
    setIsSearching(true);
    try {
      const res = await fetch(`/api/users/search?q=${encodeURIComponent(q)}`);
      if (res.ok) {
        const data = await res.json();
        setSearchResults(data.users || []);
      }
    } catch {}
    setIsSearching(false);
  }, []);

  const baseNavItems = [
    { href: '/', label: 'Home' },
    { href: '/recipes', label: 'Recipes' },
    { href: '/community', label: 'Que-Munity' },
    { href: '/tools', label: 'BBQ Tools' },
    { href: '/guides', label: 'Guides' },
    { href: '/subscription', label: 'Premium' },
  ];

  const authNavItems = status === 'unauthenticated'
    ? [{ href: '/auth/signin', label: 'Sign In / Sign Up' }]
    : [];

  const navItems = [...baseNavItems, ...authNavItems];

  // Get user display name
  const getUserName = () => {
    if (!session?.user) return null;
    return session.user.name || session.user.username || session.user.email?.split('@')[0];
  };

  const getInitials = () => {
    if (!session?.user) return 'U';
    const name = getUserName();
    return name ? name.charAt(0).toUpperCase() : 'U';
  };

  return (
    <nav className="bg-slate-900 text-white shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <Flame className="h-8 w-8 text-orange-500" />
            <span className="text-xl font-bold text-orange-400">Que-Munity</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="px-3 py-2 rounded-md transition-colors text-orange-400 hover:text-orange-300 hover:bg-slate-800 text-sm"
              >
                {item.label}
              </Link>
            ))}

            {/* User Search */}
            <div className="relative" ref={searchRef}>
              <div className="flex items-center bg-slate-800 rounded-lg px-3 py-1.5 gap-2">
                <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <input
                  type="text"
                  placeholder="Search users..."
                  value={searchQuery}
                  onChange={e => handleSearch(e.target.value)}
                  className="bg-transparent text-white text-sm placeholder-gray-400 focus:outline-none w-36"
                />
              </div>
              {(searchResults.length > 0 || (isSearching && searchQuery.length >= 2)) && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => { setSearchQuery(''); setSearchResults([]); }} />
                  <div className="absolute top-full right-0 mt-1 w-64 bg-white rounded-xl shadow-xl border border-gray-200 z-20 overflow-hidden">
                    {isSearching ? (
                      <div className="px-4 py-3 text-sm text-gray-500">Searching...</div>
                    ) : searchResults.length === 0 ? (
                      <div className="px-4 py-3 text-sm text-gray-500">No users found</div>
                    ) : (
                      searchResults.map((u: any) => (
                        <Link
                          key={u.id}
                          href={`/profile/${u.username}`}
                          onClick={() => { setSearchQuery(''); setSearchResults([]); }}
                          className="flex items-center gap-3 px-4 py-3 hover:bg-orange-50 transition-colors border-b border-gray-50 last:border-0"
                        >
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                            {u.image ? <img src={u.image} alt={u.username} className="w-full h-full rounded-full object-cover" /> : (u.displayName || u.username).charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <div className="text-sm font-semibold text-gray-900 truncate">{u.displayName || u.username}</div>
                            <div className="text-xs text-gray-500">@{u.username} · {u._count?.recipes ?? 0} recipes</div>
                          </div>
                        </Link>
                      ))
                    )}
                  </div>
                </>
              )}
            </div>
            
            {/* Notification Bell */}
            {session && status === 'authenticated' && (
              <div className="relative" ref={notifRef}>
                <button
                  onClick={() => { setIsNotifOpen(!isNotifOpen); if (!isNotifOpen && unreadCount > 0) markAllRead(); }}
                  className="relative p-2 text-orange-400 hover:text-orange-300"
                  aria-label="Notifications"
                >
                  <Bell className="w-6 h-6" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>

                {isNotifOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setIsNotifOpen(false)} />
                    <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-200 z-20 overflow-hidden">
                      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                        <h3 className="font-semibold text-gray-900">Notifications</h3>
                        {notifications.some(n => !n.read) && (
                          <button onClick={markAllRead} className="text-xs text-orange-600 hover:text-orange-700 font-medium">
                            Mark all read
                          </button>
                        )}
                      </div>
                      <div className="max-h-96 overflow-y-auto divide-y divide-gray-50">
                        {notifications.length === 0 ? (
                          <div className="px-4 py-8 text-center text-gray-400 text-sm">No notifications yet</div>
                        ) : notifications.map(n => (
                          <div
                            key={n.id}
                            className={`px-4 py-3 hover:bg-gray-50 transition-colors ${!n.read ? 'bg-orange-50' : ''}`}
                          >
                            {n.link ? (
                              <Link href={n.link} onClick={() => { markRead(n.id); setIsNotifOpen(false); }} className="block">
                                <p className="text-sm text-gray-800">{n.message}</p>
                                <p className="text-xs text-gray-400 mt-0.5">{new Date(n.createdAt).toLocaleDateString()}</p>
                              </Link>
                            ) : (
                              <div onClick={() => markRead(n.id)} className="cursor-default">
                                <p className="text-sm text-gray-800">{n.message}</p>
                                <p className="text-xs text-gray-400 mt-0.5">{new Date(n.createdAt).toLocaleDateString()}</p>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* User Menu */}
            {session && status === 'authenticated' && (
              <div className="relative">
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center space-x-2 text-orange-400 hover:text-orange-300 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 focus:ring-offset-slate-900 rounded-lg p-2"
                >
                  {session.user.image ? (
                    <img
                      className="w-8 h-8 rounded-full border-2 border-orange-500"
                      src={session.user.image}
                      alt={getUserName() || 'User'}
                    />
                  ) : (
                    <div className="w-8 h-8 bg-orange-600 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-semibold">
                        {getInitials()}
                      </span>
                    </div>
                  )}
                  <span className="font-medium">
                    {getUserName()}
                  </span>
                </button>

                {isDropdownOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setIsDropdownOpen(false)}
                    />
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-20">
                      <div className="py-2">
                        <div className="px-4 py-2 border-b border-gray-100">
                          <p className="text-sm font-medium text-gray-900">
                            {getUserName()}
                          </p>
                          <p className="text-sm text-gray-500">{session.user.email}</p>
                        </div>

                        <Link
                          href="/recipes/create"
                          className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                          onClick={() => setIsDropdownOpen(false)}
                        >
                          <ChefHat className="w-4 h-4 mr-3" />
                          Create Recipe
                        </Link>

                        <Link
                          href="/creator"
                          className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                          onClick={() => setIsDropdownOpen(false)}
                        >
                          <svg className="w-4 h-4 mr-3" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z"/>
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.51-1.31c-.562-.649-1.413-1.076-2.353-1.253V5z" clipRule="evenodd"/>
                          </svg>
                          Creator Dashboard
                        </Link>

                        <Link
                          href="/profile"
                          className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                          onClick={() => setIsDropdownOpen(false)}
                        >
                          <User className="w-4 h-4 mr-3" />
                          My Profile
                        </Link>

                        <button
                          onClick={handleSignOut}
                          className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 border-t border-gray-100"
                        >
                          <LogOut className="w-4 h-4 mr-3" />
                          Sign Out
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Loading state */}
            {status === 'loading' && (
              <div className="animate-pulse">
                <div className="w-8 h-8 bg-slate-700 rounded-full"></div>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-orange-400 hover:text-orange-300 p-2"
            >
              {isMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 border-t border-slate-800">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="block px-3 py-2 rounded-md transition-colors text-orange-400 hover:text-orange-300 hover:bg-slate-800"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
              
              {/* Mobile User Menu */}
              {session && status === 'authenticated' && (
                <>
                  <div className="border-t border-slate-700 pt-2 mt-2">
                    <div className="px-3 py-2 text-orange-300 text-sm font-medium">
                      {getUserName()}
                    </div>
                    <div className="px-3 py-1 text-orange-400/70 text-xs">
                      {session.user.email}
                    </div>
                    <Link
                      href="/recipes/create"
                      className="block px-3 py-2 rounded-md transition-colors text-orange-400 hover:text-orange-300 hover:bg-slate-800"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Create Recipe
                    </Link>
                    <Link
                      href="/creator"
                      className="block px-3 py-2 rounded-md transition-colors text-orange-400 hover:text-orange-300 hover:bg-slate-800"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Creator Dashboard
                    </Link>
                    <Link
                      href="/profile"
                      className="block px-3 py-2 rounded-md transition-colors text-orange-400 hover:text-orange-300 hover:bg-slate-800"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      My Profile
                    </Link>
                    <button
                      onClick={() => {
                        handleSignOut();
                        setIsMenuOpen(false);
                      }}
                      className="block w-full text-left px-3 py-2 rounded-md transition-colors text-red-400 hover:text-red-300 hover:bg-slate-800"
                    >
                      Sign Out
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
