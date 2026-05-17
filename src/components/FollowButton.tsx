'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface FollowButtonProps {
  userId: string;
  initialIsFollowing?: boolean;
  size?: 'sm' | 'md';
  className?: string;
}

export function FollowButton({ userId, initialIsFollowing, size = 'md', className = '' }: FollowButtonProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing ?? false);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(initialIsFollowing === undefined);

  useEffect(() => {
    if (initialIsFollowing !== undefined) return;
    if (status === 'authenticated' && session?.user?.id) {
      fetch(`/api/users/${userId}/follow`)
        .then(r => r.ok ? r.json() : null)
        .then(data => { if (data) setIsFollowing(data.isFollowing); })
        .finally(() => setChecking(false));
    } else if (status !== 'loading') {
      setChecking(false);
    }
  }, [userId, session, status, initialIsFollowing]);

  if (session?.user?.id === userId) return null;

  const handleToggle = async () => {
    if (status !== 'authenticated') {
      router.push('/auth/signin');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/users/${userId}/follow`, {
        method: isFollowing ? 'DELETE' : 'POST',
      });
      if (res.ok) setIsFollowing(f => !f);
    } catch {}
    setLoading(false);
  };

  const sizeClass = size === 'sm' ? 'px-3 py-1 text-xs' : 'px-6 py-2 text-sm';

  if (checking) {
    return (
      <button disabled className={`${sizeClass} rounded-lg font-medium bg-gray-200 text-gray-500 ${className}`}>
        ...
      </button>
    );
  }

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      className={`${sizeClass} rounded-lg font-medium transition-colors disabled:opacity-50 ${
        isFollowing
          ? 'bg-gray-100 text-gray-700 hover:bg-red-50 hover:text-red-600 border border-gray-200'
          : 'bg-orange-500 text-white hover:bg-orange-600'
      } ${className}`}
    >
      {loading ? '...' : isFollowing ? 'Following' : 'Follow'}
    </button>
  );
}

export default FollowButton;
