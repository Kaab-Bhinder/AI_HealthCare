"use client"
import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Search, MessageCircle, ShieldAlert } from 'lucide-react'
import { Blob, Leaf } from '../../components/Organic'
import ChatWorkspace from '../../components/ChatWorkspace'
import MatchFlow from '../../components/MatchFlow'

export default function Consult() {
  const [tab, setTab] = useState('match') // match | chat

  return (
    <div className="relative min-h-screen overflow-hidden">
      <Blob className="absolute -top-28 -right-28 w-[30rem] h-[30rem] text-brand-200/40 dark:text-brand-500/10" />
      <Blob className="absolute top-52 -left-40 w-96 h-96 text-coral-200/30 dark:text-coral-500/10" />
      <Leaf className="absolute top-24 right-[10%] w-12 text-brand-300/40 rotate-12 hidden lg:block" />

      <div className={`relative mx-auto px-6 py-8 transition-all ${tab === 'chat' ? 'max-w-6xl' : 'max-w-3xl'}`}>
        <div className="flex items-center justify-between">
          <Link href="/" className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-500 hover:text-brand-600 transition-colors">
            <ArrowLeft className="h-4 w-4" /> Back home
          </Link>

          {/* Tabs */}
          <div className="rounded-full bg-cream-100 dark:bg-white/5 border border-cream-300 dark:border-white/10 p-1 flex">
            <TabButton active={tab === 'match'} onClick={() => setTab('match')} icon={Search} label="Find a doctor" />
            <TabButton active={tab === 'chat'} onClick={() => setTab('chat')} icon={MessageCircle} label="Assistant" />
          </div>
        </div>

        {tab === 'match' && (
          <div className="mt-6 text-center">
            <h1 className="font-display text-3xl sm:text-4xl font-semibold tracking-tight text-ink-900 dark:text-white">How can we help today?</h1>
            <p className="mt-2 text-ink-500 dark:text-ink-400">Describe your symptoms and we&apos;ll match you to the right doctor.</p>
          </div>
        )}

        <div className="mt-6">
          {tab === 'match' ? <MatchFlow /> : <ChatWorkspace />}
        </div>

        <p className="mt-6 flex items-center justify-center gap-2 text-xs text-ink-400">
          <ShieldAlert className="h-3.5 w-3.5" /> Guidance only — not a substitute for professional medical care.
        </p>
      </div>
    </div>
  )
}

function TabButton({ active, onClick, icon: Icon, label }) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-all ${active ? 'bg-white dark:bg-ink-900 text-brand-700 dark:text-brand-300 shadow-soft' : 'text-ink-500 dark:text-ink-400 hover:text-ink-700'}`}
    >
      <Icon className="h-4 w-4" /> {label}
    </button>
  )
}
