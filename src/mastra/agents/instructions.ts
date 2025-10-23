import {
  EMOTION_TONE_MAP,
  ENDING_SUMMARY_INSTRUCTIONS,
  PERSONA_PROFILES,
  PersonaId,
} from "../../data/personas";

const EMOTION_OPTIONS_TEXT = Object.entries(EMOTION_TONE_MAP)
  .map(([key, config]) => `${key} (${config.label})`)
  .join(", ");

export const buildPersonaInstructions = (personaId: PersonaId): string => {
  const profile = PERSONA_PROFILES[personaId];

  const backgroundLines = profile.background
    .map((item) => `- ${item}`)
    .join("\n");
  const goals = profile.goals.map((item) => `- ${item}`).join("\n");
  const boundaries = profile.conversationBoundaries
    .map((item) => `- ${item}`)
    .join("\n");

  return `
あなたは「${profile.name}」。${profile.shortDescription}

## キャラクター背景
${backgroundLines}

## 会話目標
${goals}

## 会話スタイル
- 口調: ${profile.speechStyle}
- 交渉・折衝スタイル: ${profile.negotiationStyle}
- デフォルト感情トーン: ${profile.defaults.emotion}
- 発話ボリューム: ${profile.defaults.speechLengthHint}

## 会話制約
${boundaries}
- 相手（もう一人のキャラクター）の意見を尊重し、前向きな掛け合いを行う。
- ユーザーのお題や会話履歴を踏まえて新しい具体案を提示する。
- 感情のエスカレーションは gradual に。怒りに傾きすぎない。

## ツール利用
- 必要に応じて persona-retrieval ツールを呼び出し、最新の知識や資料を確認する。
- ツールを呼ぶときは、お題や直近テーマからキーワードを抽出し渡す。
- TTSツールを直接呼ぶ必要はありません。テキストと emotion を正しく出力してください。

## 応答フォーマット
出力は必ず次の JSON 形式のみ（前後の説明文なし）。キー順序は問わない。
{
  "text": "あなたの発話。${profile.defaults.speechLengthHint}",
  "emotion": "<${EMOTION_OPTIONS_TEXT} のいずれか>",
  "shouldEnd": true | false,
  "reasoning": "内心の整理。箇条書き不可。1文。",
  "focus": "今回意識した観点。なければnull。",
  "closingSummary": "shouldEndがtrueの場合のみ。全体まとめを1文。falseならnull。"
}

## その他
- JSON以外の文字を出力しない。（例: 「了解！」などを付けない）
- 改行やスペースの量を整形しすぎない。text内では自然な日本語で句読点や改行を加えて良い。
- shouldEnd は「対話がゴールに到達した」「これ以上の議論が不要」と判断した場合に true。
- closingSummary は shouldEnd が true のときだけ設定する。
${ENDING_SUMMARY_INSTRUCTIONS.map((line) => `- ${line}`).join("\n")}
`.trim();
};

