'use client'

import { toggleCarriedAction } from '@/app/actions'
import { Task } from '@prisma/client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

const colorClasses: Record<string, string> = {
    yellow: 'bg-note-yellow',
    blue: 'bg-note-blue',
    pink: 'bg-note-pink',
    green: 'bg-note-green',
}

interface SprintActionsPanelProps {
    carriedActions: Task[]
}

export default function SprintActionsPanel({ carriedActions }: SprintActionsPanelProps) {
    const router = useRouter()
    const [togglingId, setTogglingId] = useState<string | null>(null)

    const handleToggle = async (taskId: string) => {
        setTogglingId(taskId)
        try {
            await toggleCarriedAction(taskId)
            router.refresh()
        } catch (error) {
            console.error('Failed to toggle action:', error)
        } finally {
            setTogglingId(null)
        }
    }

    return (
        <div className="bg-paper rounded-md shadow-[0_2px_10px_-4px_rgba(46,43,35,0.35)] p-6">
            <h2 className="font-print text-sm font-bold uppercase tracking-[0.16em] text-ink">
                Actions of the week
            </h2>
            <p className="font-hand text-lg text-ink/50 mb-4 mt-0.5 leading-none">
                carried from last sprint — tap one when it&apos;s done
            </p>

            {carriedActions.length === 0 ? (
                <p className="font-hand text-xl text-ink/45">Nothing carried over this week.</p>
            ) : (
                <div className="flex flex-col gap-4">
                    {carriedActions.map((action, i) => {
                        const isCompleted = action.status === 'Rose'
                        const isToggling = togglingId === action.id

                        return (
                            <button
                                key={action.id}
                                type="button"
                                onClick={() => handleToggle(action.id)}
                                disabled={isToggling}
                                className={`
                                    relative text-left note p-3 pt-6
                                    ${colorClasses[action.color] || colorClasses.yellow}
                                    text-ink font-hand text-lg leading-snug
                                    min-h-[60px] flex flex-col items-start justify-start
                                    transition-all duration-150 cursor-pointer
                                    ${i % 2 === 0 ? '[transform:rotate(-0.7deg)]' : '[transform:rotate(0.7deg)]'}
                                    ${isCompleted ? 'opacity-60' : 'hover:shadow-lg hover:[transform:rotate(0deg)_translateY(-2px)]'}
                                    ${isToggling ? 'opacity-50' : ''}
                                `}
                            >
                                {isCompleted && (
                                    <div className="absolute -top-2 -right-2 w-6 h-6 bg-ink rounded-full flex items-center justify-center shadow-md">
                                        <svg className="w-3.5 h-3.5 text-paper" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                        </svg>
                                    </div>
                                )}
                                <span className={isCompleted ? 'line-through' : ''}>
                                    {action.content}
                                </span>
                            </button>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
