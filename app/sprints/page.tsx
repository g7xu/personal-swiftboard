import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { getAllSprints, getActiveSprintCarriedActions } from '@/app/actions'
import Link from 'next/link'
import SprintActionsPanel from '@/components/SprintActionsPanel'
import SprintCalendar from '@/components/SprintCalendar'

export const dynamic = 'force-dynamic'

export default async function SprintsPage() {
    const session = await auth()
    if (!session) redirect('/login')

    const [sprints, carriedActions] = await Promise.all([
        getAllSprints(),
        getActiveSprintCarriedActions(),
    ])

    return (
        <main className="min-h-screen text-ink">
            <div className="max-w-6xl mx-auto px-4 py-10">
                <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
                    <div>
                        <p className="font-bold uppercase tracking-[0.22em] text-[13px]">
                            Personal Swiftboard
                        </p>
                        <h1 className="font-hand text-3xl mt-1 leading-none text-ink/90">
                            The weeks so far
                        </h1>
                    </div>
                    <Link
                        href="/"
                        className="font-semibold uppercase tracking-[0.12em] text-[11px] text-ink/60 hover:text-ink transition-colors"
                    >
                        ← Back to board
                    </Link>
                </div>

                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Calendar + filtered sprint list - left panel */}
                    <div className="flex-[3]">
                        <SprintCalendar sprints={sprints} />
                    </div>

                    {/* Focus actions - right panel */}
                    <div className="flex-[2]">
                        <SprintActionsPanel carriedActions={carriedActions} />
                    </div>
                </div>
            </div>
        </main>
    )
}
