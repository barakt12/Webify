const Cryptr = require('cryptr')
const bcrypt = require('bcrypt')
const userService = require('../user/user.service')
const logger = require('../../services/logger.service')
const cryptr = new Cryptr(process.env.SECRET1 || 'Secret-Puk-1234')

async function login(loginWith, password) {
  try {
    const user = await userService.getUser(loginWith)
    if (!user) return Promise.reject('Invalid username or password')

    const match = await bcrypt.compare(password, user.password)
    if (!match) return Promise.reject('Invalid username or password')

    delete user.password
    user._id = user._id.toString()
    return user
  } catch (err) {
    throw err
  }
}

async function loginWithGoogle(credentials) {
  try {
    let user = await userService.getUser({ email: credentials.email })
    if (!user) {
      user = await signup(credentials)
    }

    const match = await bcrypt.compare(credentials.password, user.password)
    if (!match) return Promise.reject('Invalid username or password')
    delete user.password
    user._id = user._id.toString()
    return user
  } catch (err) {
    throw err
  }
}

async function signup({ username, password, email, fullname, imgUrl }) {
  const saltRounds = 10
  logger.debug(`auth.service - signup with username: ${username}, fullname: ${fullname}`)
  if (!username || !password || !email || !fullname) return Promise.reject('Missing required signup information')

  const usernameExist = await userService.getUser(username)
  const emailExist = await userService.getUser(email)
  if (usernameExist) return Promise.reject('Username already taken')
  if (emailExist) return Promise.reject('Email already taken')

  const hash = await bcrypt.hash(password, saltRounds)
  return userService.add({ username, password: hash, email, fullname, imgUrl })
}

function getLoginToken(user) {
  return cryptr.encrypt(JSON.stringify(user))
}

function validateToken(loginToken) {
  try {
    const json = cryptr.decrypt(loginToken)
    const loggedinUser = JSON.parse(json)
    return loggedinUser
  } catch (err) {
    console.log('Invalid login token')
  }
  return null
}

module.exports = {
  signup,
  login,
  getLoginToken,
  validateToken,
  loginWithGoogle,
}
