const { Router } = require('express')

const usersRouter = require('./users.routes')
const movieNotesRouter = require('./movienotes.routes')

const routes = Router()

routes.use('/users', usersRouter)
routes.use('/movie_notes', movieNotesRouter)

module.exports = routes