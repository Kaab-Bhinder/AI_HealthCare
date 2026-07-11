"use client"
import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { Plus, MessageCircle, Trash2, History, LogIn, PanelLeftClose, PanelLeft } from 'lucide-react'
import { useAuth } from '../lib/auth'
import Chat from './Chat'

function newId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

/**
 * ChatGPT-style workspace: a sidebar of the signed-in patient's conversations
 * (resume any, start new, delete) + the chat panel. Guests can still chat —
 * they just see a sign-in hint instead of history.
 */
export default function ChatWorkspace() {
  const { user, apiFetch } = useAuth()
  const isPatient = user?.role === 'patient'
  const [convos, setConvos] = useState([])
  const [activeId, setActiveId] = useState(() => newId())
  const [activeMessages, setActiveMessages] = useState([])
  const [sidebarOpen, setSidebarOpen] = useState(true)

  const refresh = useCallback(() => {
    if (!isPatient) return
    apiFetch('/api/me/chats').then((r) => r.json())
      .then((d) => setConvos(d.conversations || [])).catch(() => {})
  }, [isPatient, apiFetch])

  useEffect(() => { refresh() }, [refresh])

  const openConversation = (c) => {
    setActiveId(c.conversationId)
    setActiveMessages(c.messages || [])
  }

  const startNew = () => {
    setActiveId(newId())
    setActiveMessages([])
  }

  const removeConversation = async (e, c) => {
    e.stopPropagation()
    if (!confirm('Delete this conversation?')) return
    await apiFetch(`/api/me/chats/${c.conversationId}`, { method: 'DELETE' }).catch(() => {})
    if (c.conversationId === activeId) startNew()
    refresh()
  }

  return (
    <div className="flex gap-4 items-stretch">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'w-64' : 'w-0 overflow-hidden'} hidden md:flex flex-col shrink-0 transition-all duration-300`}>
        <div className="card flex flex-col h-[calc(100vh-9rem)] min-h-[520px] overflow-hidden">
          <div className="p-3 border-b border-cream-200 dark:border-white/10">
            <button onClick={startNew}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-b from-brand-500 to-brand-600 text-white text-sm font-semibold py-2.5 shadow-soft hover:shadow-lift transition-all">
              <Plus className="h-4 w-4" /> New chat
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {isPatient ? (
              <>
                <p className="px-2 pt-1 pb-2 text-[11px] font-semibold uppercase tracking-wider text-ink-400 flex items-center gap-1.5">
                  <History className="h-3.5 w-3.5" /> History
                </p>
                {convos.length === 0 && (
                  <p className="px-2 text-xs text-ink-400">No conversations yet — say hello!</p>
                )}
                {convos.map((c) => (
                  <button key={c.conversationId} onClick={() => openConversation(c)}
                    className={`group w-full flex items-center gap-2 rounded-xl px-2.5 py-2 text-left transition-colors ${c.conversationId === activeId ? 'bg-brand-50 dark:bg-brand-500/15 text-brand-700 dark:text-brand-300' : 'text-ink-600 dark:text-ink-300 hover:bg-cream-100 dark:hover:bg-white/5'}`}>
                    <MessageCircle className="h-4 w-4 shrink-0 opacity-60" />
                    <span className="flex-1 truncate text-sm">{c.title}</span>
                    <span onClick={(e) => removeConversation(e, c)}
                      className="opacity-0 group-hover:opacity-100 grid h-6 w-6 place-items-center rounded-md text-ink-400 hover:text-coral-600 hover:bg-coral-50 dark:hover:bg-white/10 transition-all">
                      <Trash2 className="h-3.5 w-3.5" />
                    </span>
                  </button>
                ))}
              </>
            ) : (
              <div className="p-3 text-center">
                <span className="mx-auto grid h-10 w-10 place-items-center rounded-2xl bg-cream-200 dark:bg-white/5 text-ink-400"><History className="h-5 w-5" /></span>
                <p className="mt-3 text-xs text-ink-500 dark:text-ink-400 leading-relaxed">
                  Sign in to keep your conversations and pick them up any time.
                </p>
                <Link href="/login" className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-brand-600 hover:text-brand-700">
                  <LogIn className="h-3.5 w-3.5" /> Log in
                </Link>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Chat panel */}
      <div className="flex-1 min-w-0 relative">
        <button onClick={() => setSidebarOpen((o) => !o)}
          title={sidebarOpen ? 'Hide history' : 'Show history'}
          className="hidden md:grid absolute -left-2 top-3 z-10 h-8 w-8 place-items-center rounded-full bg-white dark:bg-ink-900 border border-cream-300 dark:border-white/10 text-ink-400 hover:text-brand-600 shadow-soft transition-colors">
          {sidebarOpen ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeft className="h-4 w-4" />}
        </button>
        <Chat conversationId={activeId} initialMessages={activeMessages} onExchange={refresh} />
      </div>
    </div>
  )
}
