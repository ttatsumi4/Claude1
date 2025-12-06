const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const axios = require('axios');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// ミドルウェア
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// データベース初期化
const db = new sqlite3.Database('./library.db', (err) => {
  if (err) {
    console.error('データベース接続エラー:', err.message);
  } else {
    console.log('SQLiteデータベースに接続しました');
  }
});

// テーブル作成
db.run(`
  CREATE TABLE IF NOT EXISTS borrowed_books (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    isbn TEXT NOT NULL,
    title TEXT NOT NULL,
    authors TEXT,
    publisher TEXT,
    published_date TEXT,
    description TEXT,
    thumbnail TEXT,
    borrow_date TEXT NOT NULL,
    return_date TEXT,
    status TEXT DEFAULT 'borrowed',
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// API エンドポイント

// ISBNから書籍情報を取得
app.get('/api/isbn/:isbn', async (req, res) => {
  const { isbn } = req.params;

  try {
    const response = await axios.get(
      `https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}`
    );

    if (response.data.totalItems === 0) {
      return res.status(404).json({ error: '書籍が見つかりませんでした' });
    }

    const bookData = response.data.items[0].volumeInfo;
    const book = {
      isbn: isbn,
      title: bookData.title || '不明',
      authors: bookData.authors ? bookData.authors.join(', ') : '不明',
      publisher: bookData.publisher || '不明',
      published_date: bookData.publishedDate || '不明',
      description: bookData.description || '',
      thumbnail: bookData.imageLinks?.thumbnail || ''
    };

    res.json(book);
  } catch (error) {
    console.error('ISBN検索エラー:', error.message);
    res.status(500).json({ error: '書籍情報の取得に失敗しました' });
  }
});

// 借りた本の一覧を取得
app.get('/api/books', (req, res) => {
  const sql = 'SELECT * FROM borrowed_books ORDER BY created_at DESC';

  db.all(sql, [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

// 借りた本を追加
app.post('/api/books', (req, res) => {
  const { isbn, title, authors, publisher, published_date, description, thumbnail, borrow_date, notes } = req.body;

  const sql = `
    INSERT INTO borrowed_books (isbn, title, authors, publisher, published_date, description, thumbnail, borrow_date, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  db.run(sql, [isbn, title, authors, publisher, published_date, description, thumbnail, borrow_date, notes], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ id: this.lastID, message: '本を追加しました' });
  });
});

// 借りた本の情報を更新
app.put('/api/books/:id', (req, res) => {
  const { id } = req.params;
  const { return_date, status, notes } = req.body;

  const sql = `
    UPDATE borrowed_books
    SET return_date = ?, status = ?, notes = ?
    WHERE id = ?
  `;

  db.run(sql, [return_date, status, notes, id], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: '本が見つかりませんでした' });
    }
    res.json({ message: '本の情報を更新しました' });
  });
});

// 借りた本を削除
app.delete('/api/books/:id', (req, res) => {
  const { id } = req.params;

  const sql = 'DELETE FROM borrowed_books WHERE id = ?';

  db.run(sql, [id], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: '本が見つかりませんでした' });
    }
    res.json({ message: '本を削除しました' });
  });
});

// サーバー起動
app.listen(PORT, () => {
  console.log(`サーバーが起動しました: http://localhost:${PORT}`);
});

// プロセス終了時にデータベースを閉じる
process.on('SIGINT', () => {
  db.close((err) => {
    if (err) {
      console.error(err.message);
    }
    console.log('データベース接続を閉じました');
    process.exit(0);
  });
});
