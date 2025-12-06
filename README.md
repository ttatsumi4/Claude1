# 📚 図書館 本管理アプリ

図書館で借りた本の履歴を管理できるWebアプリケーションです。ISBNコードを入力するだけで、書籍の詳細情報を自動取得し、簡単に借用記録を管理できます。

## 🌟 主な機能

- **ISBN検索**: ISBNコードを入力して書籍情報を自動取得
- **本の登録**: 借りた本の情報を簡単に記録
- **履歴管理**: 借用中・返却済みの本を一覧表示
- **情報更新**: 返却日やメモの更新が可能
- **フィルター機能**: すべて・借用中・返却済みで絞り込み表示

## 🚀 使用技術

- **バックエンド**: Node.js, Express
- **データベース**: SQLite3
- **フロントエンド**: HTML5, CSS3, JavaScript (Vanilla)
- **外部API**: Google Books API (ISBN検索)

## 📋 必要要件

- Node.js (v14以上推奨)
- npm (Node Package Manager)

## 🔧 インストール方法

1. リポジトリをクローン
```bash
git clone <repository-url>
cd Claude1
```

2. 依存パッケージをインストール
```bash
npm install
```

## ▶️ 起動方法

### 本番モード
```bash
npm start
```

### 開発モード (ファイル変更時に自動再起動)
```bash
npm run dev
```

サーバーが起動したら、ブラウザで以下にアクセス:
```
http://localhost:3000
```

## 📖 使い方

### 1. ISBNで本を検索
- ISBNコード (13桁または10桁) を入力
- 「検索」ボタンをクリック
- 書籍情報が自動的に表示されます

例: `9784797395846`

### 2. 本を登録
- 検索結果が表示されたら、借りた日とメモ(オプション)を入力
- 「登録する」ボタンをクリック

### 3. 本の一覧を確認
- 登録した本が一覧で表示されます
- フィルターボタンで表示を絞り込めます
  - **すべて**: 全ての本を表示
  - **借用中**: 現在借りている本のみ表示
  - **返却済み**: 返却した本のみ表示

### 4. 本の情報を更新
- 本のカードの「更新」ボタンをクリック
- 返却日、ステータス、メモを編集
- 「更新する」ボタンをクリック

### 5. 本を削除
- 本のカードの「削除」ボタンをクリック
- 確認ダイアログで「OK」をクリック

## 🗂️ プロジェクト構成

```
Claude1/
├── server.js           # バックエンドサーバー (Express)
├── package.json        # npm設定ファイル
├── library.db          # SQLiteデータベース (自動作成)
├── .gitignore         # Git除外設定
├── README.md          # このファイル
└── public/            # 静的ファイル
    ├── index.html     # メインHTML
    ├── style.css      # スタイルシート
    └── app.js         # フロントエンドJavaScript
```

## 🔌 API エンドポイント

### ISBN検索
```
GET /api/isbn/:isbn
```
指定されたISBNの書籍情報を取得

### 本の一覧取得
```
GET /api/books
```
登録されている全ての本を取得

### 本の追加
```
POST /api/books
Content-Type: application/json

{
  "isbn": "9784797395846",
  "title": "書籍名",
  "authors": "著者名",
  "publisher": "出版社",
  "published_date": "2020-01-01",
  "description": "説明",
  "thumbnail": "画像URL",
  "borrow_date": "2024-01-01",
  "notes": "メモ"
}
```

### 本の更新
```
PUT /api/books/:id
Content-Type: application/json

{
  "return_date": "2024-01-15",
  "status": "returned",
  "notes": "更新されたメモ"
}
```

### 本の削除
```
DELETE /api/books/:id
```

## 📊 データベーススキーマ

```sql
CREATE TABLE borrowed_books (
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
);
```

## 💡 ISBNについて

ISBN (International Standard Book Number) は、書籍を識別するための国際規格コードです。

- **ISBN-13**: 13桁の数字 (例: 978-4-7973-9584-6)
- **ISBN-10**: 10桁の数字 (旧規格)

本の裏表紙やカバーに記載されています。ハイフンは入力時に省略可能です。

## 🎨 特徴

- **レスポンシブデザイン**: スマートフォンでも快適に使用可能
- **直感的なUI**: シンプルで分かりやすい操作画面
- **自動データ取得**: Google Books APIから書籍情報を自動取得
- **データ永続化**: SQLiteで確実にデータを保存

## 🔒 注意事項

- インターネット接続が必要です (ISBN検索時)
- Google Books APIの利用制限があるため、短時間に大量のリクエストは避けてください
- データベースファイル (`library.db`) は自動生成されます

## 📝 ライセンス

MIT License

## 🤝 貢献

プルリクエストや issue の作成を歓迎します！

## 📧 お問い合わせ

問題や質問がある場合は、issue を作成してください。
