const { Router } = require('express')
const Group = require('../models/group')
const router = Router()

let colors = require('colors')

const { requireAuthenticatedUser } = require('../middleware/security')
const { fetchGroupByGroupId, deleteGroupById } = require('../models/group')
const { BadRequestError } = require('../utils/errors')

const SHOW_IMG_URLS = 1

// return all events
router.get('/all', async (req, res, next) => {
  try {
    const groups = await Group.getGroups(SHOW_IMG_URLS)
    res.status(200).json(groups)
    // res.status(200).json({groups})

  } catch (err) {
    next(err)
  }
})
// get groups for user
router.get('/user-groups', requireAuthenticatedUser, async (req, res, next) => {
  try {
    const { user } = res.locals
    const groups = await Group.getGroupsForUser(user, SHOW_IMG_URLS)
    res.status(200).json(groups)

  } catch (err) {
    next(err)
  }
})
// get users for group
router.post('/group-users', async (req, res, next) => {
  try {


    const { groupId } = req.body

    const groups = await Group.getUsersForGroup(groupId, SHOW_IMG_URLS)
    // const groups = await Group.getUsersForGroup(groupId, false)
    res.status(200).json(groups)

  } catch (err) {
    next(err)
  }
})
// create event
router.post('/create', async (req, res, next) => {
  try {
    const newGroup = req.body
    // console.log('newgroup',newGroup);
    const result = await Group.createGroup(newGroup)
    res.status(201).json({ group: result })
  } catch (err) {
    next(err)
  }
})

// add user to group
router.post('/addUser', requireAuthenticatedUser, async (req, res, next) => {
  try {

    const { user } = res.locals

    const { groupId, isDriver } = req.body
    const result = await Group.addUserToGroup(user, groupId, isDriver ?? false, SHOW_IMG_URLS)
    res.status(201).json({ group: result })
  } catch (err) {
    next(err)
  }
})
// remove user from group
router.delete('/removeUser', requireAuthenticatedUser, async (req, res, next) => {
  try {
    // const { user } = res.locals

    const { email, groupId } = req.body

    const result = await Group.removeUserFromGroup(email, groupId)
    res.status(200).json({ group: result })
  } catch (err) {
    next(err)
  }
})

// update info
router.patch('/updateInfo', requireAuthenticatedUser, async (req, res, next) => {
  try {

    const { groupId, info } = req.body
    const group = await Group.updateGroupInfo(groupId, info)
    res.status(200).json(group)
  } catch (err) {
    next(err)
  }
})


// get group by id
router.get('/search/:id', async (req, res, next) => {
  try {
    const { id } = req.params
    const group = await fetchGroupByGroupId(id, SHOW_IMG_URLS)
    res.status(200).json({ group })
  } catch (err) {
    next(err)
  }
})
// delete group by id
router.delete('/delete/:gid', async (req, res, next) => {
  try {
    // const { email } = res.locals.user
    const { gid } = req.params

    const deletedGroup = await Group.deleteGroupById(gid)
    res.status(200).json({ deletedGroup })
  } catch (err) {
    next(err)
  }
})




module.exports = router