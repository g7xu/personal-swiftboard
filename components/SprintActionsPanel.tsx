'use client'

import { toggleCarriedAction } from '@/app/actions'
import { Task } from '@prisma/client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

const colorClasses: Record<string, string> = {
    yellow: 'bg-yellow-100',
    blue: 'bg-blue-100',
    pink: 'bg-pink-100',
    green: 'bg-green-100',
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
        <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Action of the Week</h2>

            {carriedActions.length === 0 ? (
                <p className="text-gray-400 text-sm">No actions for this sprint</p>
            ) : (
                <div className="flex flex-col gap-3">
                    {carriedActions.map(action => {
                        const isCompleted = action.status === 'Rose'
                        const isToggling = togglingId === action.id

                        return (
                            <button
                                key={action.id}
                                type="button"
                                onClick={() => handleToggle(action.id)}
                                disabled={isToggling}
                                className={`
                                    relative text-left p-2 rounded-[5px] shadow-swiftboard
                                    ${colorClasses[action.color] || colorClasses.yellow}
                                    text-gray-800 font-normal text-sm sm:text-base
                                    min-h-[60px] flex flex-col items-start justify-start
                                    transition-all duration-150 cursor-pointer
                                    ${isCompleted ? 'opacity-60' : 'hover:shadow-lg'}
                                    ${isToggling ? 'opacity-50' : ''}
                                `}
                            >
                                {isCompleted && (
                                    <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center shadow-md">
                                        <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
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
