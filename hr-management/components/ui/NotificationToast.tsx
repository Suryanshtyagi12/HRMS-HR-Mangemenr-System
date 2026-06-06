'use client'

import React, { useEffect, useState } from 'react'
import { X, BellRing } from 'lucide-react'

interface NotificationToastProps {
  notification: {
    title: string
    message: string
  }
  onClose: () => void
  onClick?: () => void
}

export function NotificationToast({ notification, onClose, onClick }: NotificationToastProps) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    // Trigger slide in
    const t = setTimeout(() => setVisible(true), 10)
    
    // Auto dismiss after 4 seconds
    const dismissTimer = setTimeout(() => {
      setVisible(false)
      setTimeout(onClose, 300) // Wait for slide out animation
    }, 4000)
    
    return () => {
      clearTimeout(t)
      clearTimeout(dismissTimer)
    }
  }, [onClose])

  const handleClose = (e: React.MouseEvent) => {
    e.stopPropagation()
    setVisible(false)
    setTimeout(onClose, 300)
  }

  return (
    <div 
      className={`fixed bottom-4 right-4 z-[100] w-80 bg-card border shadow-lg rounded-lg p-4 cursor-pointer transition-all duration-300 transform ${
        visible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
      }`}
      onClick={onClick}
    >
      <div className="flex items-start gap-3">
        <div className="bg-primary/10 p-2 rounded-full text-primary mt-0.5">
          <BellRing className="w-4 h-4" />
        </div>
        <div className="flex-1 space-y-1">
          <h4 className="text-sm font-semibold text-card-foreground">{notification.title}</h4>
          <p className="text-xs text-muted-foreground line-clamp-2">{notification.message}</p>
        </div>
        <button 
          onClick={handleClose}
          className="text-slate-400 hover:text-muted-foreground focus:outline-none"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
