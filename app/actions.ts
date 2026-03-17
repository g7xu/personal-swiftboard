'use server'

import prisma from '@/lib/prisma'
import { auth } from '@/auth'
import { revalidatePath } from 'next/cache'

async function getSessionUser() {
    const session = await auth()
    if (!session?.user?.id) {
        throw new Error('Unauthorized')
    }
    return session.user
}

export async function getCurrentSprint() {
    const user = await getSessionUser()
    const currentMonday = getCurrentWeekMonday()
    const nextMonday = new Date(currentMonday)
    nextMonday.setDate(nextMonday.getDate() + 7)

    // Look for any sprint in the current week
    let sprint = await prisma.sprint.findFirst({
        where: {
            userId: user.id,
            weekStart: { gte: currentMonday, lt: nextMonday },
        },
        include: { tasks: true },
    })

    if (!sprint) {
        // Backfill missing weeks before creating current sprint
        const mostRecentSprint = await prisma.sprint.findFirst({
            where: { userId: user.id },
            orderBy: { weekStart: 'desc' },
        })

        if (mostRecentSprint) {
            const lastMonday = getMondayOfWeek(mostRecentSprint.weekStart)
            const gapMondays: Date[] = []
            const walker = new Date(lastMonday)
            walker.setDate(walker.getDate() + 7)

            while (walker < currentMonday) {
                gapMondays.push(new Date(walker))
                walker.setDate(walker.getDate() + 7)
            }

            if (gapMondays.length > 0) {
                // Only create MISSING sprints for weeks that have no sprint at all
                const existingSprints = await prisma.sprint.findMany({
                    where: {
                        userId: user.id,
                        weekStart: { gte: gapMondays[0], lt: currentMonday },
                    },
                    select: { weekStart: true },
                })

                const existingWeeks = new Set(
                    existingSprints.map((s) => getMondayOfWeek(s.weekStart).getTime())
                )

                const missingSprints = gapMondays
                    .filter((monday) => !existingWeeks.has(monday.getTime()))
                    .map((monday) => ({
                        weekStart: monday,
                        theme: null,
                        status: 'MISSING',
                        userId: user.id!,
                    }))

                if (missingSprints.length > 0) {
                    await prisma.sprint.createMany({ data: missingSprints })
                }
            }
        }

        sprint = await prisma.sprint.create({
            data: {
                weekStart: currentMonday,
                theme: 'New Sprint',
                userId: user.id!,
            },
            include: { tasks: true },
        })
    }

    return sprint
}

function getMondayOfWeek(date: Date): Date {
    const d = new Date(date)
    const dayOfWeek = d.getDay()
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
    return new Date(d.getFullYear(), d.getMonth(), d.getDate() + mondayOffset)
}

async function verifyTaskOwnership(taskId: string, userId: string) {
    const task = await prisma.task.findUnique({
        where: { id: taskId },
        include: { sprint: true },
    })
    if (!task || task.sprint.userId !== userId) {
        throw new Error('Unauthorized')
    }
    if (task.sprint.status === 'COMPLETED' || task.sprint.status === 'MISSING') {
        throw new Error('Cannot modify tasks in a completed or missing sprint')
    }
    return task
}

export async function createTask(content: string, sprintId: string, category: string = 'Not Sure') {
    const user = await getSessionUser()

    const sprint = await prisma.sprint.findUnique({ where: { id: sprintId } })
    if (!sprint || sprint.userId !== user.id) {
        throw new Error('Unauthorized')
    }
    if (sprint.status === 'COMPLETED' || sprint.status === 'MISSING') {
        throw new Error('Cannot add tasks to a completed or missing sprint')
    }

    await prisma.task.create({
        data: {
            content,
            sprintId,
            status: category,
            color: 'yellow',
        },
    })
    revalidatePath('/')
}

export async function updateTaskStatus(taskId: string, newStatus: string) {
    const user = await getSessionUser()
    await verifyTaskOwnership(taskId, user.id!)

    await prisma.task.update({
        where: { id: taskId },
        data: { status: newStatus },
    })
    revalidatePath('/')
}

export async function deleteTask(taskId: string) {
    const user = await getSessionUser()
    await verifyTaskOwnership(taskId, user.id!)

    await prisma.task.delete({
        where: { id: taskId },
    })
    revalidatePath('/')
}

export async function updateTaskColor(taskId: string, color: string) {
    const user = await getSessionUser()
    await verifyTaskOwnership(taskId, user.id!)

    await prisma.task.update({
        where: { id: taskId },
        data: { color },
    })
    revalidatePath('/')
}

export async function updateTaskContent(taskId: string, content: string) {
    const user = await getSessionUser()
    await verifyTaskOwnership(taskId, user.id!)

    await prisma.task.update({
        where: { id: taskId },
        data: { content },
    })
    revalidatePath('/')
}

export async function getAllSprints() {
    const user = await getSessionUser()

    const sprints = await prisma.sprint.findMany({
        where: { userId: user.id },
        orderBy: { weekStart: 'desc' },
        include: {
            _count: { select: { tasks: true } },
        },
    })

    return sprints
}

export async function getSprintById(sprintId: string) {
    const user = await getSessionUser()

    const sprint = await prisma.sprint.findUnique({
        where: { id: sprintId },
        include: { tasks: true },
    })

    if (!sprint || sprint.userId !== user.id) {
        throw new Error('Unauthorized')
    }

    return sprint
}

export async function completeSprint(sprintId: string) {
    const user = await getSessionUser()

    const sprint = await prisma.sprint.findUnique({
        where: { id: sprintId },
    })

    if (!sprint || sprint.userId !== user.id) {
        throw new Error('Unauthorized')
    }
    if (sprint.status === 'COMPLETED') {
        throw new Error('Sprint is already completed')
    }

    await prisma.sprint.update({
        where: { id: sprintId },
        data: { status: 'COMPLETED' },
    })

    revalidatePath('/')
    revalidatePath('/sprints')
}

function getCurrentWeekMonday() {
    const now = new Date()
    const dayOfWeek = now.getDay()
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
    return new Date(now.getFullYear(), now.getMonth(), now.getDate() + mondayOffset)
}

export async function hasCompletedSprintThisWeek() {
    const user = await getSessionUser()
    const currentWeekStart = getCurrentWeekMonday()
    const nextWeekStart = new Date(currentWeekStart)
    nextWeekStart.setDate(nextWeekStart.getDate() + 7)

    const completedSprint = await prisma.sprint.findFirst({
        where: {
            userId: user.id,
            status: 'COMPLETED',
            weekStart: { gte: currentWeekStart, lt: nextWeekStart },
        },
    })

    return !!completedSprint
}

export async function getStaleActiveSprint() {
    const user = await getSessionUser()

    const currentWeekStart = getCurrentWeekMonday()

    const staleSprint = await prisma.sprint.findFirst({
        where: {
            userId: user.id,
            status: 'ACTIVE',
            weekStart: { lt: currentWeekStart },
        },
        include: { tasks: true },
        orderBy: { weekStart: 'asc' },
    })

    return staleSprint
}
