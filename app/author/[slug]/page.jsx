import { redirect } from 'next/navigation'

export default function AuthorAliasPage({ params }) {
  redirect(`/authors/${params.slug}`)
}
