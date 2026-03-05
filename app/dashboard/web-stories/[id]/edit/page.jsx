import WebStoryEditor from '@/components/dashboard/WebStoryEditor'

export const metadata = {
  title: 'Edit Web Story - Dashboard',
}

export default function EditWebStoryPage({ params }) {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Edit Web Story</h1>
      <WebStoryEditor mode="edit" storyId={params.id} />
    </div>
  )
}
