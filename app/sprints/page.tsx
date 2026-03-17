import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { getAllSprints } from '@/app/actions'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function SprintsPage() {
    const session = await auth()
    if (!session) redirect('/login')

    const sprints = await getAllSprints()

    return (
        <main className="bg-white min-h-screen">
            <div className="max-w-3xl mx-auto px-4 py-8">
                <div className="flex items-center justify-between mb-8">
                    <h1 className="text-2xl font-bold text-gray-900">Sprints</h1>
                    <Link
                        href="/"
                        className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        Back to board
                    </Link>
                </div>

                {sprints.length === 0 ? (
                    <p className="text-gray-400 text-center py-12">No sprints yet.</p>
                ) : (
                    <div className="flex flex-col gap-3">
                        {sprints.map((sprint) => {
                            const badgeClass =
                                sprint.status === 'ACTIVE'
                                    ? 'bg-green-100 text-green-700'
                                    : sprint.status === 'MISSING'
                                    ? 'bg-amber-100 text-amber-700'
                                    : 'bg-gray-100 text-gray-500'
                            const badgeLabel =
                                sprint.status === 'ACTIVE'
                                    ? 'Active'
                                    : sprint.status === 'MISSING'
                                    ? 'Missing'
                                    : 'Completed'

                            return (
                                <Link
                                    key={sprint.id}
                                    href={`/?sprintId=${sprint.id}`}
                                    className={`block p-4 rounded-lg border border-gray-200 transition-all ${
                                        sprint.status === 'MISSING'
                                            ? 'opacity-60 cursor-default'
                                            : 'hover:border-gray-300 hover:shadow-sm'
                                    }`}
                                >
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="font-medium text-gray-900">
                                                Week of {new Date(sprint.weekStart).toLocaleDateString()}
                                            </p>
                                            {sprint.theme && (
                                                <p className="text-sm text-gray-500 mt-0.5">
                                                    {sprint.theme}
                                                </p>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className="text-sm text-gray-400">
                                                {sprint._count.tasks} task{sprint._count.tasks !== 1 ? 's' : ''}
                                            </span>
                                            <span
                                                className={`text-xs font-medium px-2 py-1 rounded-full ${badgeClass}`}
                                            >
                                                {badgeLabel}
                                            </span>
                                        </div>
                                    </div>
                                </Link>
                            )
                        })}
                    </div>
                )}
            </div>
        </main>
    )
}
