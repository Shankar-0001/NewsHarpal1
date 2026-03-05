import WebStoryEditor from '@/components/dashboard/WebStoryEditor'

export const metadata = {
  title: 'Create Web Story - Dashboard',
}

export default function NewWebStoryPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Create Web Story</h1>
      <WebStoryEditor mode="create" />
    </div>
  )
}
