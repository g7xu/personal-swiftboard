import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import TaskInputSection from '@/components/TaskInputSection'
import { getCurrentSprint, getStaleActiveSprint, hasCompletedSprintThisWeek } from './actions'
import Board from '@/components/Board'
import CompleteSprintBanner from '@/components/CompleteSprintBanner'
import CompleteSprintButton from '@/components/CompleteSprintButton'
import SiteHeader, { headerLinkClass } from '@/components/SiteHeader'
import { getSprintTitle } from '@/lib/sprintLabel'

export const dynamic = 'force-dynamic'

const DAY_LETTERS = ['M', 'T', 'W', 'T', 'F', 'S', 'S']

export default async function Home({ searchParams }: { searchParams: Promise<{ sprintId?: string }> }) {
  const session = await auth()
  if (!session) redirect('/login')

  // Legacy URLs: /?sprintId=… now lives at /sprints/[sprintId]
  const params = await searchParams
  if (params.sprintId) redirect(`/sprints/${params.sprintId}`)

  if (await hasCompletedSprintThisWeek()) {
    redirect('/sprints')
  }
  const sprint = await getCurrentSprint()

  const staleSprint = await getStaleActiveSprint()
  const showStaleBanner = staleSprint && staleSprint.id !== sprint.id

  const dayIndex = (new Date().getDay() + 6) % 7 // 0 = Monday

  return (
    <main className="min-h-screen text-ink">
      {showStaleBanner && <CompleteSprintBanner staleSprint={staleSprint} />}

      <div className="max-w-[1500px] w-[95%] mx-auto flex flex-col min-h-screen">
        <SiteHeader
          title={getSprintTitle(sprint)}
          center={
            <div className="flex items-center gap-1.5" aria-label="Progress through the week">
              {DAY_LETTERS.map((d, i) => (
                <span
                  key={i}
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-semibold ${
                    i < dayIndex
                      ? 'bg-ink/25 text-paper'
                      : i === dayIndex
                      ? 'bg-ink text-paper'
                      : 'border border-ink/30 text-ink/50'
                  }`}
                >
                  {d}
                </span>
              ))}
            </div>
          }
          nav={
            <>
              <Link href="/sprints" className={headerLinkClass}>
                ← Back to Sprints
              </Link>
              {new Date(sprint.weekStart) <= new Date() && (
                <CompleteSprintButton sprintId={sprint.id} tasks={sprint.tasks} />
              )}
            </>
          }
        />

        <TaskInputSection initialSprint={sprint} />

        <section className="flex-1 pt-8 pb-12">
          <Board initialSprint={sprint} />
        </section>
      </div>
    </main>
  )
}
