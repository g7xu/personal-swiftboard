'use server'

import prisma from '@/lib/prisma'
import { auth } from '@/auth'
import { revalidatePath } from 'next/cache'
import { getProvider } from '@/lib/ai'
import { getAnalysisPrompt } from '@/lib/prompts'

const AI_ALLOWED_EMAILS = [
    'guoxuan.xu8@gmail.com',
    'andrewhyang@gmail.com',
    'joexu2018@gmail.com',
]

async function getSessionUser() {
    const session = await auth()
    if (!session?.user?.id) {
        throw new Error('Unauthorized')
    }
    return session.user
}

async function getAIAuthorizedUser() {
    const user = await getSessionUser()
    if (!AI_ALLOWED_EMAILS.includes(user.email ?? '')) {
        throw new Error('Not authorized for AI features')
    }
    return user
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
                theme: null,
                userId: user.id!,
            },
            include: { tasks: true },
        })
    }

    return sprint
}

function getMondayOfWeek(date: Date): Date {
    const d = new Date(date)
    const dayOfWeek = d.getUTCDay()
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
    return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + mondayOffset))
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
    const task = await verifyTaskOwnership(taskId, user.id!)

    if (task.isCarriedAction && !['Thorn', 'Rose'].includes(newStatus)) {
        throw new Error('Carried actions can only be moved between Thorn and Rose')
    }

    await prisma.task.update({
        where: { id: taskId },
        data: { status: newStatus },
    })
    revalidatePath('/')
}

export async function deleteTask(taskId: string) {
    const user = await getSessionUser()
    const task = await verifyTaskOwnership(taskId, user.id!)

    if (task.isCarriedAction) {
        throw new Error('Cannot delete a carried action task')
    }

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

export async function updateSprintTheme(sprintId: string, theme: string) {
    const user = await getSessionUser()
    await prisma.sprint.update({
        where: { id: sprintId, userId: user.id! },
        data: { theme: theme.trim() || null },
    })
    revalidatePath('/')
    revalidatePath('/sprints')
}

export async function updateTaskContent(taskId: string, content: string) {
    const user = await getSessionUser()
    await verifyTaskOwnership(taskId, user.id!)

    await prisma.task.update({
        where: { id: taskId },
        data: { content, analyzedAt: null },
    })
    revalidatePath('/')
}

export async function analyzeTask(taskId: string): Promise<{ taskId: string; suggestedContent: string } | null> {
    const user = await getAIAuthorizedUser()
    const task = await verifyTaskOwnership(taskId, user.id!)

    if (task.isCarriedAction) {
        return null
    }
    if (task.status === 'Not Sure') {
        return null
    }
    if (task.analyzedAt !== null) {
        return null
    }

    const content = task.content.trim().slice(0, 1000)
    const systemPrompt = getAnalysisPrompt(task.status)
    if (!systemPrompt) {
        return null
    }

    const provider = getProvider()
    const suggestedContent = await provider.analyze(content, systemPrompt)
    return { taskId, suggestedContent }
}

export async function analyzeAllTasks(sprintId: string): Promise<{ taskId: string; suggestedContent: string }[]> {
    const user = await getAIAuthorizedUser()

    const sprint = await prisma.sprint.findUnique({
        where: { id: sprintId },
        include: { tasks: true },
    })

    if (!sprint || sprint.userId !== user.id) {
        throw new Error('Unauthorized')
    }

    const eligibleTasks = sprint.tasks.filter(
        (t) => !t.isCarriedAction && t.status !== 'Not Sure' && t.analyzedAt === null
    )

    const results: { taskId: string; suggestedContent: string }[] = []
    for (const task of eligibleTasks) {
        const result = await analyzeTask(task.id)
        if (result) {
            results.push(result)
        }
    }

    return results
}

export async function keepAnalysis(taskId: string, newContent: string) {
    const user = await getAIAuthorizedUser()
    await verifyTaskOwnership(taskId, user.id!)

    await prisma.task.update({
        where: { id: taskId },
        data: { content: newContent, analyzedAt: new Date() },
    })
    revalidatePath('/')
}

export async function keepAllAnalyses(updates: { taskId: string; content: string }[]) {
    const user = await getAIAuthorizedUser()

    await prisma.$transaction(
        updates.map((u) =>
            prisma.task.update({
                where: { id: u.taskId },
                data: { content: u.content, analyzedAt: new Date() },
            })
        )
    )
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

export async function completeSprint(sprintId: string, selectedTaskIds: string[] = []) {
    const user = await getSessionUser()

    const sprint = await prisma.sprint.findUnique({
        where: { id: sprintId },
        include: { tasks: true },
    })

    if (!sprint || sprint.userId !== user.id) {
        throw new Error('Unauthorized')
    }
    if (sprint.status === 'COMPLETED') {
        throw new Error('Sprint is already completed')
    }

    // Prevent completing sprints that are later than the current week
    const currentMonday = getCurrentWeekMonday()
    if (new Date(sprint.weekStart) > currentMonday) {
        throw new Error('Cannot complete a future sprint')
    }

    // Validate selected tasks belong to this sprint and are Action tasks
    if (selectedTaskIds.length > 0) {
        const actionTasks = sprint.tasks.filter(t => t.status === 'Action')
        const actionTaskIds = new Set(actionTasks.map(t => t.id))
        for (const id of selectedTaskIds) {
            if (!actionTaskIds.has(id)) {
                throw new Error('Invalid task selection: task is not an Action task in this sprint')
            }
        }
        if (selectedTaskIds.length > 3) {
            throw new Error('Cannot carry forward more than 3 actions')
        }
    }

    await prisma.$transaction(async (tx) => {
        // Mark sprint as completed
        await tx.sprint.update({
            where: { id: sprintId },
            data: { status: 'COMPLETED' },
        })

        // Clear carried action flag so they become regular historical tasks
        await tx.task.updateMany({
            where: { sprintId: sprintId, isCarriedAction: true },
            data: { isCarriedAction: false },
        })

        // Always create the next week's sprint after the completed one
        const sprintMonday = new Date(sprint.weekStart)
        const nextWeekMonday = new Date(sprintMonday)
        nextWeekMonday.setDate(nextWeekMonday.getDate() + 7)
        const weekAfterNext = new Date(nextWeekMonday)
        weekAfterNext.setDate(weekAfterNext.getDate() + 7)

        let nextSprint = await tx.sprint.findFirst({
            where: {
                userId: user.id,
                weekStart: { gte: nextWeekMonday, lt: weekAfterNext },
            },
        })

        if (!nextSprint) {
            nextSprint = await tx.sprint.create({
                data: {
                    weekStart: nextWeekMonday,
                    theme: null,
                    userId: user.id!,
                },
            })
        }

        // Carry selected actions to the next sprint
        if (selectedTaskIds.length > 0) {
            const selectedTasks = sprint.tasks.filter(t => selectedTaskIds.includes(t.id))
            await tx.task.createMany({
                data: selectedTasks.map(t => ({
                    content: t.content,
                    status: 'Thorn',
                    color: t.color,
                    isCarriedAction: true,
                    sprintId: nextSprint.id,
                })),
            })
        }
    })

    revalidatePath('/')
    revalidatePath('/sprints')
}

export async function getCarriedActions(sprintId: string) {
    const user = await getSessionUser()

    const sprint = await prisma.sprint.findUnique({
        where: { id: sprintId },
    })

    if (!sprint || sprint.userId !== user.id) {
        throw new Error('Unauthorized')
    }

    return prisma.task.findMany({
        where: {
            sprintId,
            isCarriedAction: true,
        },
        orderBy: { id: 'asc' },
    })
}

export async function toggleCarriedAction(taskId: string) {
    const user = await getSessionUser()
    const task = await prisma.task.findUnique({
        where: { id: taskId },
        include: { sprint: true },
    })

    if (!task || task.sprint.userId !== user.id) {
        throw new Error('Unauthorized')
    }
    if (!task.isCarriedAction) {
        throw new Error('Task is not a carried action')
    }

    const newStatus = task.status === 'Thorn' ? 'Rose' : 'Thorn'

    await prisma.task.update({
        where: { id: taskId },
        data: { status: newStatus },
    })

    revalidatePath('/')
    revalidatePath('/sprints')
}

export async function getActiveSprintCarriedActions() {
    const user = await getSessionUser()
    const currentMonday = getCurrentWeekMonday()
    const nextMonday = new Date(currentMonday)
    nextMonday.setDate(nextMonday.getDate() + 7)

    const activeSprint = await prisma.sprint.findFirst({
        where: {
            userId: user.id,
            weekStart: { gte: currentMonday, lt: nextMonday },
        },
    })

    if (!activeSprint) {
        return []
    }

    return prisma.task.findMany({
        where: {
            sprintId: activeSprint.id,
            isCarriedAction: true,
        },
        orderBy: { id: 'asc' },
    })
}

function getCurrentWeekMonday() {
    const now = new Date()
    const dayOfWeek = now.getUTCDay()
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
    return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + mondayOffset))
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
