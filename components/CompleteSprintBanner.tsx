'use client'

import { completeSprint } from '@/app/actions'
import { Sprint, Task } from '@prisma/client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

interface CompleteSprintBannerProps {
    staleSprint: Sprint & { tasks: Task[] }
}

export default function CompleteSprintBanner({ staleSprint }: CompleteSprintBannerProps) {
    const router = useRouter()
    const [isCompleting, setIsCompleting] = useState(false)

    const handleComplete = async () => {
        setIsCompleting(true)
        try {
            await completeSprint(staleSprint.id)
            router.refresh()
        } catch (error) {
            console.error('Failed to complete sprint:', error)
            setIsCompleting(false)
        }
    }

    const taskCount = staleSprint.tasks.length

    return (
        <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-50 flex items-center justify-center">
            <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-8 max-w-md w-full mx-4 text-center">
                <h2 className="text-xl font-bold text-gray-900 mb-2">
                    Complete Previous Sprint
                </h2>
                <p className="text-gray-500 mb-4">
                    You have an unfinished sprint that needs to be completed before you can continue.
                </p>
                <div className="bg-gray-50 rounded-md p-4 mb-6 text-left">
                    <p className="text-sm text-gray-600">
                        <span className="font-medium">Week of:</span>{' '}
                        {new Date(staleSprint.weekStart).toLocaleDateString()}
                    </p>
                    {staleSprint.theme && (
                        <p className="text-sm text-gray-600 mt-1">
                            <span className="font-medium">Theme:</span> {staleSprint.theme}
                        </p>
                    )}
                    <p className="text-sm text-gray-600 mt-1">
                        <span className="font-medium">Tasks:</span> {taskCount}
                    </p>
                </div>
                <button
                    onClick={handleComplete}
                    disabled={isCompleting}
                    className="w-full px-6 py-3 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isCompleting ? 'Completing...' : 'Complete & Archive'}
                </button>
            </div>
        </div>
    )
}
