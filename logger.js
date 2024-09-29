const winston = require('winston')
const { format } = winston

const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: format.combine(
        format.timestamp({
            format: 'YYYY-MM-DD HH:mm:ss'
        }),
        format.errors({ stack: true }),
        format.splat(),
        format.json()
    ),
    defaultMeta: { service: 'cacique-bot' },
    transports: [
        new winston.transports.File({ filename: 'error.log', level: 'error' }),
        new winston.transports.File({ filename: 'combined.log' })
    ]
})

if (process.env.NODE_ENV !== 'production') {
    logger.add(
        new winston.transports.Console({
            format: format.combine(format.colorize(), format.simple())
        })
    )
}

module.exports = logger
