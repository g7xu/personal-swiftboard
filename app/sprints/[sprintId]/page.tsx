import { auth } from '@/auth'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { getSprintById } from '@/app/actions'
import Board from '@/components/Board'
import TaskInputSection from '@/components/TaskInputSection'
import CompleteSprintButton from '@/components/CompleteSprintButton'
import SiteHeader, { headerLinkClass } from '@/components/SiteHeader'
import { getSprintTitle } from '@/lib/sprintLabel'
import { getCurrentWeekMonday, getMondayOfWeek } from '@/lib/week'

export const dynamic = 'force-dynamic'

export default async function SprintPage({ params }: { params: Promise<{ sprintId: string }> }) {
    const session = await auth()
    if (!session) redirect('/login')

    const { sprintId } = await params
    let sprint
    try {
        sprint = await getSprintById(sprintId)
    } catch {
        notFound()
    }

    // The current week's board lives at "/" — one sprint, one URL.
    // Normalize weekStart before comparing: stored timestamps aren't
    // guaranteed to be Monday 00:00 UTC (pre-hotfix rows propagate).
    if (
        sprint.status === 'ACTIVE' &&
        getMondayOfWeek(new Date(sprint.weekStart)).getTime() === getCurrentWeekMonday().getTime()
    ) {
        redirect('/')
    }

    const readOnly = sprint.status === 'COMPLETED' || sprint.status === 'MISSING'

    return (
        <main className="min-h-screen text-ink">
            <div className="max-w-[1500px] w-[95%] mx-auto flex flex-col min-h-screen">
                <SiteHeader
                    title={getSprintTitle(sprint)}
                    stamp={
                        <>
                            {sprint.status === 'COMPLETED' && <span className="stamp">Completed</span>}
                            {sprint.status === 'MISSING' && <span className="stamp stamp-muted">Missing</span>}
                        </>
                    }
                    nav={
                        <>
                            <Link href="/sprints" className={headerLinkClass}>
                                ← All sprints
                            </Link>
                            <Link href="/" className={headerLinkClass}>
                                This week&apos;s board →
                            </Link>
                            {!readOnly && new Date(sprint.weekStart) <= new Date() && (
                                <CompleteSprintButton sprintId={sprint.id} tasks={sprint.tasks} />
                            )}
                        </>
                    }
                />

                <TaskInputSection initialSprint={sprint} readOnly={readOnly} />

                <section className="flex-1 pt-8 pb-12">
                    <Board initialSprint={sprint} readOnly={readOnly} />
                </section>
            </div>
        </main>
    )
}
