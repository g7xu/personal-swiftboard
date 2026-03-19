'use client'

import { toggleCarriedAction } from '@/app/actions'
import { Task } from '@prisma/client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

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
            <h2 className="text-lg font-bold text-gray-900 mb-4">Focus Actions</h2>

            {carriedActions.length === 0 ? (
                <p className="text-gray-400 text-sm">No actions for this sprint</p>
            ) : (
                <div className="flex flex-col gap-2">
                    {carriedActions.map(action => {
                        const isCompleted = action.status === 'Rose'
                        const isToggling = togglingId === action.id

                        return (
                            <button
                                key={action.id}
                                type="button"
                                onClick={() => handleToggle(action.id)}
                                disabled={isToggling}
                                className={`text-left p-3 rounded-md border transition-colors cursor-pointer ${
                                    isCompleted
                                        ? 'border-green-200 bg-green-50'
                                        : 'border-gray-200 bg-gray-50 hover:border-gray-300'
                                } ${isToggling ? 'opacity-50' : ''}`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                                        isCompleted
                                            ? 'border-green-500 bg-green-500'
                                            : 'border-gray-300'
                                    }`}>
                                        {isCompleted && (
                                            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                            </svg>
                                        )}
                                    </div>
                                    <span className={`text-sm ${
                                        isCompleted
                                            ? 'text-gray-400 line-through'
                                            : 'text-gray-900'
                                    }`}>
                                        {action.content}
                                    </span>
                                </div>
                            </button>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
