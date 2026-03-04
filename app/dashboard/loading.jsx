'use client'

import { Card, CardContent, CardHeader } from '@/components/ui/card'

export default function DashboardLoading() {
    return (
        <div className="p-8 space-y-6">
            {/* Header skeleton */}
            <div className="h-10 w-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />

            {/* Cards skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                    <Card key={i} className="dark:bg-gray-800">
                        <CardHeader>
                            <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                        </CardHeader>
                        <CardContent>
                            <div className="h-8 w-24 bg-gray-300 dark:bg-gray-600 rounded animate-pulse" />
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Table skeleton */}
            <Card className="dark:bg-gray-800">
                <CardHeader>
                    <div className="h-6 w-40 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {[1, 2, 3, 4, 5].map((i) => (
                            <div key={i} className="h-12 bg-gray-100 dark:bg-gray-700 rounded animate-pulse" />
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
