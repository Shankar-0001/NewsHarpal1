'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function TestSupabasePage() {
  const [status, setStatus] = useState('Testing...')
  const [details, setDetails] = useState({})

  useEffect(() => {
    testConnection()
  }, [])

  const testConnection = async () => {
    try {
      const supabase = createClient()
      
      // Test 1: Check if client is created
      if (!supabase) {
        setStatus('❌ Failed: Supabase client not initialized')
        return
      }

      // Test 2: Check environment variables
      const hasUrl = !!process.env.NEXT_PUBLIC_SUPABASE_URL
      const hasKey = !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      
      setDetails({
        url: hasUrl ? 'Found' : 'Missing',
        key: hasKey ? 'Found' : 'Missing',
        urlValue: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 30) + '...',
      })

      if (!hasUrl || !hasKey) {
        setStatus('❌ Failed: Missing environment variables')
        return
      }

      // Test 3: Try to get session
      const { data: { session }, error } = await supabase.auth.getSession()
      
      if (error) {
        setStatus(`❌ Failed: ${error.message}`)
        return
      }

      setStatus('✅ Success: Supabase connection working!')
      setDetails(prev => ({
        ...prev,
        session: session ? 'User logged in' : 'No active session',
      }))
      
    } catch (error) {
      setStatus(`❌ Failed: ${error.message}`)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <Card className="w-full max-w-md dark:bg-gray-800 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="text-center dark:text-white">Supabase Connection Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center text-lg font-semibold dark:text-white">
            {status}
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">URL:</span>
              <span className="font-mono dark:text-white">{details.url}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Anon Key:</span>
              <span className="font-mono dark:text-white">{details.key}</span>
            </div>
            {details.urlValue && (
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">URL Value:</span>
                <span className="font-mono text-xs dark:text-white">{details.urlValue}</span>
              </div>
            )}
            {details.session && (
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Session:</span>
                <span className="font-mono dark:text-white">{details.session}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}