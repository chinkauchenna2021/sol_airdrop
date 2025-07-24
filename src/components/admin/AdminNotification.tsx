'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Bell, BellRing, Check, X, AlertTriangle, Info, 
  CheckCircle2, XCircle, Clock, Users, Coins, 
  Twitter, Shield, Settings, Trash2, MoreHorizontal,
  Filter, Search, Archive, CheckCheck
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Popover, PopoverContent, PopoverTrigger 
} from '@/components/ui/popover'
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle 
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import toast from 'react-hot-toast'

interface AdminNotification {
  id: string
  type: 'info' | 'warning' | 'error' | 'success' | 'system'
  title: string
  message: string
  category: 'user' | 'claim' | 'twitter' | 'system' | 'security'
  priority: 'low' | 'medium' | 'high' | 'critical'
  isRead: boolean
  isArchived: boolean
  createdAt: Date
  actionUrl?: string
  metadata?: {
    userId?: string
    claimId?: string
    amount?: number
    [key: string]: any
  }
}

interface NotificationFilters {
  type: 'all' | 'info' | 'warning' | 'error' | 'success' | 'system'
  category: 'all' | 'user' | 'claim' | 'twitter' | 'system' | 'security'
  priority: 'all' | 'low' | 'medium' | 'high' | 'critical'
  status: 'all' | 'unread' | 'read' | 'archived'
}

export function NotificationCenter({ 
  notifications: initialNotifications = [] 
}: { 
  notifications: AdminNotification[] 
}) {
  const [notifications, setNotifications] = useState<AdminNotification[]>(initialNotifications)
  const [isOpen, setIsOpen] = useState(false)
  const [showFullView, setShowFullView] = useState(false)
  const [selectedNotification, setSelectedNotification] = useState<AdminNotification | null>(null)
  const [filters, setFilters] = useState<NotificationFilters>({
    type: 'all',
    category: 'all',
    priority: 'all',
    status: 'all'
  })
  const [searchQuery, setSearchQuery] = useState('')
  const wsRef = useRef<WebSocket | null>(null)

  useEffect(() => {
    // Initialize WebSocket for real-time notifications
    initializeWebSocket()
    
    return () => {
      if (wsRef.current) {
        wsRef.current.close()
      }
    }
  }, [])

  const initializeWebSocket = () => {
    const ws = new WebSocket(`${process.env.NEXT_PUBLIC_WS_URL}/admin-notifications`)
    
    ws.onopen = () => {
      console.log('Notification WebSocket connected')
    }

    ws.onmessage = (event) => {
      const notification = JSON.parse(event.data)
      setNotifications(prev => [notification, ...prev])
      
      // Show toast for high priority notifications
      if (notification.priority === 'high' || notification.priority === 'critical') {
        toast(notification.title, {
          icon: getNotificationIcon(notification.type),
          duration: 5000
        })
      }
    }

    ws.onclose = () => {
      console.log('Notification WebSocket disconnected')
      setTimeout(initializeWebSocket, 5000)
    }

    wsRef.current = ws
  }

  const unreadCount = notifications.filter(n => !n.isRead && !n.isArchived).length
  const criticalCount = notifications.filter(n => 
    n.priority === 'critical' && !n.isRead && !n.isArchived
  ).length

  const filteredNotifications = notifications.filter(notification => {
    if (notification.isArchived && filters.status !== 'archived') return false
    
    const matchesSearch = !searchQuery || 
      notification.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      notification.message.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesType = filters.type === 'all' || notification.type === filters.type
    const matchesCategory = filters.category === 'all' || notification.category === filters.category
    const matchesPriority = filters.priority === 'all' || notification.priority === filters.priority
    const matchesStatus = filters.status === 'all' || 
      (filters.status === 'read' && notification.isRead) ||
      (filters.status === 'unread' && !notification.isRead) ||
      (filters.status === 'archived' && notification.isArchived)

    return matchesSearch && matchesType && matchesCategory && matchesPriority && matchesStatus
  })

  const markAsRead = async (notificationId: string) => {
    try {
      await fetch(`/api/admin/notifications/${notificationId}/read`, {
        method: 'PATCH'
      })
      
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, isRead: true } : n)
      )
    } catch (error) {
      console.error('Failed to mark notification as read:', error)
    }
  }

  const markAllAsRead = async () => {
    try {
      await fetch('/api/admin/notifications/mark-all-read', {
        method: 'POST'
      })
      
      setNotifications(prev => 
        prev.map(n => ({ ...n, isRead: true }))
      )
      
      toast.success('All notifications marked as read')
    } catch (error) {
      console.error('Failed to mark all as read:', error)
      toast.error('Failed to mark all as read')
    }
  }

  const archiveNotification = async (notificationId: string) => {
    try {
      await fetch(`/api/admin/notifications/${notificationId}/archive`, {
        method: 'PATCH'
      })
      
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, isArchived: true } : n)
      )
    } catch (error) {
      console.error('Failed to archive notification:', error)
    }
  }

  const deleteNotification = async (notificationId: string) => {
    try {
      await fetch(`/api/admin/notifications/${notificationId}`, {
        method: 'DELETE'
      })
      
      setNotifications(prev => prev.filter(n => n.id !== notificationId))
      toast.success('Notification deleted')
    } catch (error) {
      console.error('Failed to delete notification:', error)
      toast.error('Failed to delete notification')
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle2 className="w-4 h-4 text-green-400" />
      case 'warning': return <AlertTriangle className="w-4 h-4 text-yellow-400" />
      case 'error': return <XCircle className="w-4 h-4 text-red-400" />
      case 'system': return <Settings className="w-4 h-4 text-blue-400" />
      default: return <Info className="w-4 h-4 text-blue-400" />
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'user': return <Users className="w-4 h-4" />
      case 'claim': return <Coins className="w-4 h-4" />
      case 'twitter': return <Twitter className="w-4 h-4" />
      case 'security': return <Shield className="w-4 h-4" />
      default: return <Settings className="w-4 h-4" />
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-500/20 text-red-400 border-red-500/30'
      case 'high': return 'bg-orange-500/20 text-orange-400 border-orange-500/30'
      case 'medium': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
      default: return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
    }
  }

  const getTimeAgo = (date: Date) => {
    const now = new Date()
    const diff = now.getTime() - new Date(date).getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (days > 0) return `${days}d ago`
    if (hours > 0) return `${hours}h ago`
    if (minutes > 0) return `${minutes}m ago`
    return 'Just now'
  }

  return (
    <>
      {/* Notification Bell */}
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="sm" className="relative">
            {unreadCount > 0 ? (
              <BellRing className="w-5 h-5" />
            ) : (
              <Bell className="w-5 h-5" />
            )}
            
            {unreadCount > 0 && (
              <Badge className="absolute -top-1 -right-1 bg-red-500 text-white min-w-[20px] h-5 rounded-full flex items-center justify-center text-xs">
                {unreadCount > 99 ? '99+' : unreadCount}
              </Badge>
            )}
            
            {criticalCount > 0 && (
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse" />
            )}
          </Button>
        </PopoverTrigger>
        
        <PopoverContent className="w-96 p-0" align="end">
          <div className="border-b border-white/10 p-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-white">Notifications</h3>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={markAllAsRead}
                    className="text-xs"
                  >
                    Mark all read
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowFullView(true)}
                  className="text-xs"
                >
                  View all
                </Button>
              </div>
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {filteredNotifications.length === 0 ? (
              <div className="p-8 text-center">
                <Bell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-400">No notifications</p>
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {filteredNotifications.slice(0, 10).map((notification) => (
                  <motion.div
                    key={notification.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={`p-4 hover:bg-white/5 cursor-pointer relative ${
                      !notification.isRead ? 'bg-blue-500/5' : ''
                    }`}
                    onClick={() => {
                      if (!notification.isRead) {
                        markAsRead(notification.id)
                      }
                      if (notification.actionUrl) {
                        window.open(notification.actionUrl, '_blank')
                      }
                    }}
                  >
                    <div className="flex items-start gap-3">
                      {getNotificationIcon(notification.type)}
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-sm font-medium text-white truncate">
                            {notification.title}
                          </p>
                          {!notification.isRead && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full" />
                          )}
                        </div>
                        
                        <p className="text-sm text-gray-400 mb-2 line-clamp-2">
                          {notification.message}
                        </p>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {getCategoryIcon(notification.category)}
                            <span className="text-xs text-gray-500 capitalize">
                              {notification.category}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Badge className={getPriorityColor(notification.priority)}>
                              {notification.priority}
                            </Badge>
                            <span className="text-xs text-gray-500">
                              {getTimeAgo(notification.createdAt)}
                            </span>
                          </div>
                        </div>
                      </div>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          archiveNotification(notification.id)
                        }}
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Archive className="w-4 h-4" />
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>

      {/* Full Notification View Modal */}
      <Dialog open={showFullView} onOpenChange={setShowFullView}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>All Notifications</span>
              <div className="flex items-center gap-2">
                <Badge variant="outline">
                  {filteredNotifications.length} notifications
                </Badge>
                {unreadCount > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={markAllAsRead}
                  >
                    <CheckCheck className="w-4 h-4 mr-2" />
                    Mark all read
                  </Button>
                )}
              </div>
            </DialogTitle>
          </DialogHeader>

          {/* Filters */}
          <div className="flex flex-wrap gap-4 mb-4">
            <div className="relative flex-1 min-w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search notifications..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={filters.type} onValueChange={(value: any) => setFilters(prev => ({ ...prev, type: value }))}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="info">Info</SelectItem>
                <SelectItem value="warning">Warning</SelectItem>
                <SelectItem value="error">Error</SelectItem>
                <SelectItem value="success">Success</SelectItem>
                <SelectItem value="system">System</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filters.category} onValueChange={(value: any) => setFilters(prev => ({ ...prev, category: value }))}>
              <SelectTrigger className="w-32">
                <SelectValue  />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="user">Users</SelectItem>
                <SelectItem value="claim">Claims</SelectItem>
                <SelectItem value="twitter">Twitter</SelectItem>
                <SelectItem value="system">System</SelectItem>
                <SelectItem value="security">Security</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filters.priority} onValueChange={(value: any) => setFilters(prev => ({ ...prev, priority: value }))}>
              <SelectTrigger className="w-32">
                <SelectValue  />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priority</SelectItem>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filters.status} onValueChange={(value: any) => setFilters(prev => ({ ...prev, status: value }))}>
              <SelectTrigger className="w-32">
                <SelectValue  />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="unread">Unread</SelectItem>
                <SelectItem value="read">Read</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Notifications List */}
          <div className="space-y-2 max-h-96 overflow-y-auto">
            <AnimatePresence>
              {filteredNotifications.map((notification) => (
                <motion.div
                  key={notification.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className={`p-4 rounded-lg border border-white/10 ${
                    !notification.isRead ? 'bg-blue-500/5 border-blue-500/20' : 'bg-white/5'
                  } ${notification.isArchived ? 'opacity-60' : ''}`}
                >
                  <div className="flex items-start gap-4">
                    <div className="flex items-center gap-2">
                      {getNotificationIcon(notification.type)}
                      {getCategoryIcon(notification.category)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-medium text-white">
                          {notification.title}
                        </h4>
                        {!notification.isRead && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full" />
                        )}
                        <Badge className={getPriorityColor(notification.priority)}>
                          {notification.priority}
                        </Badge>
                      </div>

                      <p className="text-gray-400 mb-3">
                        {notification.message}
                      </p>

                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-4 text-gray-500">
                          <span className="capitalize">{notification.category}</span>
                          <span>{new Date(notification.createdAt).toLocaleString()}</span>
                          {notification.metadata && (
                            <span>
                              {notification.metadata.userId && `User: ${notification.metadata.userId.slice(0, 8)}...`}
                              {notification.metadata.amount && ` • Amount: ${notification.metadata.amount}`}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {!notification.isRead && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => markAsRead(notification.id)}
                        >
                          <Check className="w-4 h-4" />
                        </Button>
                      )}
                      
                      {!notification.isArchived && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => archiveNotification(notification.id)}
                        >
                          <Archive className="w-4 h-4" />
                        </Button>
                      )}
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteNotification(notification.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {filteredNotifications.length === 0 && (
              <div className="text-center py-12">
                <Bell className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-400 text-lg">No notifications found</p>
                <p className="text-gray-500 text-sm">Try adjusting your filters</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}