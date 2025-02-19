// Type-safe timer definitions for metrics system
export type MetricsTimer = ReturnType<typeof setTimeout> | ReturnType<typeof setInterval>;

// Re-export common types used across metrics system
export interface Position {
    x: number;
    y: number;
}

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';
export type LogType = 'state' | 'analysis' | 'performance' | 'error' | 'gameEnd' | 'damage' | 'healing' | 'status'; 