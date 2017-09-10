'use strict'

require('coffee-script/register')
const Helper = require('hubot-test-helper')
const { expect } = require('chai')
const proxyquire = require('proxyquire')
const simpleEncryptor = require('simple-encryptor')

const apiToken = 'DK89YJJRktQ2X0B3i1o7N96Z75pWL2MR'
const apiTokenBad = 'DK89YJJRktQ2X0B3i1o7N96Z75pWL2MZ'
const password = '19QBn1kzsKyuC9IKHz9byjCL8222wuop'
const encryptor = simpleEncryptor(password)
const apiTokenEnc = encryptor.encrypt(apiToken)
const apiTokenEncBad = encryptor.encrypt(apiTokenBad)

class TogglStub {
  constructor (options) {
    this.getUserDataAsync = this.getUserDataAsync.bind(this)
    this.getTimeEntriesAsync = this.getTimeEntriesAsync.bind(this)
    this.apiToken = options.apiToken
    return {
      getUserDataAsync: this.getUserDataAsync,
      getTimeEntriesAsync: this.getTimeEntriesAsync,
      updateTimeEntriesTagsAsync: this.updateTimeEntriesTagsAsync
    }
  }
  getUserDataAsync () {
    return new Promise((resolve, reject) => {
      if (this.apiToken === apiTokenBad) {
        return reject(new Error('Not found'))
      } else {
        return resolve({
          api_token: apiToken,
          fullname: 'Testing User'
        })
      }
    })
  }
  getTimeEntriesAsync () {
    return new Promise((resolve, reject) => {
      if (this.apiToken === apiTokenBad) {
        return reject(new Error('Not found'))
      } else {
        return resolve([
          {
            id: 1,
            duration: 100,
            description: 'Testing 1'
          },
          {
            id: 2,
            duration: 100,
            description: 'Testing 2'
          },
          {
            id: 3,
            tags: 'Pagado',
            duration: 100,
            description: 'Testing 3'
          }
        ])
      }
    })
  }
  updateTimeEntriesTagsAsync () {
    return new Promise(resolve => resolve())
  }
}
const indicadoresStub = () =>
  new Promise(resolve => resolve({ indicator: { uf: 26029.52 } }))

proxyquire('./../src/script.js', {
  'toggl-api': TogglStub,
  indicadoresdeldia: indicadoresStub
})

const helper = new Helper('./../src/index.js')

describe('hubot-toggl-payment', function () {
  describe('valid', () => {
    beforeEach(() => {
      this.room = helper.createRoom({ name: 'user' })
      this.room.robot.adapter.client = {
        rtm: {
          dataStore: {
            getDMByName (name) {
              return { id: name, name }
            }
          }
        }
      }
    })

    afterEach(() => this.room.destroy())

    context('login', () => {
      beforeEach(done => {
        this.room.user.say('user', `hubot toggl login ${apiToken} ${password}`)
        return setTimeout(done, 100)
      })

      it('should get a success message', () =>
        expect(this.room.messages).to.eql([
          ['user', `hubot toggl login ${apiToken} ${password}`],
          ['hubot', 'Login success as Testing User']
        ]))
    })

    context('login user saved', () => {
      beforeEach(done => {
        this.room.robot.brain.data.users.user = { name: 'user' }
        this.room.user.say('user', `hubot toggl login ${apiToken} ${password}`)
        return setTimeout(done, 100)
      })

      it('should get a success message', () =>
        expect(this.room.messages).to.eql([
          ['user', `hubot toggl login ${apiToken} ${password}`],
          ['hubot', 'Login success as Testing User']
        ]))
    })

    context('process time entries', () => {
      beforeEach(done => {
        this.room.robot.brain.data.users.user = {
          toggl: { api_token: apiTokenEnc },
          room: 'user',
          name: 'user'
        }
        this.room.user.say('user', `hubot toggl payment 500000 0.3 ${password}`)
        return setTimeout(done, 100)
      })

      it('should get a success message', () => {
        const message = `Time entries to payment:
Testing 1 00:01:40
Testing 2 00:01:40
Finish. Total time is: 00:03:20`
        return expect(this.room.messages).to.eql([
          ['user', `hubot toggl payment 500000 0.3 ${password}`],
          ['hubot', 'Processing time entries...'],
          ['hubot', `user close tasks successfull\n${message}`],
          ['hubot', message]
        ])
      })
    })

    context('invalid password length', () => {
      beforeEach(done => {
        this.room.user.say('user', 'hubot toggl payment 500000 0.3 123456')
        return setTimeout(done, 100)
      })

      it('should get a error message', () =>
        expect(this.room.messages).to.eql([
          ['user', 'hubot toggl payment 500000 0.3 123456'],
          ['hubot', '@user the secret minimum length must be 16 characters']
        ]))
    })

    context('invalid password length', () => {
      beforeEach(done => {
        this.room.user.say('user', `hubot toggl login ${apiToken} 123456`)
        return setTimeout(done, 100)
      })

      it('should get a error message', () =>
        expect(this.room.messages).to.eql([
          ['user', `hubot toggl login ${apiToken} 123456`],
          ['hubot', '@user the secret minimum length must be 16 characters']
        ]))
    })

    context('error client', () => {
      beforeEach(done => {
        this.room.user.say(
          'user',
          `hubot toggl login ${apiTokenBad} ${password}`
        )
        return setTimeout(done, 100)
      })

      it('should get a error message', () =>
        expect(this.room.messages).to.eql([
          ['user', `hubot toggl login ${apiTokenBad} ${password}`],
          ['hubot', '@user an error occurred in toggl']
        ]))
    })

    context('error client', () => {
      beforeEach(done => {
        this.room.robot.brain.data.users.user = {
          toggl: { api_token: apiTokenEncBad },
          room: 'user',
          name: 'user'
        }
        this.room.user.say('user', `hubot toggl payment 500000 0.3 ${password}`)
        return setTimeout(done, 100)
      })

      it('should get a success message', () =>
        expect(this.room.messages).to.eql([
          ['user', `hubot toggl payment 500000 0.3 ${password}`],
          ['hubot', 'Processing time entries...'],
          ['hubot', '@user an error occurred in toggl']
        ]))
    })
  })

  describe('invalid', function () {
    beforeEach(() => {
      this.room = helper.createRoom({ name: '#random' })
      this.room.robot.adapter.client = {
        rtm: {
          dataStore: {
            getDMByName (name) {
              return { id: name, name }
            }
          }
        }
      }
    })

    afterEach(() => this.room.destroy())

    context('invalid room', () => {
      beforeEach(done => {
        this.room.user.say('user', `hubot toggl login ${apiToken} ${password}`)
        return setTimeout(done, 100)
      })

      it('should get a error message', () =>
        expect(this.room.messages).to.eql([
          ['user', `hubot toggl login ${apiToken} ${password}`],
          ['hubot', 'Send me toggl command'],
          ['hubot', '@user only use this command in a private message']
        ]))
    })

    context('process time entries', () => {
      beforeEach(done => {
        this.room.robot.brain.data.users.user = {
          toggl: { api_token: apiTokenEnc },
          room: 'user',
          name: 'user'
        }
        this.room.user.say('user', `hubot toggl payment 500000 0.3 ${password}`)
        return setTimeout(done, 100)
      })

      it('should get a error message', () =>
        expect(this.room.messages).to.eql([
          ['user', `hubot toggl payment 500000 0.3 ${password}`],
          ['hubot', 'Send me toggl command'],
          ['hubot', '@user only use this command in a private message']
        ]))
    })
  })
})
