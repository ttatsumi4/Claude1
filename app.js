// ローカルストレージのキー
const STORAGE_KEY = 'libraryBooks';

// DOM要素
const isbnInput = document.getElementById('isbnInput');
const searchBtn = document.getElementById('searchBtn');
const searchResult = document.getElementById('searchResult');
const addSection = document.getElementById('addSection');
const addBookForm = document.getElementById('addBookForm');
const booksList = document.getElementById('booksList');
const updateModal = document.getElementById('updateModal');
const updateBookForm = document.getElementById('updateBookForm');
const closeModal = document.querySelector('.close');
const filterBtns = document.querySelectorAll('.filter-btn');

// 現在のフィルター
let currentFilter = 'all';

// 現在の本のデータ
let currentBookData = null;

// イベントリスナー
searchBtn.addEventListener('click', searchByISBN);
isbnInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    searchByISBN();
  }
});
addBookForm.addEventListener('submit', addBook);
updateBookForm.addEventListener('submit', updateBook);
closeModal.addEventListener('click', () => {
  updateModal.style.display = 'none';
});
window.addEventListener('click', (e) => {
  if (e.target === updateModal) {
    updateModal.style.display = 'none';
  }
});
filterBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    filterBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentFilter = btn.dataset.filter;
    loadBooks();
  });
});

// 初期化
document.addEventListener('DOMContentLoaded', () => {
  loadBooks();
  // 今日の日付を借りた日のデフォルトに設定
  document.getElementById('borrowDate').valueAsDate = new Date();
});

// ローカルストレージから本のデータを取得
function getBooksFromStorage() {
  const booksJson = localStorage.getItem(STORAGE_KEY);
  return booksJson ? JSON.parse(booksJson) : [];
}

// ローカルストレージに本のデータを保存
function saveBooksToStorage(books) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(books));
}

// 次のIDを生成
function getNextId() {
  const books = getBooksFromStorage();
  if (books.length === 0) return 1;
  return Math.max(...books.map(b => b.id)) + 1;
}

// ISBNで本を検索 (Google Books APIを直接呼び出し)
async function searchByISBN() {
  const isbn = isbnInput.value.trim();

  if (!isbn) {
    showError('ISBNコードを入力してください');
    return;
  }

  searchBtn.disabled = true;
  searchBtn.textContent = '検索中...';
  searchResult.innerHTML = '';

  try {
    // Google Books APIを直接呼び出し
    const response = await fetch(
      `https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}`
    );

    if (!response.ok) {
      throw new Error('書籍情報の取得に失敗しました');
    }

    const data = await response.json();

    if (data.totalItems === 0) {
      throw new Error('書籍が見つかりませんでした');
    }

    const bookData = data.items[0].volumeInfo;
    const book = {
      isbn: isbn,
      title: bookData.title || '不明',
      authors: bookData.authors ? bookData.authors.join(', ') : '不明',
      publisher: bookData.publisher || '不明',
      published_date: bookData.publishedDate || '不明',
      description: bookData.description || '',
      thumbnail: bookData.imageLinks?.thumbnail || ''
    };

    currentBookData = book;
    displaySearchResult(book);
    showAddSection(book);
  } catch (error) {
    showError(error.message);
    addSection.style.display = 'none';
  } finally {
    searchBtn.disabled = false;
    searchBtn.textContent = '検索';
  }
}

// 検索結果を表示
function displaySearchResult(book) {
  const html = `
    <div class="book-preview">
      ${book.thumbnail ? `<img src="${book.thumbnail}" alt="${book.title}">` : '<div style="width: 120px; height: 160px; background: #ddd; display: flex; align-items: center; justify-content: center; border-radius: 5px;">画像なし</div>'}
      <div class="book-preview-info">
        <h3>${escapeHtml(book.title)}</h3>
        <p><strong>著者:</strong> ${escapeHtml(book.authors)}</p>
        <p><strong>出版社:</strong> ${escapeHtml(book.publisher)}</p>
        <p><strong>出版日:</strong> ${escapeHtml(book.published_date)}</p>
        <p><strong>ISBN:</strong> ${escapeHtml(book.isbn)}</p>
        ${book.description ? `<p><strong>説明:</strong> ${escapeHtml(book.description.substring(0, 200))}${book.description.length > 200 ? '...' : ''}</p>` : ''}
      </div>
    </div>
  `;
  searchResult.innerHTML = html;
}

// 追加セクションを表示
function showAddSection(book) {
  document.getElementById('bookIsbn').value = book.isbn;
  document.getElementById('bookTitle').value = book.title;
  document.getElementById('bookAuthors').value = book.authors;
  document.getElementById('bookPublisher').value = book.publisher;
  document.getElementById('bookPublishedDate').value = book.published_date;
  document.getElementById('bookDescription').value = book.description || '';
  document.getElementById('bookThumbnail').value = book.thumbnail || '';
  document.getElementById('bookNotes').value = '';

  addSection.style.display = 'block';
  addSection.scrollIntoView({ behavior: 'smooth' });
}

// 本を追加 (ローカルストレージに保存)
function addBook(e) {
  e.preventDefault();

  const books = getBooksFromStorage();
  const newBook = {
    id: getNextId(),
    isbn: document.getElementById('bookIsbn').value,
    title: document.getElementById('bookTitle').value,
    authors: document.getElementById('bookAuthors').value,
    publisher: document.getElementById('bookPublisher').value,
    published_date: document.getElementById('bookPublishedDate').value,
    description: document.getElementById('bookDescription').value,
    thumbnail: document.getElementById('bookThumbnail').value,
    borrow_date: document.getElementById('borrowDate').value,
    return_date: null,
    status: 'borrowed',
    notes: document.getElementById('bookNotes').value,
    created_at: new Date().toISOString()
  };

  books.push(newBook);
  saveBooksToStorage(books);

  showSuccess('本を追加しました');
  addBookForm.reset();
  addSection.style.display = 'none';
  searchResult.innerHTML = '';
  isbnInput.value = '';
  document.getElementById('borrowDate').valueAsDate = new Date();
  loadBooks();
}

// 借りた本の一覧を読み込み (ローカルストレージから)
function loadBooks() {
  const books = getBooksFromStorage();
  displayBooks(books);
}

// 本の一覧を表示
function displayBooks(books) {
  // 作成日時の降順でソート
  books.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  // フィルター適用
  let filteredBooks = books;
  if (currentFilter !== 'all') {
    filteredBooks = books.filter(book => book.status === currentFilter);
  }

  if (filteredBooks.length === 0) {
    booksList.innerHTML = '<div class="empty-state"><p>まだ本が登録されていません</p></div>';
    return;
  }

  const html = filteredBooks.map(book => `
    <div class="book-card">
      <div class="book-card-header">
        ${book.thumbnail ? `<img src="${book.thumbnail}" alt="${escapeHtml(book.title)}">` : '<div style="width: 80px; height: 100px; background: #ddd; border-radius: 5px;"></div>'}
        <div class="book-card-title">
          <h3>${escapeHtml(book.title)}</h3>
          <p>${escapeHtml(book.authors)}</p>
        </div>
      </div>
      <div class="book-card-info">
        <p><strong>ISBN:</strong> ${escapeHtml(book.isbn)}</p>
        <p><strong>借りた日:</strong> ${formatDate(book.borrow_date)}</p>
        ${book.return_date ? `<p><strong>返却日:</strong> ${formatDate(book.return_date)}</p>` : ''}
        ${book.notes ? `<p><strong>メモ:</strong> ${escapeHtml(book.notes)}</p>` : ''}
        <span class="status-badge status-${book.status}">
          ${book.status === 'borrowed' ? '借用中' : '返却済み'}
        </span>
      </div>
      <div class="book-card-actions">
        <button class="btn btn-update" onclick="openUpdateModal(${book.id})">更新</button>
        <button class="btn btn-delete" onclick="deleteBook(${book.id})">削除</button>
      </div>
    </div>
  `).join('');

  booksList.innerHTML = html;
}

// 更新モーダルを開く
function openUpdateModal(id) {
  const books = getBooksFromStorage();
  const book = books.find(b => b.id === id);

  if (!book) {
    showError('本が見つかりませんでした');
    return;
  }

  document.getElementById('updateBookId').value = book.id;
  document.getElementById('updateReturnDate').value = book.return_date || '';
  document.getElementById('updateStatus').value = book.status;
  document.getElementById('updateNotes').value = book.notes || '';

  updateModal.style.display = 'block';
}

// 本の情報を更新 (ローカルストレージ)
function updateBook(e) {
  e.preventDefault();

  const id = parseInt(document.getElementById('updateBookId').value);
  const books = getBooksFromStorage();
  const bookIndex = books.findIndex(b => b.id === id);

  if (bookIndex === -1) {
    showError('本が見つかりませんでした');
    return;
  }

  books[bookIndex].return_date = document.getElementById('updateReturnDate').value;
  books[bookIndex].status = document.getElementById('updateStatus').value;
  books[bookIndex].notes = document.getElementById('updateNotes').value;

  saveBooksToStorage(books);

  showSuccess('本の情報を更新しました');
  updateModal.style.display = 'none';
  loadBooks();
}

// 本を削除 (ローカルストレージから)
function deleteBook(id) {
  if (!confirm('この本を削除してもよろしいですか?')) {
    return;
  }

  const books = getBooksFromStorage();
  const filteredBooks = books.filter(b => b.id !== id);

  saveBooksToStorage(filteredBooks);
  showSuccess('本を削除しました');
  loadBooks();
}

// 日付をフォーマット
function formatDate(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('ja-JP');
}

// HTMLエスケープ（XSS対策）
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// エラーメッセージを表示
function showError(message) {
  searchResult.innerHTML = `<div class="error-message">${escapeHtml(message)}</div>`;
  setTimeout(() => {
    if (searchResult.innerHTML.includes('error-message')) {
      searchResult.innerHTML = '';
    }
  }, 5000);
}

// 成功メッセージを表示
function showSuccess(message) {
  const successDiv = document.createElement('div');
  successDiv.className = 'success-message';
  successDiv.textContent = message;
  document.querySelector('main').insertBefore(successDiv, document.querySelector('main').firstChild);

  setTimeout(() => {
    successDiv.remove();
  }, 3000);
}
