import type { LogCollector } from './types/log'

export function createLogCollector(): LogCollector {
    const logs: import('./types/log').LogEntry[] = []

    const add = (level: import('./types/log').LogLevel, message: string) => {
        logs.push({ level, message, timestamp: new Date() })
    }

    return {
        getAll: () => logs,
        info: (msg) => add('info', msg),
        warn: (msg) => add('warn', msg),
        error: (msg) => add('error', msg),
        debug: (msg) => add('debug', msg),
    }
}
