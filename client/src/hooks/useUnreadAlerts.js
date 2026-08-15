import { useState, useEffect } from 'react'
import api from '../api/axios'

export default function useUnreadAlerts() {
  const [unreadAlerts, setUnreadAlerts] = useState(0)

  useEffect(() => {
    api.get('/dashboard')
      .then((res) => setUnreadAlerts(res.data.unreadAlerts))
      .catch((err) => console.error('Failed to load unread alerts:', err))
  }, [])

  return unreadAlerts
}
