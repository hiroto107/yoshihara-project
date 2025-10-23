# 冷泉荘くん × 山王マンションくん 会話ラボ

福岡の2つのビルを擬人化したキャラクターが、お題について合意形成を目指すAI会話システムです。

## 概要

- **冷泉荘くん**: 中洲川端エリアのレトロビルを改修した文化交流拠点
- **山王マンションくん**: 美野島エリアの築古分譲マンションをリノベしたコワーキングスペース
- **最大20ターン**まで対話可能
- **リアルタイム音声合成**対応（ElevenLabs）

## 技術スタック

### バックエンド
- **Mastra AI**: AI エージェントフレームワーク
- **OpenAI GPT-4o-mini**: 会話生成
- **ElevenLabs**: 音声合成
- **TypeScript**: 開発言語

### フロントエンド
- **React + Vite**: UI フレームワーク
- **Tailwind CSS**: スタイリング
- **TypeScript**: 開発言語

## セットアップ

### 1. 依存関係のインストール

```bash
# バックエンド
npm install

# フロントエンド
cd frontend
npm install
```

### 2. 環境変数の設定

`.env` ファイルを作成し、APIキーを設定してください：

```bash
OPENAI_API_KEY=your_openai_api_key_here
ELEVENLABS_API_KEY=your_elevenlabs_api_key_here
ELEVENLABS_VOICE_REISEN=your_voice_id_for_reisen
ELEVENLABS_VOICE_SANNO=your_voice_id_for_sanno
```

### 3. 開発サーバーの起動

```bash
# バックエンド（ポート4112）
npm run dev

# フロントエンド（ポート5173）
cd frontend
npm run dev
```

### 4. アクセス

- **フロントエンド**: http://localhost:5173
- **バックエンドAPI**: http://localhost:4112

## 使用方法

1. **お題を入力**: テーマや課題を入力
2. **会話開始**: 2つのキャラクターが交互に議論
3. **合意形成**: 最大20ターンで合意を目指す
4. **音声再生**: 各発話を音声で再生（ElevenLabs対応）

## プロジェクト構造

```
├── src/
│   ├── mastra/
│   │   ├── agents/           # AIエージェント
│   │   │   ├── reisen-agent.ts
│   │   │   └── sanno-agent.ts
│   │   ├── services/         # 会話サービス
│   │   │   └── conversation-service.ts
│   │   ├── tools/           # ツール
│   │   └── utils/           # ユーティリティ
│   └── data/
│       └── personas.ts      # キャラクター設定
├── frontend/
│   ├── src/
│   │   ├── App.tsx         # メインUI
│   │   ├── persona.ts      # キャラクター情報
│   │   └── api.ts          # APIクライアント
│   └── public/assets/      # 画像アセット
└── README.md
```

## 特徴

- **動的会話生成**: LLMによるリアルタイム会話
- **キャラクター設定**: 各ビルの特徴を反映した個性
- **知識ベース**: RAGによる関連情報取得
- **音声合成**: 自然な音声での会話体験
- **レスポンシブUI**: モバイル・デスクトップ対応

## ライセンス

MIT License

## 参考リンク

- [Mastra AI ドキュメント](https://mastra.ai/ja/docs)
- [OpenAI API](https://platform.openai.com/)
- [ElevenLabs](https://elevenlabs.io/)