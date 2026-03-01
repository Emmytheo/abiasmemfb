export type LogLevel = 'info' | 'warn' | 'error' | 'debug'

export type LogEntry = {
    message: string
    level: LogLevel
    timestamp: Date
}

export type LogCollector = {
    getAll: () => LogEntry[]
    info: (message: string) => void
    warn: (message: string) => void
    error: (message: string) => void
    debug: (message: string) => void
}
