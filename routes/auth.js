const express = require('express')
const router = express.Router()

const User = require('../models/user')

const { createUserJwt } = require('../utils/tokens')
const security = require('../middleware/security')

router.post("/login", async (req, res, next) => {

  try {
    const user = await User.login(req.body)

    const token = createUserJwt(user) // make token

    return res.status(201).json({ user, token })
  } catch (err) {
    next(err)
  }
})
router.post("/register", async (req, res, next) => {

  try {
    const user = await User.register(req.body)

    const token = createUserJwt(user) // make token

    return res.status(201).json({ user, token })
  } catch (err) {
    next(err)
  }
})

router.get("/me", security.requireAuthenticatedUser, async (req, res, next) => {


  try {
    const { email } = res.locals.user;

    const user = await User.fetchUserByEmail(email);
    // jwt to user returned
    if (user != null)
      user.jwt = security.jwtFrom(req)

    res.status(200).json({ user });
  } catch (err) {
    next(err);
  }
});

router.get('/users', async (req, res) => {
  try {
    const users = await User.getAllUsers()
    res.status(200).json(users)
  } catch (err) {
    next(err)
  }
})

// update info
router.patch('/updateInfo', security.requireAuthenticatedUser, async (req, res, next) => {
  try {
    const { email } = res.locals.user
    const { info } = req.body
    const users = await User.updateUserInfo(email, info)
    res.status(200).json(users)
  } catch (err) {
    next(err)
  }
})

// get user by id
router.get('/:userId', async (req, res, next) => {
  try {
    const { userId } = req.params
    const user = await User.getUserById(userId)
    res.status(200).json(user)
  } catch (err) {
    next(err)
  }
})
// delete user by id
router.delete('/delete/:userId', async (req, res, next) => {
  try {
    const { userId } = req.params
    const user = await User.deleteUserById(userId)
    res.status(200).json(user)
  } catch (err) {
    next(err)
  }
})

module.exports = router
