'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import {
  LayoutDashboard,
  FileText,
  FolderOpen,
  Tag,
  Users,
  Image,
  LogOut,
  Newspaper
} from 'lucide-react'
import { cn } from '@/lib/utils'

export default function DashboardNav({ user, userRole }) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const navItems = [
    {
      title: 'Dashboard',
      href: '/dashboard',
      icon: LayoutDashboard,
    },
    {
      title: 'Articles',
      href: '/dashboard/articles',
      icon: FileText,
    },
    {
      title: 'Categories',
      href: '/dashboard/categories',
      icon: FolderOpen,
      adminOnly: true,
    },
    {
      title: 'Tags',
      href: '/dashboard/tags',
      icon: Tag,
    },
    {
      title: 'Authors',
      href: '/dashboard/authors',
      icon: Users,
      adminOnly: true,
    },
    {
      title: 'Media Library',
      href: '/dashboard/media',
      icon: Image,
    },
  ]

  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
      <div className="p-6 border-b border-gray-200">
        <Link href="/" className="flex items-center space-x-2">
          <Newspaper className="h-8 w-8 text-blue-600" />
          <span className="text-xl font-bold">NewsHarpal</span>
        </Link>
      </div>
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          if (item.adminOnly && userRole !== 'admin') return null

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center space-x-3 px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors',
                pathname === item.href && 'bg-blue-50 text-blue-600 hover:bg-blue-50'
              )}
            >
              <item.icon className="h-5 w-5" />
              <span>{item.title}</span>
            </Link>
          )
        })}
      </nav>
      <div className="p-4 border-t border-gray-200">
        <div className="mb-3 px-3">
          <p className="text-sm font-medium text-gray-900">{user.email}</p>
          <p className="text-xs text-gray-500 capitalize">{userRole}</p>
        </div>
        <Button
          variant="ghost"
          className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
          onClick={handleLogout}
        >
          <LogOut className="h-5 w-5 mr-3" />
          Logout
        </Button>
      </div>
    </aside>
  )
}