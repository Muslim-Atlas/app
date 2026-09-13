/**
 * Script to deploy the Unsubscribe page, action, and email link updates to muslim-atlas-website
 */

const fs = require('fs');
const path = require('path');

const websiteRoot = path.resolve(__dirname, '../../muslim-atlas-website');

if (!fs.existsSync(websiteRoot)) {
  console.error('❌ muslim-atlas-website not found at:', websiteRoot);
  process.exit(1);
}

// 1. Create app/actions/unsubscribeWaitlist.ts
const actionContent = `'use server';

import { Resend } from 'resend';
import fs from 'fs';
import path from 'path';

const resend = new Resend(process.env.RESEND_API_KEY);
const AUDIENCE_ID = process.env.RESEND_AUDIENCE_ID || '164f141d-a403-4ab5-ab92-1f32e58d7777';
const TO_ADDRESS = process.env.WAITLIST_EMAIL_TO || 'hello@muslimatlas.app';

export async function unsubscribeWaitlist(email: string) {
  if (!email || !email.includes('@')) {
    return { error: 'Please enter a valid email address.' };
  }

  const cleanEmail = email.trim().toLowerCase();

  try {
    // 1. Remove contact from Resend Audience
    try {
      await resend.contacts.remove({
        email: cleanEmail,
        audienceId: AUDIENCE_ID,
      });
    } catch (contactErr) {
      console.warn('Resend contact remove notice:', contactErr);
    }

    // 2. Persist to local unsubscribed archive
    const dataDir = path.resolve(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    const unsubPath = path.join(dataDir, 'unsubscribed.json');
    let unsubscribedList: string[] = [];
    if (fs.existsSync(unsubPath)) {
      try {
        unsubscribedList = JSON.parse(fs.readFileSync(unsubPath, 'utf8'));
      } catch (e) {
        unsubscribedList = [];
      }
    }
    if (!unsubscribedList.includes(cleanEmail)) {
      unsubscribedList.push(cleanEmail);
      fs.writeFileSync(unsubPath, JSON.stringify(unsubscribedList, null, 2), 'utf8');
    }

    // 3. Notify owner
    await resend.emails.send({
      from: 'Muslim Atlas <noreply@notifications.yqwebstudio.com>',
      to: TO_ADDRESS,
      subject: \`Waitlist Unsubscribe: \${cleanEmail}\`,
      html: \`
        <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 24px; border: 1px solid #e1e1e1; border-radius: 12px;">
          <h2 style="color: #64748b; margin-top: 0;">Waitlist Unsubscribe Request</h2>
          <p><strong>Email:</strong> \${cleanEmail}</p>
          <p style="font-size: 13px; color: #666;">This user unsubscribed from the Muslim Atlas waitlist and will no longer receive release emails.</p>
        </div>
      \`,
    }).catch(console.warn);

    return { success: true };
  } catch (err: unknown) {
    console.error('Unsubscribe action error:', err);
    return { error: 'Failed to process unsubscribe request. Please try again later.' };
  }
}
`;

const actionPath = path.join(websiteRoot, 'app/actions/unsubscribeWaitlist.ts');
fs.writeFileSync(actionPath, actionContent, 'utf8');
console.log('✅ Created app/actions/unsubscribeWaitlist.ts');

// 2. Create app/unsubscribe/page.tsx
const unsubscribeDir = path.join(websiteRoot, 'app/unsubscribe');
if (!fs.existsSync(unsubscribeDir)) {
  fs.mkdirSync(unsubscribeDir, { recursive: true });
}

const pageContent = `'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import { ArrowLeft, MailX, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { unsubscribeWaitlist } from '../actions/unsubscribeWaitlist';

function UnsubscribeContent() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const emailParam = searchParams.get('email');
    if (emailParam) {
      setEmail(emailParam);
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      setStatus('error');
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    setStatus('loading');
    setErrorMessage('');

    try {
      const res = await unsubscribeWaitlist(email);
      if (res.error) {
        setStatus('error');
        setErrorMessage(res.error);
      } else {
        setStatus('success');
      }
    } catch (err) {
      setStatus('error');
      setErrorMessage('An unexpected error occurred. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#eaf5eb] to-[#cce3d0] text-[#1a382d] font-sans antialiased py-12 px-6 flex items-center justify-center">
      <div className="w-full max-w-xl bg-white/80 backdrop-blur-md rounded-3xl border border-emerald-500/10 shadow-xl p-8 md:p-12 relative overflow-hidden">
        
        {/* Header bar */}
        <div className="flex items-center justify-between pb-6 border-b border-black/5 mb-8">
          <Link href="/" className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-800 hover:text-emerald-950 transition-colors group">
            <ArrowLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" />
            Back to Home
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full overflow-hidden border border-zinc-200 shadow-sm">
              <Image
                src="/logo.png"
                alt="Muslim Atlas logo"
                width={24}
                height={24}
                className="w-full h-full object-cover"
              />
            </div>
            <span className="text-emerald-950 font-unbounded font-semibold text-xs tracking-tight">
              Muslim Atlas
            </span>
          </div>
        </div>

        {status === 'success' ? (
          <div className="flex flex-col items-center text-center py-6">
            <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mb-6">
              <CheckCircle size={32} />
            </div>
            <h1 className="text-2xl font-bold text-emerald-950 font-unbounded mb-3">
              Unsubscribed
            </h1>
            <p className="text-sm text-emerald-800/80 leading-relaxed mb-6 max-w-sm">
              <strong className="text-emerald-950">{email}</strong> has been successfully removed from our waitlist. You will not receive any further launch updates or emails.
            </p>
            <p className="text-xs text-emerald-800/60 mb-8">
              Changed your mind? You can rejoin anytime by visiting the home page.
            </p>
            <Link
              href="/"
              className="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-medium text-sm transition-colors shadow-sm"
            >
              Return to Muslim Atlas
            </Link>
          </div>
        ) : (
          <div>
            {/* Title */}
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 flex items-center justify-center text-rose-600">
                <MailX size={24} />
              </div>
              <div>
                <h1 className="text-xl md:text-2xl font-bold text-emerald-950 font-unbounded">
                  Unsubscribe
                </h1>
                <p className="text-xs text-emerald-800/70 mt-0.5">
                  Manage your Muslim Atlas waitlist subscription
                </p>
              </div>
            </div>

            <p className="text-sm text-emerald-900/80 mb-6 leading-relaxed">
              If you no longer wish to receive launch updates, new version releases, or invitations for Muslim Atlas, enter your email below to unsubscribe.
            </p>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div>
                <label htmlFor="email" className="block text-xs font-semibold text-emerald-950 mb-1.5 uppercase tracking-wider">
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full px-4 py-3 rounded-xl border border-emerald-900/20 bg-white/90 text-emerald-950 placeholder:text-emerald-900/40 focus:outline-none focus:ring-2 focus:ring-emerald-600 text-sm"
                  disabled={status === 'loading'}
                />
              </div>

              {status === 'error' && (
                <div className="flex items-center gap-2 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700">
                  <AlertCircle size={14} className="shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={status === 'loading'}
                className="w-full py-3.5 px-6 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-semibold text-sm transition-all shadow-sm flex items-center justify-center gap-2"
              >
                {status === 'loading' ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Unsubscribing...
                  </>
                ) : (
                  'Unsubscribe from Waitlist'
                )}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

export default function UnsubscribePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#eaf5eb] flex items-center justify-center">Loading...</div>}>
      <UnsubscribeContent />
    </Suspense>
  );
}
`;

const pagePath = path.join(unsubscribeDir, 'page.tsx');
fs.writeFileSync(pagePath, pageContent, 'utf8');
console.log('✅ Created app/unsubscribe/page.tsx');

// 3. Update app/actions/sendWaitlistEmail.ts to include unsubscribe link in signup confirmation email
const sendWaitlistPath = path.join(websiteRoot, 'app/actions/sendWaitlistEmail.ts');
if (fs.existsSync(sendWaitlistPath)) {
  let content = fs.readFileSync(sendWaitlistPath, 'utf8');
  
  // Add unsubscribe note to confirmation email if not already present
  if (!content.includes('unsubscribe')) {
    content = content.replace(
      '- The Muslim Atlas Team',
      `- The Muslim Atlas Team<br /><br /><span style="font-size: 11px; color: #475569;">No longer want these updates? <a href="https://muslimatlas.app/unsubscribe?email=\${encodeURIComponent(safeEmail)}" style="color: #64748b; text-decoration: underline;">Unsubscribe</a></span>`
    );
    fs.writeFileSync(sendWaitlistPath, content, 'utf8');
    console.log('✅ Updated app/actions/sendWaitlistEmail.ts with unsubscribe link');
  }
}

console.log('🎉 Unsubscribe feature setup complete!');
