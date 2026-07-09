'use client'

import { useState } from 'react'
import Link from 'next/link'
import { updateSprintTheme } from '@/app/actions'
import { getSprintWeekLabel } from '@/lib/sprintLabel'

interface SprintListItemProps {
    sprint: {
        id: string
        weekStart: Date | string
        theme: string | null
        status: string
        _count: { tasks: number }
    }
}

const edgeColor: Record<string, string> = {
    ACTIVE: 'border-l-note-green',
    COMPLETED: 'border-l-ink/25',
    MISSING: 'border-l-note-yellow',
}

export default function SprintListItem({ sprint }: SprintListItemProps) {
    const [isEditingTheme, setIsEditingTheme] = useState(false)
    const [themeValue, setThemeValue] = useState(sprint.theme ?? '')

    const handleSaveTheme = async () => {
        setIsEditingTheme(false)
        await updateSprintTheme(sprint.id, themeValue)
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') handleSaveTheme()
        if (e.key === 'Escape') {
            setIsEditingTheme(false)
            setThemeValue(sprint.theme ?? '')
        }
    }

    return (
        <Link
            href={`/sprints/${sprint.id}`}
            className={`block p-4 bg-paper rounded-sm border-l-4 shadow-[0_1px_4px_rgba(46,43,35,0.18)] transition-all ${
                edgeColor[sprint.status] ?? 'border-l-ink/25'
            } ${
                sprint.status === 'MISSING'
                    ? 'opacity-60 cursor-default'
                    : 'hover:shadow-[0_3px_10px_rgba(46,43,35,0.25)] hover:-translate-y-0.5'
            }`}
        >
            <div className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                    <p className="font-semibold text-ink">
                        {getSprintWeekLabel(new Date(sprint.weekStart))}
                    </p>
                    {isEditingTheme ? (
                        <input
                            type="text"
                            value={themeValue}
                            onChange={(e) => setThemeValue(e.target.value)}
                            onBlur={handleSaveTheme}
                            onKeyDown={handleKeyDown}
                            onClick={(e) => e.preventDefault()}
                            autoFocus
                            placeholder="Name this week…"
                            className="block font-hand text-lg text-ink mt-0.5 w-full bg-transparent border-b border-ink/30 outline-none focus:border-ink/60"
                        />
                    ) : (
                        <p
                            onClick={(e) => {
                                e.preventDefault()
                                setIsEditingTheme(true)
                            }}
                            className="font-hand text-lg text-ink/55 mt-0.5 cursor-text hover:text-ink/80 truncate"
                        >
                            {sprint.theme || 'Name this week…'}
                        </p>
                    )}
                </div>
                <div className="flex items-center gap-4 shrink-0">
                    <span className="font-print text-[10px] font-bold uppercase tracking-[0.12em] text-ink/50">
                        {sprint._count.tasks} note{sprint._count.tasks !== 1 ? 's' : ''}
                    </span>
                    {sprint.status === 'ACTIVE' && <span className="stamp stamp-ink">This week</span>}
                    {sprint.status === 'COMPLETED' && <span className="stamp">Completed</span>}
                    {sprint.status === 'MISSING' && <span className="stamp stamp-muted">Missing</span>}
                </div>
            </div>
        </Link>
    )
}
