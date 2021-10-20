
const express = require('express')
const cors = require('cors')
const morgan = require('morgan')
const { PORT } = require('./config')
const { NotFoundError } = require('./utils/errors')
// const security = require('./middleware/security')

const app = express()

app.use(cors())

app.use(express.json())
app.use(morgan('tiny'))




/** Handle 404 errors -- this matches everything */
app.use((req, res, next) => {
  return next(new NotFoundError())
})

/** Generic error handler; anything unhandled goes here. */
app.use((err, req, res, next) => {
  const status = err.status || 500
  const message = err.message

  return res.status(status).json({
    error: { message, status },
  })
})

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`)
})
