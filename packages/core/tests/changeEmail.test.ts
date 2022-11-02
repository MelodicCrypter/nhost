import faker from '@faker-js/faker'
import { interpret } from 'xstate'
import { waitFor } from 'xstate/lib/waitFor'
import { AuthClient } from '../src/client'
import { INVALID_EMAIL_ERROR } from '../src/errors'
import { createAuthMachine, createChangeEmailMachine } from '../src/machines'
import { BASE_URL } from './helpers/config'
import { changeEmailInternalErrorHandler, changeEmailNetworkErrorHandler } from './helpers/handlers'
import contextWithUser from './helpers/mocks/contextWithUser'
import server from './helpers/server'
import CustomClientStorage from './helpers/storage'

const customStorage = new CustomClientStorage(new Map())

const authClient = new AuthClient({
  backendUrl: BASE_URL,
  clientUrl: 'http://localhost:3000',
  start: false
})

authClient.interpreter = interpret(
  createAuthMachine({
    backendUrl: BASE_URL,
    clientUrl: 'http://localhost:3000',
    clientStorage: customStorage,
    clientStorageType: 'custom'
  }).withContext(contextWithUser)
).start()

const changeEmailMachine = createChangeEmailMachine(authClient)
const changeEmailService = interpret(changeEmailMachine)

beforeEach(() => {
  changeEmailService.start()
})

afterEach(() => {
  changeEmailService.stop()
  customStorage.clear()
  server.resetHandlers()
})

test(`should fail if there is a network error`, async () => {
  server.use(changeEmailNetworkErrorHandler)

  changeEmailService.send({
    type: 'REQUEST',
    email: faker.internet.email()
  })

  const state = await waitFor(changeEmailService, (state) => state.matches({ idle: 'error' }))

  expect(state.context.error).toMatchInlineSnapshot(`
    {
      "error": "OK",
      "message": "Network Error",
      "status": 200,
    }
  `)
})

test(`should fail if server returns an error`, async () => {
  server.use(changeEmailInternalErrorHandler)

  changeEmailService.send({
    type: 'REQUEST',
    email: faker.internet.email()
  })

  const state = await waitFor(changeEmailService, (state) => state.matches({ idle: 'error' }))

  expect(state.context.error).toMatchInlineSnapshot(`
    {
      "error": "internal-error",
      "message": "Internal error",
      "status": 500,
    }
  `)
})

test(`should fail if email is invalid`, async () => {
  changeEmailService.send({
    type: 'REQUEST',
    email: faker.internet.userName()
  })

  const state = await waitFor(changeEmailService, (state) => state.matches({ idle: 'error' }))

  expect(state.context.error).toMatchObject(INVALID_EMAIL_ERROR)
})

test(`should succeed if email is valid`, async () => {
  changeEmailService.send({ type: 'REQUEST', email: faker.internet.email() })

  const state = await waitFor(changeEmailService, (state) => state.matches({ idle: 'success' }))

  expect(state.context.error).toBeNull()
})
