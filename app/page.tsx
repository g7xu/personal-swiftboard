import { auth, signOut } from '@/auth'
import { redirect } from 'next/navigation'
import TaskInputSection from '@/components/TaskInputSection'
import { getCurrentSprint, getSprintById, getStaleActiveSprint, hasCompletedSprintThisWeek } from './actions'
import Board from '@/components/Board'
import CompleteSprintBanner from '@/components/CompleteSprintBanner'
import CompleteSprintButton from '@/components/CompleteSprintButton'
import Link from 'next/link'
import { getSprintWeekLabel } from '@/lib/sprintLabel'

export const dynamic = 'force-dynamic'

const DAY_LETTERS = ['M', 'T', 'W', 'T', 'F', 'S', 'S']

export default async function Home({ searchParams }: { searchParams: Promise<{ sprintId?: string }> }) {
  const session = await auth()
  if (!session) redirect('/login')

  const params = await searchParams
  const sprintId = params.sprintId

  let sprint
  if (sprintId) {
    sprint = await getSprintById(sprintId)
  } else {
    if (await hasCompletedSprintThisWeek()) {
      redirect('/sprints')
    }
    sprint = await getCurrentSprint()
  }

  const readOnly = sprint.status === 'COMPLETED' || sprint.status === 'MISSING'

  // Check for stale active sprints (only when viewing current sprint, not a specific one)
  const staleSprint = !sprintId ? await getStaleActiveSprint() : null
  const showStaleBanner = staleSprint && staleSprint.id !== sprint.id

  const dayIndex = (new Date().getDay() + 6) % 7 // 0 = Monday

  return (
    <main className="min-h-screen text-ink">
      {showStaleBanner && <CompleteSprintBanner staleSprint={staleSprint} />}

      <div className="max-w-[1500px] w-[95%] mx-auto flex flex-col min-h-screen">
        <header className="flex flex-wrap items-end justify-between gap-x-8 gap-y-4 pt-8 pb-6">
          <div>
            <p className="font-bold uppercase tracking-[0.22em] text-[13px]">
              Personal Swiftboard
            </p>
            <div className="mt-1 flex items-center gap-4">
              <h1 className="font-hand text-3xl leading-none text-ink/90">
                {getSprintWeekLabel(new Date(sprint.weekStart))}
                {sprint.theme ? ` — ${sprint.theme}` : ''}
              </h1>
              {sprint.status === 'COMPLETED' && <span className="stamp">Completed</span>}
              {sprint.status === 'MISSING' && <span className="stamp stamp-muted">Missing</span>}
            </div>
          </div>

          {sprint.status === 'ACTIVE' && (
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
          )}

          <div className="flex items-center gap-5">
            <Link
              href="/sprints"
              className="font-semibold uppercase tracking-[0.12em] text-[11px] text-ink/60 hover:text-ink transition-colors"
            >
              Sprints
            </Link>
            {!readOnly && new Date(sprint.weekStart) <= new Date() && (
              <CompleteSprintButton sprintId={sprint.id} tasks={sprint.tasks} />
            )}
            <form
              action={async () => {
                'use server'
                await signOut({ redirectTo: '/login' })
              }}
            >
              <button
                type="submit"
                className="font-semibold uppercase tracking-[0.12em] text-[11px] text-ink/60 hover:text-ink transition-colors cursor-pointer"
              >
                Sign out
              </button>
            </form>
          </div>
        </header>

        {!readOnly && <TaskInputSection initialSprint={sprint} />}

        <section className="flex-1 pt-8 pb-44">
          <Board initialSprint={sprint} readOnly={readOnly} />
        </section>
      </div>
    </main>
  )
}
