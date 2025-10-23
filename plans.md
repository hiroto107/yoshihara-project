# 冷泉荘くん × 山王マンションくん 対話UI機能 実装計画

## 0. 参考情報リサーチ
- Mastraドキュメント: コアルール（Agents, Tools, Threads, Actions）、Playground仕様、UI連携 (`https://mastra.ai/ja/docs`、`/core-concepts/agents`、`/integrations/rest`、`/guides/building-apps` を重点確認)
- ElevenLabs API: 日本語・感情TTSパラメータ、音声フォーマット（mp3/opus）とレスポンスの非同期取得
- 既存プロジェクト: `src/mastra` 配下の構成、既存天気エージェントの実装パターン

## 実装状況（2025-10-19）
- [x] Mastra 2キャラエージェント（`src/mastra/agents/*`）と in-memory 知識ベースを実装
- [x] ElevenLabs TTS / Persona Retrieval ツールと会話サービス（`conversation-service.ts`）を構築
- [x] REST エンドポイント `/conversation` を公開し、React + Vite UI（`frontend/`）から連携
- [ ] RAG用 Vector Store 永続化、MCP/Memory 導線、E2E/単体テストの追加

## 1. アーキテクチャ設計
- キャラクターエージェント2体（冷泉荘くん、山王マンションくん）を Mastra Agent として定義
- 会話制御: Mastra の会話サービス（`services/conversation-service.ts`）で 10ターンまでの交互発話ロジックと終了判定を実装
- 外部サービス連携: ElevenLabs TTS を Mastra Tool として実装し、各発話後に音声生成（APIキー未設定時はフォールバック）
- UI連携: Mastra Server のカスタム REST エンドポイント `/conversation` を使いフロントエンドと通信。UI側は React + Vite で実装
- 知識ベース: 小容量テキストを TypeScript 定義（`src/data/personas.ts`）として保持し、RAG相当の簡易スコアリングで抽出（今後 Vector Store 化を検討）

## 2. バックエンド詳細計画（Mastra側）
1. **プロジェクト基盤整備**
   - TypeScript設定更新 (`tsconfig`, エイリアス) と lint/format導入検討
   - `.env` に ElevenLabs API Key / ベースURL 等を追加
2. **データソース・知識管理**
   - キャラクターごとの性格・背景情報を `src/data/personas.ts` に静的定義
   - Vector Store 連携は未着手（暫定でトークンマッチングによる簡易リトリーバー）。将来的に Mastra Memory / Vector を採用
3. **Tools**
   - `ElevenLabsTtsTool`: 入力テキストとキャラクターパラメータから音声URL/バイナリを返却
   - `PersonaRetrievalTool`: ユーザーお題＋会話履歴をもとに関連知識を抽出
4. **Agents**
   - `reisen-agent.ts`, `sanno-agent.ts` を新規作成。各自のシステムプロンプト、口調テンプレート、利用Tool（RAG + TTS）を設定
   - 感情表現: 入力に応じた emotion tag を出すための少量プロンプトエンジニアリング
5. **会話オーケストレーション**
   - `services/conversation-service.ts` で会話管理（ターン制御・感情補正・TTS 呼び出し）を実装
   - ループは `Start -> (A発話 -> TTS) -> (B発話 -> TTS)` を最大10ターン or 終了判定まで継続
   - エージェントの構造化出力（JSON）から総括文・感情タグを抽出し、fallback も実装
6. **API / サーバー**
   - `mastra` エントリで `registerApiRoute('/conversation')` を登録し JSON レスポンスを提供
   - POST: お題入力で会話生成し、全ターン・音声(Base64)・サマリーを返却
   - GET: （未実装）必要に応じて履歴取得や Reset API を追加予定
7. **テスト**
   - Agent 単体テスト: プロンプト検証・RAGヒットテスト
   - Flow 結合テスト: 10ターン制限・終了条件確認
   - Tool モックテスト: ElevenLabs 呼び出しのエラーハンドリング

## 3. フロントエンド詳細計画
1. **UIフレームワーク準備**
   - `frontend/` ディレクトリに Vite + React + TypeScript をセットアップ（`package.json` / `vite.config.ts` 完了）
   - Tailwind CSS / PostCSS を導入（`tailwind.config.ts`, `postcss.config.js`）し、ユーティリティクラス中心でレイアウト・アニメーションを構築。`@layer components` や少量のカスタムCSSで共通化する
   - 依存を取得できない環境向けに `index.html` へ CDN フォールバック（Tailwind, フォント）を追加し、最低限の体裁を維持
2. **画面構成**
   - レイアウト (`UI-001`): 左右キャラクターカード、中央字幕エリア、上部バー
   - 初期ガイダンス (`UI-002`): 中央パネルにお題入力 CTA
   - ボタン状態管理 (`UI-003`): フォーム状態に応じて Start disabled, Reset 常時 enable
3. **会話表示・アニメーション**
   - 字幕 (`UI-004`): 現在発話を拡大表示、終了時に総括に切替
   - 話中インジケータ (`UI-005`): アバターの波形アニメーション（CSSアニメ or Lottie）
   - 吹き出しログ: ターンごとに左右カードへ追加
4. **音声再生**
   - ElevenLabs音声を data URI として逐次再生。エラー時は一定時間待機して字幕のみ表示
   - 会話リプレイ機能（UIの「先頭へ」ボタン）を実装し、再生キューをリセットできるようにする
5. **LOGモーダル (`UI-006`)**
   - モーダルコンポーネント (Portal) + scrollable area
   - Esc / × で閉じる、Copyボタン（履歴全文コピー）
6. **アクセシビリティ (`UI-007`)**
   - 字幕フォントサイズ調整スライダー、Enter=Start・Esc=LOG閉じのキーハンドラ（実装済）
   - キャラクター画像は `public/assets/reisen.png` / `public/assets/sanno.png` を配置する運用を明文化し、存在しない場合はコンソール警告を追加

## 8. ビルド・検証手順
- `frontend/public/assets/` に `reisen.png` と `sanno.png` を配置してから `npm run dev`（5173）で UIを確認
- オフライン環境では CDN 経由で Tailwind を読み込み、オンライン環境では `npm install` → `npm run dev` / `npm run build` を実行
- UI検証を自動化する場合は Playwright などでスクリーンショットを取得し、モック画像が正しく表示されることを確認

## 4. 会話・感情制御の要件整理
- ターン管理: Flow 側で現在ターン数、終了条件（合意形成 or 10ターン）を判定
- Emotionタグ: Agent 応答に emotion メタデータを含め、TTSに渡す
- フォールバック: OpenAIレスポンス失敗時は再試行 → fallback response
- ログ: DB不要の場合は in-memory / ファイル保存、将来的な永続化は Supabase 等を検討

## 5. スケジュール・マイルストーン
1. リサーチ完了 & 設計固め (Day 1-2)
2. バックエンド基盤 + Tool/Agent 実装 (Day 3-6)
3. フロントエンド UI プロトタイプ (Day 5-7)
4. 会話フロー結合 + E2E テスト (Day 8-9)
5. バグ修正 & ドキュメント整備、リリース (Day 10)

## 6. 検証・デプロイ
- ローカル: `npm run dev` で Mastra サーバー、`npm run dev`(frontend)で UI 動作検証
- 自動テスト: CI (GitHub Actions) で lint/test 実行
- デプロイ: Mastra Cloud or Vercel (UI) を想定。環境変数に ElevenLabs/OpenAI キー設定
- 運用: 会話ログの保存方針、APIキーのローテーション、エラー通知（Sentry 等）を検討

## 7. リスク & 対応策
- TTS遅延: 生成時間が会話テンポを阻害 → 事前キャッシュやテキスト先行表示
- RAG品質: 不適切文脈 → プロンプト評価とベクトルDBのチューニング
- UIパフォーマンス: 音声ストリーミングとDOM更新の競合 → React Suspense/async boundary導入
- アクセシビリティ: 日本語TTSと字幕表示のタイミング差 → タイムスタンプ同期処理
