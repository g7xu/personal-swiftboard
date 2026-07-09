// All week math uses UTC Mondays — keep any new date logic in UTC to match.

export function getMondayOfWeek(date: Date): Date {
    const dayOfWeek = date.getUTCDay()
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
    return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate() + mondayOffset))
}

export function getCurrentWeekMonday(): Date {
    return getMondayOfWeek(new Date())
}
