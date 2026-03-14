import TaskInputSection from '@/components/TaskInputSection'
import PageAutoScroller from '@/components/PageAutoScroller'

import { getCurrentSprint } from './actions'
import Board from '@/components/Board'
export const dynamic = 'force-dynamic'

export default async function Home() {
  const sprint = await getCurrentSprint()
  const currentDay = new Date().getDay()

  return (
    <main className="bg-white">
      <PageAutoScroller currentDay={currentDay} />

      <div className="max-w-[1500px] w-[95%] mx-auto flex flex-col">
        <header className="text-center py-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Personal Swiftboard
          </h1>
          <p className="text-gray-400 text-lg">
            Week of {new Date(sprint.weekStart).toLocaleDateString()} • {sprint.theme}
          </p>
        </header>

        <section
          id="task-section"
          className="min-h-screen flex items-center py-[50px]"
        >
          <TaskInputSection initialSprint={sprint} />
        </section>

        <section
          id="board-section"
          className="min-h-screen py-[50px] flex flex-col"
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
