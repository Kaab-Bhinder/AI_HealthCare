"use client"
import { useState } from 'react'
import SmartImage from './SmartImage'

const HERO_IMG = 'https://images.unsplash.com/photo-1505118380757-91f5f5632de0?w=1600&q=70&auto=format&fit=crop'
const BG_IMG = 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1600&q=60&auto=format&fit=crop'

/** Torn-paper vertical edge (the signature detail from the reference design). */
function TornEdge({ className = '' }) {
  return (
    <svg viewBox="0 0 40 800" preserveAspectRatio="none" aria-hidden="true" className={className} fill="currentColor">
      <path d="M0,0 L26,0 L14,26 L30,58 L10,92 L27,128 L8,166 L24,204 L6,244 L28,286 L12,330 L31,372 L9,416 L25,458 L7,500 L23,542 L5,584 L27,628 L11,672 L29,716 L13,758 L26,800 L0,800 Z" />
    </svg>
  )
}

/**
 * Split auth card inspired by the user's reference: white form panel on the
 * left, torn-paper edge into a full-bleed calm image with big display text.
 */
export default function AuthShell({ heading, tagline, sideTitle, sideSub, children, below }) {
  return (
    <div className="relative min-h-[calc(100vh-4rem)] overflow-hidden flex items-center justify-center px-4 py-10">
      {/* Full-page photo backdrop with deep teal overlay */}
      <div className="absolute inset-0 -z-10">
        <SmartImage src={BG_IMG} eager className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-br from-brand-900/85 via-brand-800/75 to-ink-950/85" />
      </div>

      {/* Floating split card */}
      <div className="w-full max-w-4xl rounded-[2rem] overflow-hidden shadow-2xl grid lg:grid-cols-[1fr_1.05fr] bg-white dark:bg-ink-900 animate-fade-up">
        {/* Form panel */}
        <div className="p-8 sm:p-12 flex flex-col justify-center">
          <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-wide text-ink-900 dark:text-white uppercase">{heading}</h1>
          {tagline && <p className="mt-2 text-sm text-ink-500 dark:text-ink-400">{tagline}</p>}
          <div className="mt-8">{children}</div>
          {below && <div className="mt-6">{below}</div>}
        </div>

        {/* Image panel with torn edge */}
        <div className="relative hidden lg:block min-h-[560px]">
          <SmartImage src={HERO_IMG} eager className="absolute inset-0 h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-brand-900/70 via-transparent to-brand-900/20" />
          <TornEdge className="absolute left-0 top-0 h-full w-10 text-white dark:text-ink-900" />
          <div className="absolute bottom-10 right-10 left-16 text-right">
            <p className="font-display text-4xl xl:text-5xl font-bold text-white leading-tight drop-shadow-lg uppercase tracking-wide">{sideTitle}</p>
            <p className="mt-2 text-white/85 font-medium tracking-[0.25em] uppercase text-sm drop-shadow">{sideSub}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

/** Pill input with a leading icon on a mint-tinted track (reference style). */
export function PillInput({ icon: Icon, className = '', ...props }) {
  return (
    <div className={`relative ${className}`}>
      <Icon className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-brand-600/70 dark:text-brand-300/70" />
      <input
        {...props}
        className="w-full rounded-full bg-brand-100/70 dark:bg-brand-500/15 border border-transparent text-ink-800 dark:text-ink-100 pl-11 pr-5 py-3.5 text-sm focus:outline-none focus:bg-white dark:focus:bg-ink-950 focus:border-brand-400 focus:ring-4 focus:ring-brand-500/15 placeholder-ink-500/60 dark:placeholder-ink-400 transition-all"
      />
    </div>
  )
}

/** Google sign-in button — UI ready; flow activates once OAuth is configured. */
export function GoogleButton() {
  const [note, setNote] = useState(false)
  return (
    <div>
      <button
        type="button"
        onClick={() => setNote(true)}
        className="w-full inline-flex items-center justify-center gap-3 rounded-full border border-cream-300 dark:border-white/15 bg-white dark:bg-white/5 py-3 text-sm font-semibold text-ink-700 dark:text-ink-200 hover:border-brand-300 hover:shadow-soft transition-all"
      >
        <svg className="h-4.5 w-4.5" width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
          <path fill="#FFC107" d="M43.6 20.1H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.1 8 3l5.7-5.7C34.3 6.1 29.4 4 24 4 13 4 4 13 4 24s9 20 20 20 20-9 20-20c0-1.3-.1-2.6-.4-3.9z"/>
          <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.1 8 3l5.7-5.7C34.3 6.1 29.4 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/>
          <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/>
          <path fill="#1976D2" d="M43.6 20.1H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C36.9 39.2 44 34 44 24c0-1.3-.1-2.6-.4-3.9z"/>
        </svg>
        Continue with Google
      </button>
      {note && (
        <p className="mt-2 text-center text-xs text-ink-400">
          Google sign-in is being enabled — please use email for now.
        </p>
      )}
    </div>
  )
}

export function OrDivider() {
  return (
    <div className="flex items-center gap-3 my-5">
      <span className="h-px flex-1 bg-cream-300 dark:bg-white/10" />
      <span className="text-[11px] font-medium uppercase tracking-wider text-ink-400">or</span>
      <span className="h-px flex-1 bg-cream-300 dark:bg-white/10" />
    </div>
  )
}
