'use client'

import { useEffect } from "react"

export default function PageAutoScroller({ currentDay } : {currentDay:number}) {
    useEffect(() => {
        const targetId = currentDay === 6 ? 'board-section' : 'task-section'
        document.getElementById(targetId)?.scrollIntoView({ behavior: 'smooth' })
    }, [currentDay])
    return null
}