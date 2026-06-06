'use client'

import React, { useEffect, useState } from 'react'
import { Bell, Check, Trash2, ExternalLink } from 'lucide-react'
import { supabase } from '@/lib/supabase-client'
import { useAuthStore } from '@/store/authStore'
import { api } from '@/lib/api'
import { useRouter } from 'next/navigation'
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { NotificationToast } from '@/components/ui/NotificationToast'

interface Notification {
  id: string
  title: string
  message: string
  type: string
  is_read: boolean
  link: string | null
  created_at: string
}

export function NotificationBell() {
  const { user } = useAuthStore()
  const router = useRouter()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [open, setOpen] = useState(false)

  // Toast state
  const [toastNotif, setToastNotif] = useState<Notification | null>(null)

  useEffect(() => {
    if (!user?.id) return
    
    loadNotifications()
    
    const channel = supabase
      .channel(`notifications:${user.id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${user.id}`
      }, (payload) => {
        const newNotif = payload.new as Notification
        setNotifications(prev => [newNotif, ...prev])
        setUnreadCount(prev => prev + 1)
        
        // Trigger Toast
        setToastNotif(newNotif)
      })
      .subscribe()
    
    return () => {
      supabase.removeChannel(channel)
    }
  }, [user?.id])

  const loadNotifications = async () => {
    try {
      const res = await api.get("/notifications")
      setNotifications(res.data.items)
      setUnreadCount(res.data.unread_count)
    } catch (e) {
      console.error("Failed to load notifications", e)
    }
  }

  const markRead = async (id: string, link: string | null) => {
    try {
      await api.put(`/notifications/${id}/read`)
      setNotifications(prev => 
        prev.map(n => n.id === id ? { ...n, is_read: true } : n)
      )
      setUnreadCount(prev => Math.max(0, prev - 1))
      
      if (link) {
        setOpen(false)
        router.push(link)
      }
    } catch (e) {
      console.error(e)
    }
  }

  const markAllRead = async () => {
    try {
      await api.put(`/notifications/read-all`)
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
      setUnreadCount(0)
    } catch (e) {
      console.error(e)
    }
  }

  const deleteNotification = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      await api.delete(`/notifications/${id}`)
      setNotifications(prev => {
        const updated = prev.filter(n => n.id !== id)
        const newUnread = updated.filter(n => !n.is_read).length
        setUnreadCount(newUnread)
        return updated
      })
    } catch (e) {
      console.error(e)
    }
  }

  const formatTimeAgo = (dateStr: string) => {
    const d = new Date(dateStr)
    const now = new Date()
    const diffMin = Math.floor((now.getTime() - d.getTime()) / 60000)
    if (diffMin < 1) return 'Just now'
    if (diffMin < 60) return `${diffMin}m ago`
    if (diffMin < 1440) return `${Math.floor(diffMin/60)}h ago`
    return `${Math.floor(diffMin/1440)}d ago`
  }

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="icon" className="relative text-muted-foreground hover:text-card-foreground">
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white shadow-sm ring-2 ring-white">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-80 p-0 shadow-lg" sideOffset={8}>
          <div className="flex items-center justify-between px-4 py-3 border-b bg-slate-50/50">
            <h4 className="font-semibold text-sm">Notifications</h4>
            {unreadCount > 0 && (
              <Button variant="ghost" size="sm" onClick={markAllRead} className="h-auto p-0 text-xs text-primary hover:text-primary/80 bg-transparent hover:bg-transparent">
                Mark all read
              </Button>
            )}
          </div>
          
          <ScrollArea className="h-80">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full py-12 text-center text-muted-foreground">
                <Bell className="w-8 h-8 mb-2 opacity-20" />
                <p className="text-sm">No notifications</p>
              </div>
            ) : (
              <div className="flex flex-col divide-y divide-slate-100">
                {notifications.map((n) => (
                  <div 
                    key={n.id} 
                    onClick={() => markRead(n.id, n.link)}
                    className={`flex gap-3 px-4 py-3 cursor-pointer hover:bg-muted transition-colors group relative ${!n.is_read ? 'bg-blue-50/30' : ''}`}
                  >
                    {!n.is_read && (
                      <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-blue-500" />
                    )}
                    
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <p className={`text-sm font-medium ${!n.is_read ? 'text-card-foreground' : 'text-card-foreground'}`}>
                          {n.title}
                        </p>
                        <span className="text-[10px] text-muted-foreground">{formatTimeAgo(n.created_at)}</span>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2">{n.message}</p>
                      
                      <div className="flex items-center justify-between pt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="flex gap-2">
                          {n.link && <Badge variant="outline" className="text-[10px] py-0 h-4 px-1.5"><ExternalLink className="w-2.5 h-2.5 mr-1" /> View</Badge>}
                        </div>
                        <Button variant="ghost" size="icon" className="h-6 w-6 text-slate-400 hover:text-red-600" onClick={(e) => deleteNotification(n.id, e)}>
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </PopoverContent>
      </Popover>

      {/* Render the global toast when a new notification arrives */}
      {toastNotif && (
        <NotificationToast 
          notification={toastNotif} 
          onClose={() => setToastNotif(null)} 
          onClick={() => {
            if (toastNotif.link) {
              router.push(toastNotif.link)
              markRead(toastNotif.id, null)
              setToastNotif(null)
            }
          }}
        />
      )}
    </>
  )
}
