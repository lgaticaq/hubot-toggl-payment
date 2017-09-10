// Description
//   A Hubot script to close time entries for new payment
//
// Dependencies:
//   "bluebird": "^3.5.0"
//   "indicadoresdeldia": "0.0.3"
//   "parse-ms": "^1.0.1"
//   "simple-encryptor": "^1.1.0"
//   "toggl-api": "^1.0.1"
//
// Configuration:
//   TOGGL_CHANNEL
//
// Commands:
//   hubot toggl login <token> <password> - Login to Toggl
//   hubot toggl payment <amount> <price> <password> - Close time entries for the amount and price
//
// Author:
//   lgaticaq

const parseMs = require('parse-ms')
const TogglClient = require('toggl-api')
const Promise = require('bluebird')
const simpleEncryptor = require('simple-encryptor')
const indicadores = require('indicadoresdeldia')

const getClient = token => {
  const toggl = new TogglClient({ apiToken: token })
  Promise.promisifyAll(Object.getPrototypeOf(toggl))
  return toggl
}

const pad = (n, width, z) => {
  if (z == null) z = '0'
  n = n + ''
  if (n.length >= width) {
    return n
  } else {
    return new Array(width - n.length + 1).join(z) + n
  }
}

const parseDuration = duration => {
  const ms = parseMs(duration * 1000)
  return `${pad(ms.hours, 2)}:${pad(ms.minutes, 2)}:${pad(ms.seconds, 2)}`
}

const processTimeEntries = (timeEntries, amount, price) => {
  return indicadores().then(data => {
    const limit = amount / (data.indicator.uf * price) * 3600
    const teIds = []
    let duration = 0
    let message = 'Time entries to payment:\n'
    Array.from(timeEntries).forEach(i => {
      if (duration + i.duration < limit && i.tags == null) {
        duration += i.duration
        teIds.push(i.id)
        message += `${i.description} ${parseDuration(i.duration)}\n`
      }
    })
    message += `Finish. Total time is: ${parseDuration(duration)}`
    return { message, teIds }
  })
}

module.exports = robot => {
  robot.respond(/toggl login (\w{32}) ([\w\W\d\s]+)/, res => {
    const token = res.match[1]
    const secret = res.match[2]
    const room = robot.adapter.client.rtm.dataStore.getDMByName(
      res.message.user.name
    )
    if (res.message.room !== room.id) {
      res.reply('only use this command in a private message')
      robot.send({ room: room.id }, 'Send me toggl command')
      return
    }
    if (secret.length < 16) {
      res.reply('the secret minimum length must be 16 characters')
      return
    }
    const toggl = getClient(token)
    const encryptor = simpleEncryptor(secret)
    toggl
      .getUserDataAsync({})
      .then(userData => {
        if (robot.brain.data.users[res.message.user.id] == null) {
          robot.brain.data.users[res.message.user.id] = {
            name: res.message.user.name
          }
          robot.brain.save()
        }
        let user = robot.brain.userForName(res.message.user.name)
        user.toggl = { api_token: encryptor.encrypt(userData.api_token) }
        robot.brain.save()
        res.send(`Login success as ${userData.fullname}`)
      })
      .catch(err => {
        res.reply('an error occurred in toggl')
        robot.emit('error', err)
      })
  })

  robot.respond(/toggl payment (\d+) (\d*(\.\d+)) ([\w\W\d\s]+)/, res => {
    const amount = res.match[1]
    const price = res.match[2]
    const secret = res.match[4]
    const channel = process.env.TOGGL_CHANNEL || '#random'
    const room = robot.adapter.client.rtm.dataStore.getDMByName(
      res.message.user.name
    )
    if (res.message.room !== room.id) {
      res.reply('only use this command in a private message')
      robot.send({ room: room.id }, 'Send me toggl command')
      return
    }
    if (secret.length < 16) {
      res.reply('the secret minimum length must be 16 characters')
      return
    }
    res.send('Processing time entries...')
    const tags = ['Pagado']
    const action = 'add'
    const today = new Date()
    const end = today.toISOString()
    today.setFullYear(today.getFullYear() - 1)
    const start = today.toISOString()
    const user = robot.brain.userForName(res.message.user.name)
    const encryptor = simpleEncryptor(secret)
    let message = ''
    const toggl = getClient(encryptor.decrypt(user.toggl.api_token))
    toggl
      .getTimeEntriesAsync(start, end)
      .then(timeEntries => processTimeEntries(timeEntries, amount, price))
      .then(data => {
        message = data.message
        return toggl.updateTimeEntriesTagsAsync(data.teIds, tags, action)
      })
      .then(() => {
        res.send(message)
        const welcome = `${res.message.user.name} close tasks successfull`
        robot.messageRoom(channel, `${welcome}\n${message}`)
      })
      .catch(err => {
        res.reply('an error occurred in toggl')
        robot.emit('error', err)
      })
  })
}
