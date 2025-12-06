// API ベースURL
const API_BASE = '/api';

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

// ISBNで本を検索
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
    const response = await fetch(`${API_BASE}/isbn/${isbn}`);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || '書籍情報の取得に失敗しました');
    }

    currentBookData = data;
    displaySearchResult(data);
    showAddSection(data);
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
        <h3>${book.title}</h3>
        <p><strong>著者:</strong> ${book.authors}</p>
        <p><strong>出版社:</strong> ${book.publisher}</p>
        <p><strong>出版日:</strong> ${book.published_date}</p>
        <p><strong>ISBN:</strong> ${book.isbn}</p>
        ${book.description ? `<p><strong>説明:</strong> ${book.description.substring(0, 200)}${book.description.length > 200 ? '...' : ''}</p>` : ''}
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

// 本を追加
async function addBook(e) {
  e.preventDefault();

  const bookData = {
    isbn: document.getElementById('bookIsbn').value,
    title: document.getElementById('bookTitle').value,
    authors: document.getElementById('bookAuthors').value,
    publisher: document.getElementById('bookPublisher').value,
    published_date: document.getElementById('bookPublishedDate').value,
    description: document.getElementById('bookDescription').value,
    thumbnail: document.getElementById('bookThumbnail').value,
    borrow_date: document.getElementById('borrowDate').value,
    notes: document.getElementById('bookNotes').value
  };

  try {
    const response = await fetch(`${API_BASE}/books`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(bookData)
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || '本の追加に失敗しました');
    }

    showSuccess('本を追加しました');
    addBookForm.reset();
    addSection.style.display = 'none';
    searchResult.innerHTML = '';
    isbnInput.value = '';
    document.getElementById('borrowDate').valueAsDate = new Date();
    loadBooks();
  } catch (error) {
    showError(error.message);
  }
}

// 借りた本の一覧を読み込み
async function loadBooks() {
  try {
    const response = await fetch(`${API_BASE}/books`);
    const books = await response.json();

    if (!response.ok) {
      throw new Error('本の一覧の取得に失敗しました');
    }

    displayBooks(books);
  } catch (error) {
    showError(error.message);
  }
}

// 本の一覧を表示
function displayBooks(books) {
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
        ${book.thumbnail ? `<img src="${book.thumbnail}" alt="${book.title}">` : '<div style="width: 80px; height: 100px; background: #ddd; border-radius: 5px;"></div>'}
        <div class="book-card-title">
          <h3>${book.title}</h3>
          <p>${book.authors}</p>
        </div>
      </div>
      <div class="book-card-info">
        <p><strong>ISBN:</strong> ${book.isbn}</p>
        <p><strong>借りた日:</strong> ${formatDate(book.borrow_date)}</p>
        ${book.return_date ? `<p><strong>返却日:</strong> ${formatDate(book.return_date)}</p>` : ''}
        ${book.notes ? `<p><strong>メモ:</strong> ${book.notes}</p>` : ''}
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
async function openUpdateModal(id) {
  try {
    const response = await fetch(`${API_BASE}/books`);
    const books = await response.json();
    const book = books.find(b => b.id === id);

    if (!book) {
      throw new Error('本が見つかりませんでした');
    }

    document.getElementById('updateBookId').value = book.id;
    document.getElementById('updateReturnDate').value = book.return_date || '';
    document.getElementById('updateStatus').value = book.status;
    document.getElementById('updateNotes').value = book.notes || '';

    updateModal.style.display = 'block';
  } catch (error) {
    showError(error.message);
  }
}

// 本の情報を更新
async function updateBook(e) {
  e.preventDefault();

  const id = document.getElementById('updateBookId').value;
  const updateData = {
    return_date: document.getElementById('updateReturnDate').value,
    status: document.getElementById('updateStatus').value,
    notes: document.getElementById('updateNotes').value
  };

  try {
    const response = await fetch(`${API_BASE}/books/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updateData)
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || '本の更新に失敗しました');
    }

    showSuccess('本の情報を更新しました');
    updateModal.style.display = 'none';
    loadBooks();
  } catch (error) {
    showError(error.message);
  }
}

// 本を削除
async function deleteBook(id) {
  if (!confirm('この本を削除してもよろしいですか?')) {
    return;
  }

  try {
    const response = await fetch(`${API_BASE}/books/${id}`, {
      method: 'DELETE'
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || '本の削除に失敗しました');
    }

    showSuccess('本を削除しました');
    loadBooks();
  } catch (error) {
    showError(error.message);
  }
}

// 日付をフォーマット
function formatDate(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('ja-JP');
}

// エラーメッセージを表示
function showError(message) {
  searchResult.innerHTML = `<div class="error-message">${message}</div>`;
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
