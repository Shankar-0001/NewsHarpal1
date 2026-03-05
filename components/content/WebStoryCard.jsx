import Link from 'next/link'
import Image from 'next/image'
import { Card } from '@/components/ui/card'

export default function WebStoryCard({ story }) {
  return (
    <Link href={`/web-stories/${story.slug}`} className="block">
      <Card className="overflow-hidden hover:shadow-lg transition-shadow dark:bg-gray-800 dark:border-gray-700">
        <div className="relative aspect-[9/16] w-full bg-gray-100 dark:bg-gray-900">
          {story.cover_image && (
            <Image
              src={story.cover_image}
              alt={story.title || 'Web story cover'}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 50vw, 20vw"
            />
          )}
        </div>
        <div className="p-3">
          <h3 className="font-semibold line-clamp-2 dark:text-white">{story.title}</h3>
        </div>
      </Card>
    </Link>
  )
}
