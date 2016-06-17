# Description
#   A Hubot script to close time entries for new payment
#
# Dependencies:
#   "bluebird": "^3.2.1",
#   "moment": "^2.11.2",
#   "request-promise": "^2.0.0",
#   "simple-encryptor": "^1.0.3",
#   "toggl-api": "0.0.4"
#
# Configuration:
#   TOGGL_CHANNEL
#
# Commands:
#   hubot toggl login <token> <password> - Login to Toggl
#   hubot toggl payment <amount> <price> <password> - Close time entries for
#     the amount and price
#
# Author:
#   lgaticaq

moment = require "moment"
rp = require "request-promise"
TogglClient = require "toggl-api"
Promise = require "bluebird"
simpleEncryptor = require "simple-encryptor"

getClient = (token) ->
  toggl = new TogglClient apiToken: token
  Promise.promisifyAll Object.getPrototypeOf toggl
  toggl

getUf = () ->
  options =
    url: "http://indicadoresdeldia.cl/webservice/indicadores.json"
    json: true
    transform: (body) ->
      parseFloat body.indicador.uf.replace(/[$.]/g, "").replace(",", ".")
  rp options

parseDuration = (duration) ->
  return moment.utc(duration * 1000).format("HH:mm:ss")

process = (timeEntries, amount, price) ->
  new Promise (resolve, reject) ->
    getUf().then (uf) ->
      limit = (amount / (uf * price)) * 3600
      teIds = []
      duration = 0
      message = "Time entries to payment:\n"
      for i in timeEntries
        if ((duration + i.duration) < limit) and not i.tags?
          duration += i.duration
          teIds.push i.id
          message += "#{i.description} #{parseDuration(i.duration)}\n"
      message += "Finish. Total time is: #{parseDuration(duration)}"
      resolve {message: message, teIds: teIds}
    .catch reject

module.exports = (robot) ->
  robot.respond /toggl login (\w{32}) ([\w\W\d\s]+)/, (res) ->
    token = res.match[1]
    secret = res.match[2]
    unless res.message.room is res.message.user.name
      res.reply "only use this command in a private message"
      robot.send {room: res.message.user.name}, "Send me toggl command"
      return
    if secret.length < 16
      res.reply "the secret minimum length must be 16 characters"
      return
    toggl = getClient token
    encryptor = simpleEncryptor secret
    toggl.getUserDataAsync({}).then (userData) ->
      unless robot.brain.data.users[res.message.user.id]?
        robot.brain.data.users[res.message.user.id] =
          name: res.message.user.name
        robot.brain.save()
      user = robot.brain.userForName res.message.user.name
      user.toggl =
        api_token: encryptor.encrypt userData.api_token
      robot.brain.save()
      res.send "Login success as #{userData.fullname}"
    .catch (err) ->
      res.reply "an error occurred in toggl"
      robot.emit "error", err

  robot.respond /toggl payment (\d+) (\d*(\.\d+)) ([\w\W\d\s]+)/, (res) ->
    amount = res.match[1]
    price = res.match[2]
    secret = res.match[4]
    channel = process.env.TOGGL_CHANNEL or "#random"
    unless res.message.room is res.message.user.name
      res.reply "only use this command in a private message"
      robot.send {room: res.message.user.name}, "Send me toggl command"
      return
    if secret.length < 16
      res.reply "the secret minimum length must be 16 characters"
      return
    res.send "Processing time entries..."
    tags = ["Pagado"]
    action = "add"
    end = moment().toISOString()
    start = moment().subtract(1, "years").toISOString()
    user = robot.brain.userForName res.message.user.name
    encryptor = simpleEncryptor secret
    message = ""
    toggl = getClient encryptor.decrypt user.toggl.api_token
    toggl.getTimeEntriesAsync(start, end).then (timeEntries) ->
      process timeEntries, amount, price
    .then (data) ->
      message = data.message
      toggl.updateTimeEntriesTagsAsync data.teIds, tags, action
    .then () ->
      res.send message
      welcome = "#{msg.message.user.name} close tasks successfull"
      robot.messageRoom(channel, "#{welcome}\n#{message}")
    .catch (err) ->
      res.reply "an error occurred in toggl"
      robot.emit "error", err
