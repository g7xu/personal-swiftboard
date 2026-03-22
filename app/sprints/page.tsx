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
        <main className="bg-white min-h-screen">
            <div className="max-w-6xl mx-auto px-4 py-8">
                <div className="flex items-center justify-between mb-8">
                    <h1 className="text-2xl font-bold text-gray-900">Sprints</h1>
                    <Link
                        href="/"
                        className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        Back to board
                    </Link>
                </div>

                <div className="flex gap-8">
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
