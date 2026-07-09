import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { getAllSprints, getActiveSprintCarriedActions } from '@/app/actions'
import Link from 'next/link'
import SprintActionsPanel from '@/components/SprintActionsPanel'
import SprintCalendar from '@/components/SprintCalendar'
import SiteHeader, { headerLinkClass } from '@/components/SiteHeader'

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
            <div className="max-w-[1500px] w-[95%] mx-auto pb-10">
                <SiteHeader
                    title="The weeks so far"
                    nav={
                        <Link href="/" className={headerLinkClass}>
                            ← Back to board
                        </Link>
                    }
                />

                <div className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-8 pt-8">
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
