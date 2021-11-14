require('dotenv').config()

const jwt = require('jsonwebtoken')
const { SECRET_KEY } = require('../config')

const IS_TESTING = process.env.NODE_ENV === 'test'

// hs256
const generateToken = (data) => jwt.sign(data, SECRET_KEY, { expiresIn: IS_TESTING ? '999h' : '24h' })

const createUserJwt = (user) => {
  const payload = {
    email: user.email
  }
  return generateToken(payload)
}

const validateToken = (token) => {
  try {
    const decoded = jwt.verify(token, SECRET_KEY)
    return decoded
  } catch (err) {
    return {}
  }
}

module.exports = {

  createUserJwt,
  validateToken
}