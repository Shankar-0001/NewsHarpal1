export default function ArticleSummary({ points = [] }) {
  if (!points || points.length === 0) return null

  return (
    <section className="mb-8 p-5 rounded-xl border bg-blue-50/60 border-blue-100 dark:bg-blue-950/30 dark:border-blue-900/50">
      <h2 className="text-lg font-bold mb-3 text-blue-900 dark:text-blue-200">60 Second Summary</h2>
      <ul className="list-disc pl-5 space-y-1.5 text-sm text-blue-900/90 dark:text-blue-100/90">
        {points.map((point, index) => (
          <li key={`${index}-${point.slice(0, 20)}`}>{point}</li>
        ))}
      </ul>
    </section>
  )
}
