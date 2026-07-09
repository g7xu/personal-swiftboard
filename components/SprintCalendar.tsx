'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import SprintListItem from './SprintListItem'
import { getMondayOfWeek } from '@/lib/week'

interface SprintInfo {
    id: string
    weekStart: Date | string
    theme: string | null
    status: string
    _count: { tasks: number }
}

interface SprintCalendarProps {
    sprints: SprintInfo[]
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const DAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']

function getMondayKey(date: Date): string {
    return getMondayOfWeek(date).toISOString().slice(0, 10)
}

function getStatusColor(status: string): string {
    switch (status) {
        case 'ACTIVE': return 'bg-note-green/60 hover:bg-note-green'
        case 'COMPLETED': return 'bg-ink/10 hover:bg-ink/15'
        case 'MISSING': return 'bg-note-yellow/40 hover:bg-note-yellow/60'
        default: return ''
    }
}

export default function SprintCalendar({ sprints }: SprintCalendarProps) {
    const router = useRouter()
    const today = new Date()

    // Build lookup: monday ISO date string -> sprint
    const sprintByMonday = useMemo(() => {
        const map = new Map<string, SprintInfo>()
        for (const s of sprints) {
            const d = new Date(s.weekStart)
            const key = getMondayKey(d)
            map.set(key, s)
        }
        return map
    }, [sprints])

    // Default to month of most recent sprint
    const mostRecent = sprints[0]
    const initialDate = mostRecent ? new Date(mostRecent.weekStart) : new Date()
    const [viewYear, setViewYear] = useState(initialDate.getUTCFullYear())
    const [viewMonth, setViewMonth] = useState(initialDate.getUTCMonth())

    const prevMonth = () => {
        if (viewMonth === 0) {
            setViewMonth(11)
            setViewYear(viewYear - 1)
        } else {
            setViewMonth(viewMonth - 1)
        }
    }

    const nextMonth = () => {
        if (viewMonth === 11) {
            setViewMonth(0)
            setViewYear(viewYear + 1)
        } else {
            setViewMonth(viewMonth + 1)
        }
    }

    // Build calendar grid
    const firstDay = new Date(viewYear, viewMonth, 1)
    const lastDay = new Date(viewYear, viewMonth + 1, 0)

    const startDow = (firstDay.getDay() + 6) % 7
    const totalDays = lastDay.getDate()

    const weeks: (number | null)[][] = []
    let currentWeek: (number | null)[] = new Array(startDow).fill(null)
    for (let day = 1; day <= totalDays; day++) {
        currentWeek.push(day)
        if (currentWeek.length === 7) {
            weeks.push(currentWeek)
            currentWeek = []
        }
    }
    if (currentWeek.length > 0) {
        while (currentWeek.length < 7) currentWeek.push(null)
        weeks.push(currentWeek)
    }

    const getWeekSprint = (week: (number | null)[]): SprintInfo | undefined => {
        const mondayDay = week[0]
        if (mondayDay !== null) {
            const key = new Date(Date.UTC(viewYear, viewMonth, mondayDay)).toISOString().slice(0, 10)
            return sprintByMonday.get(key)
        }
        const firstDayInWeek = week.find(d => d !== null)
        if (firstDayInWeek !== undefined && firstDayInWeek !== null) {
            const date = new Date(Date.UTC(viewYear, viewMonth, firstDayInWeek))
            const key = getMondayKey(date)
            return sprintByMonday.get(key)
        }
        return undefined
    }

    // Filter sprints to those whose weekStart falls in the selected month
    const filteredSprints = useMemo(() => {
        return sprints.filter(s => {
            const d = new Date(s.weekStart)
            return d.getUTCFullYear() === viewYear && d.getUTCMonth() === viewMonth
        })
    }, [sprints, viewYear, viewMonth])

    return (
        <div>
            {/* Calendar */}
            <div className="mb-6 p-5 bg-paper rounded-md shadow-[0_2px_10px_-4px_rgba(46,43,35,0.35)]">
                {/* Header */}
                <div className="flex items-center justify-between mb-3">
                    <button
                        onClick={prevMonth}
                        className="p-1 text-ink/40 hover:text-ink transition-colors cursor-pointer"
                        aria-label="Previous month"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                    <span className="font-print text-xs font-bold uppercase tracking-[0.16em] text-ink">
                        {MONTHS[viewMonth]} {viewYear}
                    </span>
                    <button
                        onClick={nextMonth}
                        className="p-1 text-ink/40 hover:text-ink transition-colors cursor-pointer"
                        aria-label="Next month"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                        </svg>
                    </button>
                </div>

                {/* Day headers */}
                <div className="grid grid-cols-7 mb-1">
                    {DAYS.map(day => (
                        <div key={day} className="text-center font-print text-[10px] font-bold uppercase tracking-[0.1em] text-ink/40 py-1">
                            {day}
                        </div>
                    ))}
                </div>

                {/* Week rows */}
                {weeks.map((week, wi) => {
                    const sprint = getWeekSprint(week)
                    const rowClass = sprint ? `${getStatusColor(sprint.status)} cursor-pointer rounded` : ''

                    return (
                        <div
                            key={wi}
                            className={`grid grid-cols-7 transition-colors ${rowClass}`}
                            onClick={sprint ? () => router.push(`/sprints/${sprint.id}`) : undefined}
                        >
                            {week.map((day, di) => {
                                const isToday = day !== null && viewYear === today.getFullYear() && viewMonth === today.getMonth() && day === today.getDate()
                                return (
                                <div
                                    key={di}
                                    className={`text-center text-sm py-1.5 flex items-center justify-center ${
                                        day === null ? 'text-transparent' : 'text-ink/70'
                                    }`}
                                >
                                    {isToday ? (
                                        <span className="w-7 h-7 rounded-full bg-ink text-paper flex items-center justify-center">
                                            {day}
                                        </span>
                                    ) : (
                                        day ?? '.'
                                    )}
                                </div>
                                )
                            })}
                        </div>
                    )
                })}
            </div>

            {/* Sprint list filtered by selected month */}
            {filteredSprints.length === 0 ? (
                <p className="font-hand text-xl text-ink/45 text-center py-8">No sprints this month.</p>
            ) : (
                <div className="flex flex-col gap-3">
                    {filteredSprints.map((sprint) => (
                        <SprintListItem key={sprint.id} sprint={sprint} />
                    ))}
                </div>
            )}
        </div>
    )
}
