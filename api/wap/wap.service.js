const dbService = require('../../services/db.service')
const logger = require('../../services/logger.service')
const ObjectId = require('mongodb').ObjectId

module.exports = {
  query,
  getById,
  save,
  remove,
  update,
  addNewSubscriber,
  publish,
  increaseViewCount,
}

async function query(filterBy = {}) {
  const criteria = _buildCriteria(filterBy)
  try {
    const collection = await dbService.getCollection('wap')
    var users = await collection.find(criteria).toArray()
    users = users.map((user) => {
      delete user.password
      user.createdAt = ObjectId(user._id).getTimestamp()
      // Returning fake fresh data
      // user.createdAt = Date.now() - (1000 * 60 * 60 * 24 * 3) // 3 days ago
      return user
    })
    return users
  } catch (err) {
    logger.error('cannot find users', err)
    throw err
  }
}

async function getById(wapId) {
  try {
    const collection = await dbService.getCollection('wap')
    const wap = await collection.findOne({ _id: ObjectId(wapId) })
    return wap
  } catch (err) {
    logger.error(`while finding wap ${wapId}`, err)
    throw err
  }
}

async function save(wap) {
  try {
    wap.viewCount = {}
    const collection = await dbService.getCollection('wap')
    return await collection.insertOne(wap)
  } catch (err) {
    logger.error('cannot save wap', err)
    throw err
  }
}

async function update(wapId, wap) {
  try {
    const collection = await dbService.getCollection('wap')
    const wapCopy = JSON.parse(JSON.stringify(wap))
    const wapMongoId = ObjectId(wapId)
    delete wap._id
    await collection.updateOne({ _id: wapMongoId }, { $set: wap })
    return wapCopy
  } catch (err) {
    logger.error('cannot save wap', err)
    throw err
  }
}

async function remove(wapId) {
  try {
    const collection = await dbService.getCollection('wap')
    await collection.deleteOne({ _id: ObjectId(wapId) })
  } catch (err) {
    logger.error(`cannot remove wap ${wapId}`, err)
    throw err
  }
}

async function publish(wap) {
  try {
    wap.isPublished = true

    if (wap._id) {
      return await update(wap._id, wap)
    } else {
      return await save(wap)
    }
  } catch (err) {
    logger.error(`cannot publish wap ${wapId}`, err)
    throw err
  }
}

async function addNewSubscriber(wapId, subscriber) {
  try {
    const wap = await getById(wapId)
    const currDate = `${new Date().getDate()}/${
      new Date().getMonth() + 1
    }/${new Date().getFullYear()}`
    wap.subscribers = wap?.subscribers
      ? {
          ...wap?.subscribers,
          [currDate]: wap?.subscribers[currDate] ? [...wap?.subscribers[currDate], subscriber]: [subscriber],
        }
      : { [currDate]: [subscriber] }

    wap.conversionRate = wap.conversionRate
      ? {
          ...wap?.conversionRate,
          [currDate]:
            (wap?.subscribers[currDate].length / wap?.viewCount[currDate]) *
            100,
        }
      : {
          [currDate]:
            (wap?.subscribers[currDate].length / wap?.viewCount[currDate]) *
            100,
        }
    console.log(wap.subscribers)
    await update(wapId, wap)
    return wap
  } catch (err) {
    logger.error(`cannot add subscriber to wap: ${wapId}`, err)
    throw err
  }
}

async function increaseViewCount(wapId) {
  try {
    const wap = await getById(wapId)
    const currDate = `${new Date().getDate()}/${
      new Date().getMonth() + 1
    }/${new Date().getFullYear()}`
    wap.viewCount = wap.viewCount
      ? {
          ...wap.viewCount,
          [currDate]: wap?.viewCount[currDate]
            ? wap?.viewCount[currDate] + 1
            : 1,
        }
      : { [currDate]: 1 }
    await update(wapId, wap)
    return wap
  } catch (err) {
    logger.error(`cannot add subscriber to wap: ${wapId}`, err)
    throw err
  }
}

function _buildCriteria(filterBy) {
  const criteria = {}
  if (filterBy.createdBy) {
    criteria.$or = [
      {
        createdBy: filterBy.createdBy,
      },
    ]
  }
  return criteria
}
