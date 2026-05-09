'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Flame, Crown, Star, MessageSquare, X, Send, CheckCircle } from 'lucide-react';

function FeedbackModal({ onClose }: { onClose: () => void }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!name.trim() || !email.trim() || !message.trim()) {
      setError('Please fill in all fields');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, message }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? 'Something went wrong');
        return;
      }

      setSubmitted(true);
    } catch {
      setError('Failed to send. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-t-2xl px-6 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              <h2 className="text-xl font-bold">Share Your Thoughts</h2>
            </div>
            <button onClick={onClose} className="text-white/80 hover:text-white transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
          <p className="text-orange-100 text-sm mt-1">Help us build the perfect BBQ community</p>
        </div>

        <div className="px-6 py-5">
          {submitted ? (
            <div className="text-center py-6">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">Thank You!</h3>
              <p className="text-gray-600 mb-6">
                Your feedback means the world to us. We&apos;ll use it to make Que-Munity even better!
              </p>
              <button
                onClick={onClose}
                className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2.5 rounded-lg font-medium transition-colors"
              >
                Back to Home
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Your Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="John Smith"
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="john@example.com"
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">How do you feel about our site?</label>
                <textarea
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  placeholder="Tell us what you love, what could be better, or what features you'd like to see..."
                  rows={4}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm resize-none"
                />
              </div>

              {error && <p className="text-red-500 text-sm">{error}</p>}

              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-colors"
              >
                {submitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Send Feedback
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function SubscriptionPage() {
  const [showFeedback, setShowFeedback] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      {showFeedback && <FeedbackModal onClose={() => setShowFeedback(false)} />}

      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <Link href="/">
              <h1 className="text-3xl font-bold text-orange-600">Que-Munity</h1>
            </Link>
            <Link href="/" className="flex items-center text-gray-600 hover:text-gray-900">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        {/* Fire icon */}
        <div className="flex justify-center mb-6">
          <div className="relative">
            <div className="w-24 h-24 bg-gradient-to-br from-orange-400 to-red-600 rounded-full flex items-center justify-center shadow-lg">
              <Flame className="w-12 h-12 text-white" />
            </div>
            <div className="absolute -top-1 -right-1 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center">
              <Star className="w-4 h-4 text-yellow-800 fill-yellow-800" />
            </div>
          </div>
        </div>

        {/* Coming Soon */}
        <div className="mb-4">
          <span className="inline-block bg-orange-100 text-orange-700 text-sm font-semibold px-4 py-1.5 rounded-full uppercase tracking-wide">
            Coming Soon
          </span>
        </div>

        <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
          Premium Features<br />
          <span className="text-orange-500">In the Works 🔥</span>
        </h1>

        <p className="text-lg text-gray-600 mb-8 max-w-xl mx-auto">
          We&apos;re crafting an incredible premium experience for BBQ lovers. Ad-free browsing,
          exclusive recipes, and pro pitmaster tools — all coming very soon.
        </p>

        {/* Feature preview cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
          {[
            { icon: '🚫', title: 'Ad-Free', desc: 'Browse without interruptions' },
            { icon: '👑', title: 'Premium Recipes', desc: 'Exclusive pitmaster secrets' },
            { icon: '📊', title: 'Creator Tools', desc: 'Analytics & monetization' },
          ].map((f) => (
            <div key={f.title} className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="text-3xl mb-2">{f.icon}</div>
              <h3 className="font-semibold text-gray-900 mb-1">{f.title}</h3>
              <p className="text-sm text-gray-500">{f.desc}</p>
            </div>
          ))}
        </div>

        {/* Crown icon */}
        <div className="bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200 rounded-2xl p-8 mb-8">
          <Crown className="w-10 h-10 text-orange-500 mx-auto mb-3" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Be the First to Know</h2>
          <p className="text-gray-600 mb-6">
            Leave us your feedback and we&apos;ll notify you the moment premium launches.
          </p>
          <button
            onClick={() => setShowFeedback(true)}
            className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-3 rounded-xl font-semibold flex items-center gap-2 mx-auto transition-colors"
          >
            <MessageSquare className="w-5 h-5" />
            Share Your Feedback
          </button>
        </div>

        <Link href="/" className="text-gray-500 hover:text-gray-700 text-sm transition-colors">
          ← Explore free features in the meantime
        </Link>
      </div>
    </div>
  );
}
