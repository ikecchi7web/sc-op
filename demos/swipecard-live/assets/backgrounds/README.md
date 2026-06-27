# 背景画像フォルダ

CMSの「登録済み背景画像」に表示したい画像を、このフォルダへ配置します。

推奨形式はWebPです。例:

```text
assets/backgrounds/page-01.webp
```

画像を追加したら、`catalog.json`へ表示名とHTMLから見たパスを追加します。

```json
{
  "label": "ページ01",
  "src": "assets/backgrounds/page-01.webp"
}
```

ブラウザだけではフォルダ内のファイル一覧を自動取得できないため、この一覧ファイルを使用します。
