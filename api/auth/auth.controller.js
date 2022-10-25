const authService = require('./auth.service')
const logger = require('../../services/logger.service')

async function login(req, res) {
  const { username, email, password, googleLogin } = req.body
  try {
    let user
    const loginWith = username ? { username } : { email }
    if (googleLogin) {
      user = await authService.loginWithGoogle(req.body)
    } else {
      user = await authService.login(loginWith, password)
    }
    const loginToken = authService.getLoginToken(user)
    logger.info('User login: ', user.email)
    res.cookie('loginToken', loginToken)
    res.json(user)
  } catch (err) {
    logger.error('Failed to Login ' + err)
    res.status(401).send({ err })
  }
}

async function signup(req, res) {
  try {
    const credentials = req.body
    const account = await authService.signup(credentials)
    logger.debug(`auth.route - new account created: ` + JSON.stringify(account))
    const { username, password } = credentials
    const loginWith = { username }
    const user = await authService.login(loginWith, password)
    logger.info('User signup:', user)
    const loginToken = authService.getLoginToken(user)
    res.cookie('loginToken', loginToken)
    res.json(user)
  } catch (err) {
    logger.error('Failed to signup ' + err)
    res.status(500).send({ err })
  }
}

async function logout(req, res) {
  try {
    res.clearCookie('loginToken')
    res.send({ msg: 'Logged out successfully' })
  } catch (err) {
    res.status(500).send({ err: 'Failed to logout' })
  }
}

module.exports = {
  login,
  signup,
  logout,
}
