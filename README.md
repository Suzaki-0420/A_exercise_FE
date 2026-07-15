# フロントエンド API一覧

フロントエンドからバックエンドAPIを呼び出すRepositoryおよびメソッドの一覧を記載します。

確認・完了処理は画面遷移を行わず、モーダルで表示します。  
そのため、確認画面表示のみを目的とするAPIは原則として使用しません。

---

## UC009 担当者アカウント登録

### Repository

```text
EmployeeAccountRepository
```

---

## 1. 未登録社員一覧取得

|項目|内容|
|---|---|
|エンドポイント|`GET /proxy-api/admin/account/form`|
|HTTPメソッド|GET|
|Repository|EmployeeAccountRepository|
|メソッド|`getForm()`|

### 概要

担当者アカウント登録画面の初期表示時に、アカウント未登録の社員一覧を取得します。

---

## 2. アカウント名重複確認

|項目|内容|
|---|---|
|エンドポイント|`GET /proxy-api/admin/account/validate?accountName={accountName}`|
|HTTPメソッド|GET|
|Repository|EmployeeAccountRepository|
|メソッド|`validateAccountName(accountName)`|

### 概要

入力されたアカウント名が既に登録されているか確認します。

確認ボタン押下前、またはアカウント名入力欄のフォーカスアウト時に呼び出します。

---

## 3. 担当者アカウント登録

|項目|内容|
|---|---|
|エンドポイント|`POST /proxy-api/admin/account/register`|
|HTTPメソッド|POST|
|Repository|EmployeeAccountRepository|
|メソッド|`register(request)`|

### 概要

担当者アカウントを登録します。

確認モーダルの「登録」ボタン押下時に呼び出します。

### 備考

確認画面へ遷移しないため、`POST /admin/account/confirm`は使用しません。

入力内容はフロントエンドで保持し、確認モーダルへ表示します。

---

## UC010 新商品登録

### Repository

```text
ProductRepository
ProductCategoryRepository
```

---

## 1. 商品カテゴリ一覧取得

|項目|内容|
|---|---|
|エンドポイント|`GET /proxy-api/admin/product/categories`|
|HTTPメソッド|GET|
|Repository|ProductCategoryRepository|
|メソッド|`findAll()`|

### 概要

新商品登録画面の初期表示時に、商品カテゴリ一覧を取得します。

---

## 2. 商品名重複確認

|項目|内容|
|---|---|
|エンドポイント|`GET /proxy-api/admin/product/validate?ProductName={ProductName}`|
|HTTPメソッド|GET|
|Repository|ProductRepository|
|メソッド|`validateProductName(name)`|

### 概要

入力された商品名が既に登録されているか確認します。

確認前、または商品名入力欄のフォーカスアウト時に呼び出します。

---

## 3. 新商品登録

|項目|内容|
|---|---|
|エンドポイント|`POST /proxy-api/admin/product/register`|
|HTTPメソッド|POST|
|Repository|ProductRepository|
|メソッド|`create(formData)`|

### 概要

新しい商品を登録します。

確認モーダルの「登録」ボタン押下時に呼び出します。

### 備考

商品画像を含むため、`FormData`を使用してリクエストを送信します。

商品画像は必須です。

---

## UC011 商品検索（カテゴリ）

### Repository

```text
ProductRepository
ProductCategoryRepository
```

---

## 1. 全商品取得

|項目|内容|
|---|---|
|エンドポイント|`GET /proxy-api/admin/product/category`|
|HTTPメソッド|GET|
|Repository|ProductRepository|
|メソッド|`findAll()`|

### 概要

商品検索画面の初期表示時に、登録されている商品をすべて取得します。

カテゴリを指定せずAPIを呼び出します。

---

## 2. カテゴリ別商品検索

|項目|内容|
|---|---|
|エンドポイント|`GET /proxy-api/admin/product/category?productCategoryId={productCategoryId}`|
|HTTPメソッド|GET|
|Repository|ProductRepository|
|メソッド|`findByCategory(categoryUuid)`|

### 概要

選択された商品カテゴリに属する商品一覧を取得します。

検索ボタン押下時に呼び出します。

---

## 3. 商品カテゴリ一覧取得

|項目|内容|
|---|---|
|エンドポイント|`GET /proxy-api/admin/product/categories`|
|HTTPメソッド|GET|
|Repository|ProductCategoryRepository|
|メソッド|`findAll()`|

### 概要

商品検索画面の初期表示時に、検索条件として使用する商品カテゴリ一覧を取得します。

---

## UC019 商品キーワード検索

### Repository

```text
ProductRepository
```

---

## 1. 商品キーワード検索

|項目|内容|
|---|---|
|エンドポイント|`GET /proxy-api/products/keyword?keyword={keyword}`|
|HTTPメソッド|GET|
|Repository|ProductRepository|
|メソッド|`findByKeyword(keyword)`|

### 概要

入力されたキーワードを含む商品一覧を取得します。

検索ボタン押下時に呼び出します。

---

## UC012 商品修正

### Repository

```text
ProductRepository
ProductCategoryRepository
```

---

## 1. 修正対象商品取得

|項目|内容|
|---|---|
|エンドポイント|`GET /proxy-api/admin/product/edit/{productId}`|
|HTTPメソッド|GET|
|Repository|ProductRepository|
|メソッド|`findById(productUuid)`|

### 概要

商品修正画面の初期表示時に、修正対象の商品情報を取得します。

---

## 2. 商品カテゴリ一覧取得

|項目|内容|
|---|---|
|エンドポイント|`GET /proxy-api/admin/product/categories`|
|HTTPメソッド|GET|
|Repository|ProductCategoryRepository|
|メソッド|`findAll()`|

### 概要

商品修正画面の初期表示時に、商品カテゴリ一覧を取得します。

---

## 3. 商品修正

|項目|内容|
|---|---|
|エンドポイント|`PUT /proxy-api/admin/product/edit/{productId}`|
|HTTPメソッド|PUT|
|Repository|ProductRepository|
|メソッド|`update(productUuid, formData)`|

### 概要

指定された商品情報を修正します。

確認モーダルの「更新」ボタン押下時に呼び出します。

### 備考

商品画像を変更する場合は、`FormData`に新しい画像を設定します。

画像を変更しない場合は画像ファイルを送信せず、既存の商品画像を維持します。

---

## UC013 商品削除

### Repository

```text
ProductRepository
```

---

## 1. 商品削除

|項目|内容|
|---|---|
|エンドポイント|`DELETE /proxy-api/admin/product/delete/{productUuid}`|
|HTTPメソッド|DELETE|
|Repository|ProductRepository|
|メソッド|`delete(productUuid)`|

### 概要

指定された商品を論理削除します。

削除確認モーダルの「削除」ボタン押下時に呼び出します。

---

## UC014 商品カテゴリ登録

### Repository

```text
ProductCategoryRepository
```

---

## 1. 商品カテゴリ名重複確認

|項目|内容|
|---|---|
|エンドポイント|`GET /proxy-api/admin/category/validate?categoryName={categoryName}`|
|HTTPメソッド|GET|
|Repository|ProductCategoryRepository|
|メソッド|`validateCategoryName(name)`|

### 概要

入力された商品カテゴリ名が既に登録されているか確認します。

確認前、またはカテゴリ名入力欄のフォーカスアウト時に呼び出します。

---

## 2. 商品カテゴリ登録

|項目|内容|
|---|---|
|エンドポイント|`POST /proxy-api/admin/category/register`|
|HTTPメソッド|POST|
|Repository|ProductCategoryRepository|
|メソッド|`create(request)`|

### 概要

新しい商品カテゴリを登録します。

確認モーダルの「登録」ボタン押下時に呼び出します。

---

## UC015 購入履歴検索

### Repository

```text
OrdersRepository
```

---

## 1. 購入履歴全件取得

|項目|内容|
|---|---|
|エンドポイント|`GET /proxy-api/admin/order/search`|
|HTTPメソッド|GET|
|Repository|OrdersRepository|
|メソッド|`findAll()`|

### 概要

購入履歴検索画面の初期表示時に、登録されている注文履歴をすべて取得します。

---

## 2. 購入履歴条件検索

|項目|内容|
|---|---|
|エンドポイント|`GET /proxy-api/admin/order/search/result`|
|HTTPメソッド|GET|
|Repository|OrdersRepository|
|メソッド|`search(condition)`|

### 概要

購入日または顧客アカウント名を条件として購入履歴を検索します。

検索ボタン押下時に呼び出します。

---

## UC016 注文ステータス更新

### Repository

```text
OrdersRepository
```

---

## 1. 注文・ステータス一覧取得

|項目|内容|
|---|---|
|エンドポイント|`GET /proxy-api/admin/order/status/update/{orderId}`|
|HTTPメソッド|GET|
|Repository|OrdersRepository|
|メソッド|`getUpdateForm(orderId)`|

### 概要

指定された注文情報および更新可能な注文ステータス一覧を取得します。

注文ステータス更新モーダルを開く際に呼び出します。

---

## 2. 注文ステータス更新

|項目|内容|
|---|---|
|エンドポイント|`POST /proxy-api/admin/order/status/update/complete`|
|HTTPメソッド|POST|
|Repository|OrdersRepository|
|メソッド|`update(orderId, newStatusId)`|

### 概要

指定された注文のステータスを更新します。

確認モーダルの「更新」ボタン押下時に呼び出します。

### 備考

確認画面へ遷移しないため、`POST /admin/order/status/update/confirm`は使用しません。

選択した注文ステータスはフロントエンドで保持し、確認モーダルへ表示します。

---

## UC017 担当者ログイン

### Repository

```text
AdminAuthRepository
```

---

## 1. 担当者ログイン

|項目|内容|
|---|---|
|エンドポイント|`POST /proxy-api/admin/auth/login`|
|HTTPメソッド|POST|
|Repository|AdminAuthRepository|
|メソッド|`login(request)`|

### 概要

担当者アカウントでログイン認証を行います。

ログインボタン押下時に呼び出します。

認証成功時は、バックエンドから発行された認証Cookieを利用します。

---

## UC018 担当者ログアウト

### Repository

```text
AdminAuthRepository
```

---

## 1. 担当者ログアウト

|項目|内容|
|---|---|
|エンドポイント|`POST /proxy-api/admin/auth/logout`|
|HTTPメソッド|POST|
|Repository|AdminAuthRepository|
|メソッド|`logout()`|

### 概要

ログイン中の担当者をログアウトします。

ログアウト確認モーダルの「ログアウト」ボタン押下時に呼び出します。

認証Cookieはバックエンド側で削除されます。

---

# Repository一覧

|Repository|役割|
|---|---|
|EmployeeAccountRepository|担当者アカウント登録|
|ProductRepository|商品登録・検索・修正・削除|
|ProductCategoryRepository|商品カテゴリ取得・登録|
|OrdersRepository|購入履歴検索・注文ステータス更新|
|AdminAuthRepository|担当者ログイン・ログアウト|

---

# モーダル使用方針

本フロントエンドでは、入力・確認・完了のための画面遷移は行いません。

確認処理および完了表示にはモーダルを使用します。

基本的な処理フローは以下とします。

```text
入力
↓
確認ボタン押下
↓
確認モーダル表示
↓
登録・更新API実行
↓
完了モーダル表示
```

確認画面表示のみを目的とする以下のAPIは、原則としてフロントエンドから呼び出しません。

- `POST /admin/account/confirm`
- `POST /admin/order/status/update/confirm`

入力内容および選択内容はフロントエンド側で保持し、確認モーダルへ表示します。

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
