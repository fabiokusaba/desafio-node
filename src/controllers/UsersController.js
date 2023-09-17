const { hash, compare } = require('bcryptjs')
const AppError = require('../utils/AppError')
const sqliteConnection = require('../database/sqlite')

class UsersController {
  async create(request, response) {
    const { name, email, password } = request.body

    const db = await sqliteConnection()
    const checkUserExists = await db.get('SELECT * FROM users WHERE email = (?)', [email])

    if (checkUserExists) {
      throw new AppError('Este e-mail já está em uso')
    }

    const hashedPassword = await hash(password, 8)

    await db.run('INSERT INTO users (name, email, password) VALUES (?, ?, ?)', [name, email, hashedPassword])

    return response.status(201).json()
  }

  async update(request, response) {
    const { name, email, password, old_password } = request.body
    const { id } = request.params

    const db = await sqliteConnection()
    const user = await db.get('SELECT * FROM users WHERE id = (?)', [id])

    if (!user) {
      throw new AppError('Usuário não encontrado')
    }

    const userWithUpdatedEmail = await db.get('SELECT * FROM users WHERE email = (?)', [email])

    if (userWithUpdatedEmail && userWithUpdatedEmail.id !== user.id) {
      throw new AppError('Este e-mail já está em uso')
    }

    user.name = name ?? user.name
    user.email = email ?? user.email

    if (password && !old_password) {
      throw new AppError('Você precisa informar a senha antiga para definir a nova senha')
    }

    if (password && old_password) {
      const checkOldPassword = await compare(old_password, user.password)

      if (!checkOldPassword) {
        throw new AppError('A senha antiga não confere')
      }

      user.password = await hash(password, 8)
    }

    await db.run('UPDATE users SET name = ?, email = ?, password = ? WHERE id = ?', [user.name, user.email, user.password, id])

    return response.json()
  }

  async delete(request, response) {
    const { id } = request.params

    const db = await sqliteConnection()

    const userExists = await db.get('SELECT * FROM users WHERE id = (?)', [id])

    if (!userExists) {
      throw new AppError('Usuário não encontrado')
    }

    await db.run('DELETE FROM users WHERE id = (?)', [id])

    return response.json()
  }

  async index(request, response) {
    const db = await sqliteConnection()

    const users = await db.all('SELECT * FROM users')

    if (!users) {
      throw new AppError('Nenhum usuário encontrado')
    }

    return response.json(users)
  }

  async show(request, response) {
    const { id } = request.params

    const db = await sqliteConnection()
    const userExists = await db.get('SELECT * FROM users WHERE id = (?)', [id])

    if (!userExists) {
      throw new AppError('Usuário não encontrado')
    }

    return response.json(userExists)
  }
}

module.exports = UsersController