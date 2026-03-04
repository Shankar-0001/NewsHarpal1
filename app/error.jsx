'use client'

import { useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AlertTriangle } from 'lucide-react'

export default function ErrorBoundary({ error, reset }) {
    useEffect(() => {
        // Log to error reporting service in production
        console.error('Error caught by boundary:', error)
    }, [error])

    return (
        <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950 dark:to-red-900 flex items-center justify-center p-4">
            <Card className="max-w-md w-full dark:bg-gray-800">
                <CardHeader>
                    <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle className="h-6 w-6 text-red-600" />
                        <CardTitle>Something went wrong</CardTitle>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        An unexpected error occurred. Our team has been notified and we're working on a fix.
                    </p>

                    {process.env.NODE_ENV === 'development' && (
                        <div className="bg-red-100 dark:bg-red-900/30 p-3 rounded text-xs text-red-800 dark:text-red-200 max-h-48 overflow-auto font-mono">
                            {error?.message || 'Unknown error'}
                        </div>
                    )}

                    <div className="flex gap-2 pt-4">
                        <Button onClick={reset} className="flex-1">
                            Try again
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => window.location.href = '/'}
                            className="flex-1"
                        >
                            Go home
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
