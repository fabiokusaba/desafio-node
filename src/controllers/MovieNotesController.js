const knex = require('../database/knex')

class MovieNotesController {
  async create(request, response) {
    const { title, description, rating, movie_tags } = request.body
    const { user_id } = request.params

    const [movie_id] = await knex('movie_notes').insert({
      title,
      description,
      rating,
      user_id
    })

    const tagInsert = movie_tags.map(name => {
      return {
        movie_id,
        user_id,
        name
      }
    })

    await knex('movie_tags').insert(tagInsert)

    response.json()
  }

  async show(request, response) {
    const { id } = request.params

    const movieNote = await knex('movie_notes').where({ id }).first()
    const movieTags = await knex('movie_tags').where({ movie_id: id }).orderBy('name')

    return response.json({
      ...movieNote,
      movieTags
    })
  }

  async delete(request, response) {
    const { id } = request.params

    await knex('movie_notes').where({ id }).delete()

    return response.json()
  }

  async index(request, response) {
    const { title, user_id, movie_tags } = request.query

    let movieNotes

    if (movie_tags) {
      const filterTags = movie_tags.split(',').map(tag => tag.trim())

      movieNotes = await knex('movie_tags')
        .select(['movie_notes.id', 'movie_notes.title', 'movie_notes.user_id'])
        .where('movie_notes.user_id', user_id)
        .whereLike('movie_notes.title', `%${title}%`)
        .whereIn('name', filterTags)
        .innerJoin('movie_notes', 'movie_notes.id', 'movie_tags.movie_id')
        .orderBy('movie_notes.title')

    } else {
      movieNotes = await knex('movie_notes')
        .where({ user_id })
        .whereLike('title', `%${title}%`)
        .orderBy('title')
    }

    const userTags = await knex('movie_tags').where({ user_id })
    const movieNotesWithTags = movieNotes.map(note => {
      const noteTags = userTags.filter(tag => tag.movie_id === note.id)

      return {
        ...note,
        tags: noteTags
      }
    })

    return response.json({ movieNotesWithTags })
  }
}

module.exports = MovieNotesController