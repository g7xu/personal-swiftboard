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

export default function SprintListItem({ sprint }: SprintListItemProps) {
    const [isEditingTheme, setIsEditingTheme] = useState(false)
    const [themeValue, setThemeValue] = useState(sprint.theme ?? '')

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
                            placeholder="Add a theme..."
                            className="block text-sm text-gray-500 mt-0.5 w-full bg-transparent border-b border-gray-300 outline-none focus:border-gray-500"
                        />
                    ) : (
                        <p
                            onClick={(e) => {
                                e.preventDefault()
                                setIsEditingTheme(true)
                            }}
                            className="text-sm text-gray-400 mt-0.5 cursor-text hover:text-gray-600"
                        >
                            {sprint.theme || 'Add a theme...'}
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
}
