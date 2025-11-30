import TaskInputSection from '@/components/TaskInputSection'
import PageAutoScroller from '@/components/PageAutoScroller'

import { getCurrentSprint } from './actions'
import Board from '@/components/Board'
export const dynamic = 'force-dynamic'

export default async function Home() {
  const sprint = await getCurrentSprint()
  const currentDay = new Date().getDay()

  return (
    <main className="bg-gray-50 font-[family-name:var(--font-geist-sans)]">
      <PageAutoScroller currentDay={currentDay} />

      <div className="max-w-7xl mx-auto flex flex-col">
        <header className="text-center py-8 px-6 sm:px-10">
          <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight mb-2">
            Personal Swiftboard
          </h1>
          <p className="text-gray-500 text-lg">
            Week of {new Date(sprint.weekStart).toLocaleDateString()} • {sprint.theme}
          </p>
        </header>
        
        <section
          id="task-section"
          className="min-h-screen flex items-center px-6 sm:px-10 py-12"
        >
          <TaskInputSection initialSprint={sprint} />
        </section>

        <section
          id="board-section"
          className="min-h-screen px-6 sm:px-10 py-12 flex flex-col"
        >
          <div className="flex-1 flex flex-col">
            <div className="flex-1">
              <Board initialSprint={sprint} />
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}
