'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

const navLinks = [
  { href: '/', label: 'Dashboard' },
  { href: '/transactions', label: 'Transactions' },
  { href: '/statements', label: 'Statements' },
  { href: '/accounts', label: 'Accounts' },
  { href: '/income', label: 'Income' },
  { href: '/settings', label: 'Settings' },
]

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div className="min-h-screen flex">
      <aside className="w-56 bg-gray-900 text-white flex flex-col p-4">
        <h1 className="text-xl font-bold mb-8">Finance</h1>
        <nav className="flex flex-col gap-1 flex-1">
          {navLinks.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={`px-3 py-2 rounded text-sm ${pathname === href ? 'bg-indigo-600' : 'hover:bg-gray-800'}`}
            >
              {label}
            </Link>
          ))}
        </nav>
        <button onClick={handleSignOut} className="text-sm text-gray-400 hover:text-white text-left px-3 py-2">
          Sign out
        </button>
      </aside>
      <main className="flex-1 p-6 bg-gray-50 overflow-auto">{children}</main>
    </div>
  )
}
