import { auth, signOut } from '@/auth'
import { redirect } from 'next/navigation'
import TaskInputSection from '@/components/TaskInputSection'
import PageAutoScroller from '@/components/PageAutoScroller'
import { getCurrentSprint, getSprintById, getStaleActiveSprint, hasCompletedSprintThisWeek } from './actions'
import Board from '@/components/Board'
import CompleteSprintBanner from '@/components/CompleteSprintBanner'
import CompleteSprintButton from '@/components/CompleteSprintButton'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

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

  const readOnly = sprint.status === 'COMPLETED'

  // Check for stale active sprints (only when viewing current sprint, not a specific one)
  const staleSprint = !sprintId ? await getStaleActiveSprint() : null
  // Don't show the banner for the current sprint itself
  const showStaleBanner = staleSprint && staleSprint.id !== sprint.id

  const currentDay = new Date().getDay()

  return (
    <main className="bg-white">
      {showStaleBanner && <CompleteSprintBanner staleSprint={staleSprint} />}
      <PageAutoScroller currentDay={currentDay} />

      <div className="max-w-[1500px] w-[95%] mx-auto flex flex-col">
        <header className="text-center py-8 relative">
          <Link
            href="/sprints"
            className="absolute top-8 left-0 text-sm text-gray-400 hover:text-gray-600 transition-colors"
          >
            Sprints
          </Link>
          <div className="absolute top-8 right-0 flex items-center gap-4">
            {!readOnly && (
              <CompleteSprintButton sprintId={sprint.id} />
            )}
            <form
              action={async () => {
                'use server'
                await signOut({ redirectTo: '/login' })
              }}
            >
              <button
                type="submit"
                className="text-sm text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
              >
                Sign out
              </button>
            </form>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Personal Swiftboard
          </h1>
          <p className="text-gray-400 text-lg">
            Week of {new Date(sprint.weekStart).toLocaleDateString()} • {sprint.theme}
            {readOnly && (
              <span className="ml-2 text-xs font-medium bg-gray-100 text-gray-500 px-2 py-1 rounded-full">
                Completed
              </span>
            )}
          </p>
        </header>

        <section
          id="task-section"
          className="min-h-screen flex items-center py-[50px]"
        >
          <TaskInputSection initialSprint={sprint} readOnly={readOnly} />
        </section>

        <section
          id="board-section"
          className="min-h-screen py-[50px] flex flex-col"
        >
          <div className="flex-1 flex flex-col">
            <div className="flex-1">
              <Board initialSprint={sprint} readOnly={readOnly} />
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}
