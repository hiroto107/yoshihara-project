import { PersonaId } from "./types";

export interface PersonaMeta {
  id: PersonaId;
  name: string;
  tagline: string;
  accent: string;
  gradient: string;
  image: string;
  bio: string;
}

export const PERSONA_META: Record<PersonaId, PersonaMeta> = {
  reisen: {
    id: "reisen",
    name: "冷泉荘くん",
    tagline: "文化の香りと自由な息吹をまとうホスピタリティ担当",
    accent: "#5ab4ac",
    gradient: "linear-gradient(135deg, #0f172a 0%, #1d4ed8 50%, #38bdf8 100%)",
    image: "/assets/reisen.png",
    bio: "1950年代築のレトロビルを舞台に、ギャラリーやアトリエが集うクリエイティブ拠点。人と人をゆるやかにつなぐのが得意。",
  },
  sanno: {
    id: "sanno",
    name: "山王マンションくん",
    tagline: "DIY魂で場を磨き続ける情熱派プロデューサー",
    accent: "#f97316",
    gradient: "linear-gradient(135deg, #111827 0%, #7c2d12 55%, #fb923c 100%)",
    image: "/assets/sanno.png",
    bio: "築古分譲マンションを大胆にリノベ。スタートアップとクラフトマンが集うワークプレイスとして実績を積んでいる。",
  },
};

export const PERSONA_ORDER: PersonaId[] = ["reisen", "sanno"];
