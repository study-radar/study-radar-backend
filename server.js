
const express = require('express')
const cors = require('cors')
const morgan = require('morgan')
const { PORT } = require('./config')
const { NotFoundError } = require('./utils/errors')
const security = require('./middleware/security')


const authRoutes = require('./routes/auth')
// const groupRoutes = require('./routes/group')

const bodyParser = require('body-parser')

const app = express()

app.use(cors())

app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: "50mb", extended: true, parameterLimit: 5999990000 }));

app.use(express.json())
app.use(morgan('dev'))

app.use(security.extractUserFromJwt)

app.use("/auth", authRoutes)
// app.use("/group", groupRoutes)

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
