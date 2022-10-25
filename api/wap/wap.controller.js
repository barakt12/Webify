const wapService = require('./wap.service')
const socketService = require('../../services/socket.service')
const logger = require('../../services/logger.service')

async function getSavedWaps(req, res) {
  try {
    const waps = await wapService.query({ createdBy: req.query.email })
    res.send(waps)
  } catch (err) {
    logger.error('Failed to get waps', err)
    res.status(500).send({ err: 'Failed to get waps' })
  }
}

async function getWap(req, res) {
  try {
    const wap = await wapService.getById(req.params.id)
    res.send(wap)
  } catch (err) {
    logger.error('Failed to get wap', err)
    res.status(500).send({ err: 'Failed to get wap' })
  }
}

async function saveWap(req, res) {
  try {
    const wapToSave = await wapService.save(req.body)
    res.send(wapToSave.ops[0])
  } catch (err) {
    logger.error('Failed to save wap', err)
    res.status(500).send({ err: 'Failed to save wap' })
  }
}

async function updateWap(req, res) {
  try {
    const wapToSave = req.body
    const wapToReturn = await wapService.update(req.params.id, wapToSave)
    res.send(wapToReturn)
  } catch (err) {
    logger.error('Failed to save wap', err)
    res.status(500).send({ err: 'Failed to save wap' })
  }
}

async function removeWap(req, res) {
  try {
    const wapId = req.params.id
    await wapService.remove(wapId)
    res.send()
  } catch (err) {
    logger.error('Failed to remove wap', err)
    res.status(500).send({ err: 'Failed to remove wap' })
  }
}

async function addNewSubscriber(req, res) {
  try {
    const subscriber = req.body
    const wapId = req.params.id
    const updatedWap = await wapService.addNewSubscriber(wapId, subscriber)
    updatedWap._id = wapId
    res.send(updatedWap)
  } catch (err) {
    logger.error('Failed to add subscriber', err)
    res.status(500).send({ err: 'Failed to add subscriber' })
  }
}

async function publishWap(req, res) {
  try {
    const wap = req.body
    const publishedWap = await wapService.publish(wap)
    if (publishedWap.ops) {
      res.send(publishedWap.ops[0])
    } else {
      res.send(publishedWap)
    }
  } catch (err) {
    logger.error('Failed to publish wap', err)
    res.status(500).send({ err: 'Failed to publish wap' })
  }
}

async function increaseViewCount(req, res) {
  try {
    const wapId = req.params.id
    const updatedWap = await wapService.increaseViewCount(wapId)
    updatedWap._id = wapId
    res.send(updatedWap)
  } catch (err) {
    logger.error('Failed to publish wap', err)
    res.status(500).send({ err: 'Failed to publish wap' })
  }
}

module.exports = {
  getWap,
  saveWap,
  updateWap,
  removeWap,
  getSavedWaps,
  addNewSubscriber,
  publishWap,
  increaseViewCount,
}
