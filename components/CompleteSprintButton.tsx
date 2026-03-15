'use client'

import { completeSprint } from '@/app/actions'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

interface CompleteSprintButtonProps {
    sprintId: string
}

export default function CompleteSprintButton({ sprintId }: CompleteSprintButtonProps) {
    const router = useRouter()
    const [showModal, setShowModal] = useState(false)
    const [isCompleting, setIsCompleting] = useState(false)

    const handleComplete = async () => {
        setIsCompleting(true)
        try {
            await completeSprint(sprintId)
            router.push('/')
            router.refresh()
        } catch (error) {
            console.error('Failed to complete sprint:', error)
            setIsCompleting(false)
            setShowModal(false)
        }
    }

    return (
        <>
            <button
                type="button"
                onClick={() => setShowModal(true)}
                className="text-sm text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
            >
                Complete Sprint
            </button>

            {showModal && (
                <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-50 flex items-center justify-center">
                    <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-8 max-w-md w-full mx-4 text-center">
                        <h2 className="text-xl font-bold text-gray-900 mb-2">
                            Complete Sprint?
                        </h2>
                        <p className="text-gray-500 mb-6">
                            Are you sure you want to complete this sprint? This action cannot be undone. The sprint will become read-only.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowModal(false)}
                                disabled={isCompleting}
                                className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-md font-medium hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleComplete}
                                disabled={isCompleting}
                                className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                            >
                                {isCompleting ? 'Completing...' : 'Complete Sprint'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}
