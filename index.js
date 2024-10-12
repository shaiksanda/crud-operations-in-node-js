const express = require('express')
const path = require('path')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')

const app = express()
const dbPath = path.join(__dirname, 'goodreads.db')
app.use(express.json())

let db = null

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('Server Running at http://localhost:3000/')
    })
  } catch (e) {
    console.log(`DB Error: ${e.message}`)
    process.exit(1)
  }
}

initializeDBAndServer()

// Get Books API
app.get('/books', async (request, response) => {
  try {
    const getBooksQuery = `
      SELECT *
      FROM book
      ORDER BY book_id;`
    const booksArray = await db.all(getBooksQuery)
    response.send(booksArray)
  } catch (e) {
    response.status(500).send({error: 'Failed to fetch books'})
  }
})

// Get Book API
app.get('/books/:bookId', async (request, response) => {
  const {bookId} = request.params
  try {
    const getBookQuery = `SELECT * FROM book WHERE book_id = ?`
    const book = await db.get(getBookQuery, [bookId])
    if (book) {
      response.send(book)
    } else {
      response.status(404).send({error: 'Book not found'})
    }
  } catch (e) {
    response.status(500).send({error: 'Failed to fetch book'})
  }
})

// Add Book API

app.post('/books', async (request, response) => {
  const bookDetails = request.body
  const {
    title,
    authorId,
    rating,
    ratingCount,
    reviewCount,
    description,
    pages,
    dateOfPublication,
    editionLanguage,
    price,
    onlineStores,
  } = bookDetails

  // Optional: Add input validation here if needed

  const addBookQuery = `
    INSERT INTO book (title, author_id, rating, rating_count, review_count, description, pages, 
    date_of_publication, edition_language, price, online_stores)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`

  try {
    const dbResponse = await db.run(addBookQuery, [
      title,
      authorId,
      rating,
      ratingCount,
      reviewCount,
      description,
      pages,
      dateOfPublication,
      editionLanguage,
      price,
      onlineStores,
    ])

    const bookId = dbResponse.lastID
    response.status(201).send({bookId: bookId})
  } catch (error) {
    console.error(`Error inserting book: ${error.message}`)
    response.status(500).send({error: 'Failed to add book'})
  }
})

// Update Book API
app.put('/books/:bookId', async (request, response) => {
  const {bookId} = request.params
  const bookDetails = request.body
  const {
    title,
    authorId,
    rating,
    ratingCount,
    reviewCount,
    description,
    pages,
    dateOfPublication,
    editionLanguage,
    price,
    onlineStores,
  } = bookDetails

  const updateBookQuery = `
    UPDATE book 
    SET 
      title = ?, 
      author_id = ?, 
      rating = ?, 
      rating_count = ?, 
      review_count = ?, 
      description = ?, 
      pages = ?, 
      date_of_publication = ?, 
      edition_language = ?, 
      price = ?, 
      online_stores = ? 
    WHERE book_id = ?;`

  try {
    const result = await db.run(updateBookQuery, [
      title,
      authorId,
      rating,
      ratingCount,
      reviewCount,
      description,
      pages,
      dateOfPublication,
      editionLanguage,
      price,
      onlineStores,
      bookId,
    ])

    if (result.changes > 0) {
      response.send('Book Updated Successfully')
    } else {
      response.status(404).send({error: 'Book not found or no changes made'})
    }
  } catch (e) {
    response.status(500).send({error: 'Failed to update book'})
  }
})

// Delete Book API

app.delete('/books/:bookId', async (request, response) => {
  const {bookId} = request.params
  const deleteBookQuery = `delete from book where book_id=?`
  await db.run(deleteBookQuery, [bookId])
  response.send('Book Deleted Successfully')
})

// Authors Book API

app.get('/authors/:authorId/books/', async (req, res) => {
  const {authorId} = req.params
  const getAuthorBooksQuery = `select * from book where author_id=?`
  const booksArray = await db.all(getAuthorBooksQuery, [authorId])
  res.send(booksArray)
})
