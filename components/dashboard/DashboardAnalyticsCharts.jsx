'use client'

import { useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { Bar, BarChart, CartesianGrid, Cell, XAxis, YAxis } from 'recharts'

const AI_TOPIC_PATTERN = /\b(ai|artificial intelligence|machine learning|ml|llm|gpt|chatgpt|openai|gemini|anthropic|copilot|deepseek)\b/i

function truncate(text = '', size = 24) {
  if (!text) return ''
  return text.length > size ? `${text.slice(0, size - 3)}...` : text
}

function hoursAgo(isoDate) {
  if (!isoDate) return null
  const diff = Date.now() - new Date(isoDate).getTime()
  if (!Number.isFinite(diff)) return null
  return Math.max(0, Math.floor(diff / (1000 * 60 * 60)))
}

const articleChartConfig = {
  value: { label: 'Count', color: 'hsl(var(--chart-1))' },
}

const trendChartConfig = {
  volume: { label: 'Search Volume', color: 'hsl(var(--chart-2))' },
}

export default function DashboardAnalyticsCharts({ articles = [], trendingTopics = [] }) {
  const [selectedArticleId, setSelectedArticleId] = useState(articles?.[0]?.id || '')

  const selectedArticle = useMemo(
    () => (articles || []).find((item) => item.id === selectedArticleId) || articles?.[0] || null,
    [articles, selectedArticleId]
  )

  const articleMetricsData = useMemo(() => {
    if (!selectedArticle) return []
    return [
      { metric: 'Views', value: selectedArticle.views || 0 },
      { metric: 'Likes', value: selectedArticle.likes || 0 },
      { metric: 'Shares', value: selectedArticle.shares || 0 },
      { metric: 'Score', value: selectedArticle.score || 0 },
    ]
  }, [selectedArticle])

  const trendRows = useMemo(() => {
    return [...(trendingTopics || [])]
      .sort((a, b) => (b.search_volume || 0) - (a.search_volume || 0))
      .slice(0, 20)
      .map((item) => {
        const aiTrend = AI_TOPIC_PATTERN.test(item.keyword || '')
        return {
          ...item,
          label: truncate(item.keyword || item.slug || 'topic', 22),
          volume: item.search_volume || 0,
          startedHours: hoursAgo(item.created_at),
          aiTrend,
        }
      })
  }, [trendingTopics])

  const aiTopicCount = trendRows.filter((item) => item.aiTrend).length
  const webTopicCount = trendRows.length - aiTopicCount

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Article Performance Graph</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {articles.length > 0 ? (
            <>
              <label className="text-sm text-gray-600 dark:text-gray-400 block">
                Select Article
                <select
                  className="mt-2 w-full rounded-md border bg-white dark:bg-gray-900 px-3 py-2 text-sm"
                  value={selectedArticle?.id || ''}
                  onChange={(e) => setSelectedArticleId(e.target.value)}
                >
                  {articles.map((article) => (
                    <option key={article.id} value={article.id}>
                      {truncate(article.title, 80)}
                    </option>
                  ))}
                </select>
              </label>

              <div className="flex flex-wrap gap-2 text-xs">
                <Badge variant="outline">Views: {selectedArticle?.views || 0}</Badge>
                <Badge variant="outline">Likes: {selectedArticle?.likes || 0}</Badge>
                <Badge variant="outline">Shares: {selectedArticle?.shares || 0}</Badge>
                <Badge variant="secondary">Engagement Score: {selectedArticle?.score || 0}</Badge>
              </div>

              <ChartContainer config={articleChartConfig} className="h-[280px] w-full">
                <BarChart data={articleMetricsData}>
                  <CartesianGrid vertical={false} />
                  <XAxis dataKey="metric" tickLine={false} axisLine={false} />
                  <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
                  <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dot" />} />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]} fill="var(--color-value)" />
                </BarChart>
              </ChartContainer>
            </>
          ) : (
            <p className="text-sm text-gray-500 dark:text-gray-400">No article data available yet.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Web + AI Trend Topics Graph</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2 text-xs flex-wrap">
            <Badge variant="outline">Web Trends: {webTopicCount}</Badge>
            <Badge>AI Trends: {aiTopicCount}</Badge>
            <Badge variant="secondary">Google Topics: {trendRows.length}</Badge>
          </div>

          {trendRows.length > 0 ? (
            <ChartContainer config={trendChartConfig} className="h-[320px] w-full">
              <BarChart data={trendRows} margin={{ left: 12, right: 12 }}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="label" tickLine={false} axisLine={false} interval={0} angle={-25} textAnchor="end" height={70} />
                <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
                <ChartTooltip
                  cursor={false}
                  content={
                    <ChartTooltipContent
                      indicator="dot"
                      formatter={(value, _name, item) => {
                        const topic = item?.payload?.keyword || item?.payload?.label || 'Topic'
                        const started = item?.payload?.startedHours
                        return (
                          <div className="w-full">
                            <div className="flex items-center justify-between gap-2">
                              <span>{topic}</span>
                              <span className="font-mono">{value} vol</span>
                            </div>
                            <div className="text-[11px] text-muted-foreground">
                              Started: {started != null ? `${started}h ago` : 'n/a'}
                            </div>
                          </div>
                        )
                      }}
                    />
                  }
                />
                <Bar dataKey="volume" radius={[6, 6, 0, 0]}>
                  {trendRows.map((entry) => (
                    <Cell key={entry.slug} fill={entry.aiTrend ? '#8b5cf6' : '#2563eb'} />
                  ))}
                </Bar>
              </BarChart>
            </ChartContainer>
          ) : (
            <p className="text-sm text-gray-500 dark:text-gray-400">No trend data available yet.</p>
          )}

          {trendRows.length > 0 && (
            <div className="rounded-md border dark:border-gray-700 overflow-hidden">
              <div className="grid grid-cols-12 px-3 py-2 text-xs font-semibold bg-gray-50 dark:bg-gray-800">
                <span className="col-span-6">Google Trend Topic</span>
                <span className="col-span-3 text-right">Search Volume</span>
                <span className="col-span-3 text-right">Started</span>
              </div>
              <div className="max-h-56 overflow-y-auto divide-y dark:divide-gray-700">
                {trendRows.map((row) => (
                  <div key={row.slug} className="grid grid-cols-12 px-3 py-2 text-xs">
                    <span className="col-span-6 truncate" title={row.keyword}>{row.keyword}</span>
                    <span className="col-span-3 text-right font-mono">{row.volume}</span>
                    <span className="col-span-3 text-right">{row.startedHours != null ? `${row.startedHours}h ago` : 'n/a'}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

