import Link from 'next/link'
import { signOut } from '@/auth'

interface SiteHeaderProps {
    title: React.ReactNode
    stamp?: React.ReactNode
    center?: React.ReactNode
    nav?: React.ReactNode
}

export const headerLinkClass =
    'font-semibold uppercase tracking-[0.12em] text-[11px] text-ink/60 hover:text-ink transition-colors'

// One header for every page: wordmark → home, handwritten title (+ optional
// stamp), an optional center slot (e.g. day dots), page-specific nav links,
// and Sign out always last.
export default function SiteHeader({ title, stamp, center, nav }: SiteHeaderProps) {
    return (
        <header className="flex flex-wrap items-end justify-between gap-x-8 gap-y-4 pt-8 pb-6">
            <div>
                <Link
                    href="/"
                    className="inline-block font-bold uppercase tracking-[0.22em] text-[13px] hover:text-ink/70 transition-colors"
                >
                    Personal Swiftboard
                </Link>
                <div className="mt-1 flex items-center gap-4">
                    <h1 className="font-hand text-3xl leading-none text-ink/90">{title}</h1>
                    {stamp}
                </div>
            </div>

            {center}

            <div className="flex items-center gap-5">
                {nav}
                <form
                    action={async () => {
                        'use server'
                        await signOut({ redirectTo: '/login' })
                    }}
                >
                    <button type="submit" className={`${headerLinkClass} cursor-pointer`}>
                        Sign out
                    </button>
                </form>
            </div>
        </header>
    )
}
