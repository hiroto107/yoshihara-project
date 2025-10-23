# Mastra AI プロジェクト

このプロジェクトは Mastra AI フレームワークを使用した天気エージェントのサンプルです。

## セットアップ

### 1. 環境変数の設定

`.env` ファイルを作成し、OpenAI API キーを設定してください：

```bash
OPENAI_API_KEY=your_openai_api_key_here
```

### 2. 開発サーバーの起動

```bash
npm run dev
```

これにより Mastra Development Server が起動し、Mastra Playground でエージェントをテストできます。

### 3. ビルド

```bash
npm run build
```

## プロジェクト構造

```
src/
├── mastra/
│   ├── agents/
│   │   └── weather-agent.ts    # 天気エージェント
│   ├── tools/
│   │   └── weather-tool.ts     # 天気ツール
│   └── index.ts               # Mastra エントリポイント
├── tsconfig.json              # TypeScript 設定
└── package.json              # 依存関係
```

## 使用方法

1. 開発サーバーを起動
2. Mastra Playground にアクセス
3. 天気エージェントと対話して天気情報を取得

## 参考リンク

- [Mastra ドキュメント](https://mastra.ai/ja/docs)
- [インストールガイド](https://mastra.ai/ja/docs/getting-started/installation)
