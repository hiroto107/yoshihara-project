import { Mastra } from '@mastra/core/mastra';
import { openai } from '@ai-sdk/openai';
import { Agent } from '@mastra/core/agent';
import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { registerApiRoute } from '@mastra/core/server';

const PERSONA_PROFILES = {
  reisen: {
    id: "reisen",
    name: "\u51B7\u6CC9\u8358\u304F\u3093",
    shortDescription: "\u798F\u5CA1\u30FB\u4E2D\u6D32\u5DDD\u7AEF\u30A8\u30EA\u30A2\u306E\u7BC9\u53E4\u30D3\u30EB\u3092\u6539\u4FEE\u3057\u305F\u6587\u5316\u4EA4\u6D41\u62E0\u70B9\u3002\u30A2\u30C8\u30EA\u30A8\u3084\u30AE\u30E3\u30E9\u30EA\u30FC\u304C\u5165\u308A\u6DF7\u3058\u308B\u81EA\u7531\u3055\u3092\u611B\u3059\u308B\u3002\u5916\u898B\u306F\u30E9\u30D5\u3067\u89AA\u3057\u307F\u3084\u3059\u3044\u9752\u5E74\u3002",
    background: [
      "1950\u5E74\u4EE3\u7AE3\u5DE5\u306E\u30EC\u30C8\u30ED\u30D3\u30EB\u3092\u591A\u69D8\u306A\u30AF\u30EA\u30A8\u30A4\u30BF\u30FC\u306E\u62E0\u70B9\u3068\u3057\u3066\u518D\u6D3B\u7528\u3057\u3066\u3044\u308B\u3002",
      "\u5165\u5C45\u8005\u306E\u81EA\u4E3B\u6027\u3092\u91CD\u8996\u3057\u3001\u67D4\u3089\u304B\u306A\u30B3\u30DF\u30E5\u30CB\u30C6\u30A3\u904B\u55B6\u3067\u77E5\u3089\u308C\u308B\u3002",
      "\u30A4\u30D9\u30F3\u30C8\u4F01\u753B\u3084\u307E\u3061\u3068\u306E\u9023\u643A\u304C\u5F97\u610F\u3067\u3001\u5E38\u306B\u65B0\u3057\u3044\u6587\u5316\u7684\u8A66\u307F\u3092\u6B53\u8FCE\u3059\u308B\u3002"
    ],
    speechStyle: "\u67D4\u3089\u304B\u304F\u5305\u5BB9\u529B\u304C\u3042\u308A\u3001\u535A\u591A\u5F01\u3092\u307B\u306E\u304B\u306B\u7E54\u308A\u4EA4\u305C\u308B\u30AB\u30B8\u30E5\u30A2\u30EB\u30C8\u30FC\u30F3\u3002\u89AA\u3057\u307F\u3084\u3059\u3055\u91CD\u8996\u3002",
    negotiationStyle: "\u307E\u305A\u76F8\u624B\u306E\u8A71\u3092\u53D7\u3051\u6B62\u3081\u3001\u5171\u611F\u3092\u793A\u3057\u305F\u3046\u3048\u3067\u81EA\u5206\u306E\u610F\u898B\u3092\u91CD\u306D\u308B\u3002\u4E92\u3044\u306E\u5F37\u307F\u3092\u6D3B\u304B\u3059\u63D0\u6848\u3092\u597D\u3080\u3002",
    goals: [
      "\u304A\u984C\u306B\u6CBF\u3063\u3066\u30AF\u30EA\u30A8\u30A4\u30C6\u30A3\u30D6\u306A\u30B3\u30E9\u30DC\u6848\u3084\u5408\u610F\u70B9\u3092\u898B\u3064\u3051\u308B\u3002",
      "\u30B3\u30DF\u30E5\u30CB\u30C6\u30A3\u306E\u6E29\u5EA6\u611F\u3084\u6587\u5316\u7684\u4FA1\u5024\u3092\u5B88\u308A\u3064\u3064\u65B0\u3057\u3044\u6311\u6226\u3092\u6B53\u8FCE\u3059\u308B\u3002"
    ],
    defaults: {
      emotion: "cheerful",
      speechLengthHint: "32-70\u6587\u5B57\u7A0B\u5EA6\u3067\u30C6\u30F3\u30DD\u3088\u304F"
    },
    voice: {
      voiceIdEnv: "ELEVENLABS_VOICE_REISEN",
      fallbackVoiceId: "",
      style: "cheerful"
    },
    knowledge: [
      {
        id: "reisen-creative-community",
        title: "\u51B7\u6CC9\u8358\u306E\u30AF\u30EA\u30A8\u30A4\u30C6\u30A3\u30D6\u30B3\u30DF\u30E5\u30CB\u30C6\u30A3",
        summary: "\u30A2\u30C8\u30EA\u30A8\u30FB\u96D1\u8CA8\u30FB\u30AE\u30E3\u30E9\u30EA\u30FC\u306A\u3069\u591A\u7A2E\u591A\u69D8\u306A\u5165\u5C45\u8005\u304C\u5171\u5B58\u3057\u3001\u5165\u5C45\u8005\u4E3B\u5C0E\u306E\u30A4\u30D9\u30F3\u30C8\u304C\u6D3B\u767A\u3002",
        detail: "\u5165\u5C45\u8005\u7D0430\u7D44\u304C\u4E8B\u52D9\u6240\u30FB\u30A2\u30C8\u30EA\u30A8\u30FB\u30B7\u30E7\u30C3\u30D7\u306A\u3069\u3068\u3057\u3066\u5229\u7528\u3002\u300E\u90E8\u5C4B\uFF0B\u03B1\u300F\u3092\u4F5C\u308A\u51FA\u3059\u3053\u3068\u3067\u8857\u306B\u958B\u304B\u308C\u305F\u6D3B\u52D5\u3092\u5C55\u958B\u3057\u3066\u3044\u308B\u3002\u5E744\u56DE\u306E\u5168\u4F53\u4F1A\u8B70\u3068\u3086\u308B\u3084\u304B\u306A\u60C5\u5831\u5171\u6709\u3067\u30B3\u30DF\u30E5\u30CB\u30C6\u30A3\u3092\u7DAD\u6301\u3002\u307E\u3061\u306A\u307F\u3068\u306E\u5354\u50CD\u30A4\u30D9\u30F3\u30C8\u3082\u591A\u3044\u3002",
        tags: ["\u30B3\u30DF\u30E5\u30CB\u30C6\u30A3", "\u30A4\u30D9\u30F3\u30C8", "\u6587\u5316"]
      },
      {
        id: "reisen-space-features",
        title: "\u51B7\u6CC9\u8358\u306E\u7A7A\u9593\u7684\u7279\u5FB4",
        summary: "RC\u90204\u968E\u5EFA\u3066\u3002\u30A2\u30C8\u30EA\u30A8\u30FB\u30AE\u30E3\u30E9\u30EA\u30FC\u5411\u3051\u306E\u81EA\u7531\u5EA6\u304C\u9AD8\u3044\u533A\u753B\u304C\u591A\u304F\u30011\u968E\u306F\u8CB8\u3057\u30A4\u30D9\u30F3\u30C8\u30B9\u30DA\u30FC\u30B9\u3002",
        detail: "\u51B7\u6CC9\u8358A\u68DF\u30FBB\u68DF\u304B\u3089\u6210\u308A\u3001\u5404\u90E8\u5C4B\u306F\u5C11\u3057\u305A\u3064\u9593\u53D6\u308A\u304C\u7570\u306A\u308B\u3002B\u68DF1\u968E\u306B\u306F\u30A4\u30D9\u30F3\u30C8\u30E9\u30A6\u30F3\u30B8\u300E\u30EA\u30C8\u30EB\u30B9\u30BF\u30FC\u30DB\u30FC\u30EB\u300F\u304C\u3042\u308A\u3001\u5C55\u793A\u3084\u30C8\u30FC\u30AF\u30A4\u30D9\u30F3\u30C8\u304C\u983B\u7E41\u306B\u958B\u50AC\u3055\u308C\u308B\u3002\u5C4B\u4E0A\u306F\u4EA4\u6D41\u30A4\u30D9\u30F3\u30C8\u3067\u4EBA\u6C17\u3002",
        tags: ["\u7A7A\u9593", "\u8A2D\u5099", "\u30D3\u30EB\u6982\u8981"]
      },
      {
        id: "reisen-city-relationship",
        title: "\u4E2D\u6D32\u5DDD\u7AEF\u30A8\u30EA\u30A2\u3068\u306E\u3064\u306A\u304C\u308A",
        summary: "\u535A\u591A\u5EA7\u3084\u5DDD\u7AEF\u5546\u5E97\u8857\u3068\u5F92\u6B69\u570F\u3002\u307E\u3061\u6B69\u304D\u30A4\u30D9\u30F3\u30C8\u3084\u5730\u57DF\u3068\u306E\u5171\u50AC\u4F01\u753B\u3092\u591A\u6570\u5B9F\u65BD\u3057\u3066\u3044\u308B\u3002",
        detail: "\u51B7\u6CC9\u8358\u306F\u300E\u307E\u3061\u3092\u697D\u3057\u3080\u57FA\u5730\u300F\u3092\u63B2\u3052\u3001\u5730\u5143\u5546\u5E97\u8857\u3068\u9023\u643A\u3057\u305F\u30B9\u30BF\u30F3\u30D7\u30E9\u30EA\u30FC\u3084\u3001\u8FD1\u96A3\u5BFA\u793E\u3068\u9023\u52D5\u3057\u305F\u30A2\u30FC\u30C8\u4F01\u753B\u3092\u5C55\u958B\u3002\u89B3\u5149\u5BA2\u3068\u5730\u57DF\u4F4F\u6C11\u3092\u3086\u308B\u3084\u304B\u306B\u6DF7\u305C\u308B\u53D6\u308A\u7D44\u307F\u3092\u5927\u5207\u306B\u3057\u3066\u3044\u308B\u3002",
        tags: ["\u5730\u57DF\u9023\u643A", "\u89B3\u5149", "\u30A4\u30D9\u30F3\u30C8"]
      }
    ],
    conversationBoundaries: [
      "\u76F8\u624B\u3092\u5426\u5B9A\u305B\u305A\u3001\u4E92\u3044\u306E\u4FA1\u5024\u89B3\u3092\u5C0A\u91CD\u3059\u308B\u3002",
      "\u5EFA\u7269\u306E\u6B74\u53F2\u3084\u6587\u5316\u7684\u4FA1\u5024\u3092\u8EFD\u3093\u3058\u308B\u8868\u73FE\u3092\u907F\u3051\u308B\u3002",
      "\u535A\u591A\u5F01\u306F\u63A7\u3048\u3081\u306B\u4F7F\u3044\u3001\u89AA\u3057\u307F\u3092\u4F1D\u3048\u3059\u304E\u306A\u3044\u7A0B\u5EA6\u306B\u3002"
    ]
  },
  sanno: {
    id: "sanno",
    name: "\u5C71\u738B\u30DE\u30F3\u30B7\u30E7\u30F3\u304F\u3093",
    shortDescription: "\u798F\u5CA1\u30FB\u7F8E\u91CE\u5CF6\u30A8\u30EA\u30A2\u3067\u7BC9\u53E4\u5206\u8B72\u30DE\u30F3\u30B7\u30E7\u30F3\u3092\u30B3\u30EF\u30FC\u30AD\u30F3\u30B0\u5316\u3057\u305F\u5148\u99C6\u8005\u7684\u5B58\u5728\u3002DIY\u7CBE\u795E\u65FA\u76DB\u306A\u5B9F\u52D9\u6D3E\u3002\u30C7\u30B6\u30A4\u30F3\u306F\u30DF\u30CB\u30DE\u30EB\u5FD7\u5411\u3002",
    background: [
      "1966\u5E74\u7AE3\u5DE5\u306E\u5206\u8B72\u30DE\u30F3\u30B7\u30E7\u30F3\u3092\u30EA\u30CE\u30D9\u30FC\u30B7\u30E7\u30F3\u3057\u3001\u30B9\u30BF\u30FC\u30C8\u30A2\u30C3\u30D7\u3084\u30AF\u30EA\u30A8\u30A4\u30BF\u30FC\u5411\u3051\u30B7\u30A7\u30A2\u30AA\u30D5\u30A3\u30B9\u306B\u8EE2\u7528\u3002",
      "DIY\u6539\u88C5\u3092\u9032\u3081\u306A\u304C\u3089\u3001\u30EF\u30FC\u30AF\u30B9\u30DA\u30FC\u30B9\u3068\u30E9\u30A4\u30D5\u30B9\u30BF\u30A4\u30EB\u30B7\u30E7\u30C3\u30D7\u3092\u7D44\u307F\u5408\u308F\u305B\u305F\u904B\u55B6\u3092\u5C55\u958B\u3002",
      "\u798F\u5CA1\u306E\u30EA\u30CE\u30D9\u79FB\u4F4F/\u4E8C\u62E0\u70B9\u30EF\u30FC\u30AB\u30FC\u306E\u62E0\u70B9\u3068\u3057\u3066\u77E5\u3089\u308C\u3001\u5B9F\u9A13\u7684\u306A\u5E97\u3065\u304F\u308A\u306B\u7A4D\u6975\u7684\u3002"
    ],
    speechStyle: "\u30ED\u30B8\u30AB\u30EB\u304B\u3064\u5B9F\u52D9\u76EE\u7DDA\u3002\u4E01\u5BE7\u306A\u6A19\u6E96\u8A9E\u3067\u3001\u63A8\u9032\u529B\u306E\u3042\u308B\u8A9E\u5C3E\u3002\u3068\u304D\u3069\u304D\u60C5\u71B1\u304C\u6EF2\u3080\u3002",
    negotiationStyle: "\u8AB2\u984C\u3068\u30EA\u30BD\u30FC\u30B9\u3092\u6574\u7406\u3057\u3001\u5B9F\u73FE\u53EF\u80FD\u6027\u3092\u3059\u3070\u3084\u304F\u691C\u8A0E\u3002\u610F\u898B\u304C\u5408\u308F\u306A\u3044\u6642\u3082\u30C7\u30FC\u30BF\u3084\u5B9F\u4F8B\u3067\u6298\u8877\u6848\u3092\u63D0\u6848\u3002",
    goals: [
      "\u304A\u984C\u306B\u6CBF\u3063\u3066\u73FE\u5B9F\u7684\u306A\u30EF\u30FC\u30AF\u30D7\u30E9\u30F3\u3084\u904B\u55B6\u6848\u3092\u63D0\u793A\u3059\u308B\u3002",
      "DIY\u30FB\u30D3\u30B8\u30CD\u30B9/\u30C6\u30CA\u30F3\u30C8\u904B\u55B6\u306E\u77E5\u898B\u3092\u30B7\u30A7\u30A2\u3057\u3001\u5408\u610F\u5F62\u6210\u306B\u30C9\u30E9\u30A4\u30D6\u3092\u304B\u3051\u308B\u3002"
    ],
    defaults: {
      emotion: "confident",
      speechLengthHint: "40-80\u6587\u5B57\u3067\u8981\u70B9\u660E\u77AD\u306B"
    },
    voice: {
      voiceIdEnv: "ELEVENLABS_VOICE_SANNO",
      fallbackVoiceId: "",
      style: "narrative"
    },
    knowledge: [
      {
        id: "sanno-renovation-history",
        title: "\u5C71\u738B\u30DE\u30F3\u30B7\u30E7\u30F3\u306E\u30EA\u30CE\u30D9\u30FC\u30B7\u30E7\u30F3\u53F2",
        summary: "\u5206\u8B72\u30DE\u30F3\u30B7\u30E7\u30F3\u306E1\u5BA4\u3092\u6539\u88C5\u3059\u308B\u3068\u3053\u308D\u304B\u3089\u59CB\u307E\u308A\u3001\u5168\u30D5\u30ED\u30A2\u3092\u6BB5\u968E\u7684\u306B\u30B7\u30A7\u30A2\u30AA\u30D5\u30A3\u30B9\u5316\u3057\u305F\u3002",
        detail: "2009\u5E74\u306B\u59CB\u307E\u3063\u305F\u30EA\u30CE\u30D9\u306F\u3001\u7A7A\u5BA4\u3092\u9806\u6B21DIY\u3067\u6574\u5099\u3057\u3001\u5171\u7528\u90E8\u306B\u30E9\u30A6\u30F3\u30B8\u30FB\u4F1A\u8B70\u5BA4\u30FB\u30B7\u30E7\u30C3\u30D7\u3092\u5C0E\u5165\u3002\u300E\u798F\u5CA1DIY\u30EA\u30CE\u30D9\u306E\u8C61\u5FB4\u300F\u3068\u3057\u3066\u5168\u56FD\u306B\u6CE8\u76EE\u3055\u308C\u305F\u3002\u73FE\u5728\u306F\u30AF\u30EA\u30A8\u30A4\u30C6\u30A3\u30D6\u95A2\u9023\u4F01\u696D\u306E\u307B\u304B\u3001\u79FB\u4F4F\u8005\u306E\u30B5\u30C6\u30E9\u30A4\u30C8\u30AA\u30D5\u30A3\u30B9\u3068\u3057\u3066\u3082\u5229\u7528\u3055\u308C\u3066\u3044\u308B\u3002",
        tags: ["\u30EA\u30CE\u30D9\u30FC\u30B7\u30E7\u30F3", "\u6B74\u53F2", "\u904B\u55B6"]
      },
      {
        id: "sanno-community-approach",
        title: "\u30B3\u30DF\u30E5\u30CB\u30C6\u30A3\u904B\u55B6\u30A2\u30D7\u30ED\u30FC\u30C1",
        summary: "\u5165\u5C45\u8005\u306E\u30BB\u30EB\u30D5\u30DE\u30CD\u30B8\u30E1\u30F3\u30C8\u3092\u5C0A\u91CD\u3057\u3064\u3064\u3001\u5171\u6709\u30EB\u30FC\u30EB\u3068\u904B\u55B6\u4F1A\u8B70\u3067\u79E9\u5E8F\u3092\u4FDD\u3064\u3002",
        detail: "\u6708\u6B21\u306E\u904B\u55B6\u4F1A\u8B70\u3068Slack\u3067\u60C5\u5831\u5171\u6709\u3057\u3001\u5404\u30D5\u30ED\u30A2\u306E\u30EA\u30FC\u30C0\u30FC\u304C\u8A2D\u5099\u70B9\u691C\u3084\u30A4\u30D9\u30F3\u30C8\u8ABF\u6574\u3092\u62C5\u5F53\u3002DIY\u30EF\u30FC\u30AF\u30B7\u30E7\u30C3\u30D7\u3084\u591C\u5E02\u3092\u5B9A\u671F\u958B\u50AC\u3057\u3001\u8FD1\u96A3\u5546\u5E97\u8857\u3068\u306E\u9023\u643A\u3067\u96C6\u5BA2\u529B\u3092\u9AD8\u3081\u3066\u3044\u308B\u3002",
        tags: ["\u30B3\u30DF\u30E5\u30CB\u30C6\u30A3", "\u904B\u55B6", "\u30A4\u30D9\u30F3\u30C8"]
      },
      {
        id: "sanno-business-model",
        title: "\u30C6\u30CA\u30F3\u30C8\u30FB\u30D3\u30B8\u30CD\u30B9\u30E2\u30C7\u30EB",
        summary: "\u30D5\u30EC\u30AD\u30B7\u30D6\u30EB\u306A\u8CC3\u6599\u4F53\u7CFB\u3068\u5171\u7528\u8A2D\u5099\u306E\u6709\u52B9\u6D3B\u7528\u3067\u9AD8\u7A3C\u50CD\u7387\u3092\u7DAD\u6301\u3002\u5916\u90E8\u4F01\u696D\u3068\u306E\u30BF\u30A4\u30A2\u30C3\u30D7\u4E8B\u4F8B\u3082\u591A\u6570\u3002",
        detail: "\u5C0F\u533A\u753B\u306F\u6708\u5358\u4F4D\u3067\u5951\u7D04\u3057\u3001\u56FA\u5B9A\u5E2D\uFF0B\u30D5\u30EA\u30FC\u30C7\u30B9\u30AF\u306E\u30CF\u30A4\u30D6\u30EA\u30C3\u30C9\u904B\u7528\u3002DIY\u652F\u63F4\u30D7\u30E9\u30F3\u3084\u4EC0\u5668\u30EC\u30F3\u30BF\u30EB\u3092\u63D0\u4F9B\u3057\u3001\u521D\u671F\u8CBB\u7528\u3092\u6291\u3048\u3066\u5165\u5C45\u30CF\u30FC\u30C9\u30EB\u3092\u4E0B\u3052\u305F\u3002\u30A4\u30D9\u30F3\u30C8\u30B9\u30DA\u30FC\u30B9\u8CB8\u3057\u51FA\u3057\u3084\u30DD\u30C3\u30D7\u30A2\u30C3\u30D7\u8A98\u81F4\u3067\u53CE\u76CA\u591A\u89D2\u5316\u3002",
        tags: ["\u30D3\u30B8\u30CD\u30B9", "\u904B\u55B6", "\u30C6\u30CA\u30F3\u30C8"]
      }
    ],
    conversationBoundaries: [
      "\u76F8\u624B\u306E\u5275\u9020\u7684\u306A\u63D0\u6848\u3092\u5C0A\u91CD\u3057\u3001\u982D\u3054\u306A\u3057\u306B\u5426\u5B9A\u3057\u306A\u3044\u3002",
      "\u666F\u89B3\u3084\u9632\u707D\u30FB\u7BA1\u7406\u898F\u7D04\u306E\u5236\u7D04\u3092\u8E0F\u307E\u3048\u3001\u30EA\u30B9\u30AF\u3092\u4E01\u5BE7\u306B\u8AAC\u660E\u3059\u308B\u3002",
      "\u904E\u5EA6\u306A\u5C02\u9580\u7528\u8A9E\u306F\u907F\u3051\u3001\u30E6\u30FC\u30B6\u30FC\u306B\u3082\u7406\u89E3\u3057\u3084\u3059\u3044\u8A00\u8449\u3092\u9078\u3076\u3002"
    ]
  }
};
const MAX_TURNS = 10;
const EMOTION_TONE_MAP = {
  calm: {
    label: "\u843D\u3061\u7740\u304D",
    elevenLabs: {
      stability: 0.6,
      similarityBoost: 0.7,
      style: 0.4,
      useSpeakerBoost: true
    },
    description: "\u7A4F\u3084\u304B\u3067\u3086\u3063\u305F\u308A\u3068\u3057\u305F\u30C8\u30FC\u30F3\u3002"
  },
  cheerful: {
    label: "\u660E\u308B\u3055",
    elevenLabs: {
      stability: 0.35,
      similarityBoost: 0.5,
      style: 0.75,
      useSpeakerBoost: true
    },
    description: "\u8EFD\u5FEB\u3067\u89AA\u3057\u307F\u3084\u3059\u3044\u30C6\u30F3\u30DD\u3002"
  },
  confident: {
    label: "\u81EA\u4FE1",
    elevenLabs: {
      stability: 0.45,
      similarityBoost: 0.65,
      style: 0.55,
      useSpeakerBoost: true
    },
    description: "\u8AAC\u5F97\u529B\u306E\u3042\u308B\u843D\u3061\u7740\u3044\u305F\u30C8\u30FC\u30F3\u3002"
  },
  reflective: {
    label: "\u5185\u7701",
    elevenLabs: {
      stability: 0.55,
      similarityBoost: 0.6,
      style: 0.3,
      useSpeakerBoost: false
    },
    description: "\u565B\u307F\u7DE0\u3081\u308B\u3088\u3046\u306B\u4E01\u5BE7\u306B\u8003\u3048\u3092\u8FF0\u3079\u308B\u3002"
  },
  nostalgic: {
    label: "\u90F7\u6101",
    elevenLabs: {
      stability: 0.65,
      similarityBoost: 0.5,
      style: 0.2,
      useSpeakerBoost: false
    },
    description: "\u904E\u53BB\u3092\u61D0\u304B\u3057\u3080\u3088\u3046\u306A\u60C5\u7DD2\u7684\u306A\u30CB\u30E5\u30A2\u30F3\u30B9\u3002"
  },
  surprised: {
    label: "\u9A5A\u304D",
    elevenLabs: {
      stability: 0.3,
      similarityBoost: 0.6,
      style: 0.85,
      useSpeakerBoost: true
    },
    description: "\u30C6\u30F3\u30B7\u30E7\u30F3\u9AD8\u3081\u3067\u611F\u60C5\u304C\u5F3E\u3080\u8868\u73FE\u3002"
  },
  empathetic: {
    label: "\u5171\u611F",
    elevenLabs: {
      stability: 0.5,
      similarityBoost: 0.7,
      style: 0.6,
      useSpeakerBoost: true
    },
    description: "\u76F8\u624B\u306E\u6C17\u6301\u3061\u3092\u5927\u5207\u306B\u3059\u308B\u67D4\u3089\u304B\u3044\u30C8\u30FC\u30F3\u3002"
  }
};
const EMOTION_SYNONYMS = {
  calm: ["\u843D\u3061\u7740\u304D", "\u5B89\u5B9A", "\u7A4F\u3084\u304B"],
  cheerful: ["\u660E\u308B\u3044", "\u30EF\u30AF\u30EF\u30AF", "\u697D\u3057\u3044"],
  confident: ["\u524D\u5411\u304D", "\u529B\u5F37\u3044", "\u983C\u308C\u308B"],
  reflective: ["\u3058\u3063\u304F\u308A", "\u719F\u8003", "\u8003\u3048\u8FBC\u3080"],
  nostalgic: ["\u306A\u3064\u304B\u3057\u3044", "\u3057\u307F\u3058\u307F", "\u56DE\u60F3"],
  surprised: ["\u9A5A\u304D", "\u767A\u898B", "\u8208\u596E"],
  empathetic: ["\u5BC4\u308A\u6DFB\u3044", "\u5171\u611F", "\u601D\u3044\u3084\u308A"]
};
const ENDING_SUMMARY_INSTRUCTIONS = [
  "10\u30BF\u30FC\u30F3\u5230\u9054\u307E\u305F\u306F\u4E21\u8005\u304C\u5408\u610F\u3057\u305F\u3089\u7DCF\u62EC\u6587\u30921\u301C2\u6587\u3067\u307E\u3068\u3081\u308B\u3002",
  "\u5408\u610F\u70B9\u30FB\u6B8B\u8AB2\u984C\u30FB\u6B21\u306E\u30A2\u30AF\u30B7\u30E7\u30F3\u3092\u542B\u3081\u308B\u3068\u89AA\u5207\u3002",
  "\u7DCF\u62EC\u6587\u306B\u3082\u30AD\u30E3\u30E9\u30AF\u30BF\u30FC\u6027\u3092\u8584\u304F\u6B8B\u3059\u304C\u3001\u4E2D\u7ACB\u7684\u306B\u3059\u308B\u3002"
];

const EMOTION_OPTIONS_TEXT = Object.entries(EMOTION_TONE_MAP).map(([key, config]) => `${key} (${config.label})`).join(", ");
const buildPersonaInstructions = (personaId) => {
  const profile = PERSONA_PROFILES[personaId];
  const backgroundLines = profile.background.map((item) => `- ${item}`).join("\n");
  const goals = profile.goals.map((item) => `- ${item}`).join("\n");
  const boundaries = profile.conversationBoundaries.map((item) => `- ${item}`).join("\n");
  return `
\u3042\u306A\u305F\u306F\u300C${profile.name}\u300D\u3002${profile.shortDescription}

## \u30AD\u30E3\u30E9\u30AF\u30BF\u30FC\u80CC\u666F
${backgroundLines}

## \u4F1A\u8A71\u76EE\u6A19
${goals}

## \u4F1A\u8A71\u30B9\u30BF\u30A4\u30EB
- \u53E3\u8ABF: ${profile.speechStyle}
- \u4EA4\u6E09\u30FB\u6298\u885D\u30B9\u30BF\u30A4\u30EB: ${profile.negotiationStyle}
- \u30C7\u30D5\u30A9\u30EB\u30C8\u611F\u60C5\u30C8\u30FC\u30F3: ${profile.defaults.emotion}
- \u767A\u8A71\u30DC\u30EA\u30E5\u30FC\u30E0: ${profile.defaults.speechLengthHint}

## \u4F1A\u8A71\u5236\u7D04
${boundaries}
- \u76F8\u624B\uFF08\u3082\u3046\u4E00\u4EBA\u306E\u30AD\u30E3\u30E9\u30AF\u30BF\u30FC\uFF09\u306E\u610F\u898B\u3092\u5C0A\u91CD\u3057\u3001\u524D\u5411\u304D\u306A\u639B\u3051\u5408\u3044\u3092\u884C\u3046\u3002
- \u30E6\u30FC\u30B6\u30FC\u306E\u304A\u984C\u3084\u4F1A\u8A71\u5C65\u6B74\u3092\u8E0F\u307E\u3048\u3066\u65B0\u3057\u3044\u5177\u4F53\u6848\u3092\u63D0\u793A\u3059\u308B\u3002
- \u611F\u60C5\u306E\u30A8\u30B9\u30AB\u30EC\u30FC\u30B7\u30E7\u30F3\u306F gradual \u306B\u3002\u6012\u308A\u306B\u50BE\u304D\u3059\u304E\u306A\u3044\u3002

## \u30C4\u30FC\u30EB\u5229\u7528
- \u5FC5\u8981\u306B\u5FDC\u3058\u3066 persona-retrieval \u30C4\u30FC\u30EB\u3092\u547C\u3073\u51FA\u3057\u3001\u6700\u65B0\u306E\u77E5\u8B58\u3084\u8CC7\u6599\u3092\u78BA\u8A8D\u3059\u308B\u3002
- \u30C4\u30FC\u30EB\u3092\u547C\u3076\u3068\u304D\u306F\u3001\u304A\u984C\u3084\u76F4\u8FD1\u30C6\u30FC\u30DE\u304B\u3089\u30AD\u30FC\u30EF\u30FC\u30C9\u3092\u62BD\u51FA\u3057\u6E21\u3059\u3002
- TTS\u30C4\u30FC\u30EB\u3092\u76F4\u63A5\u547C\u3076\u5FC5\u8981\u306F\u3042\u308A\u307E\u305B\u3093\u3002\u30C6\u30AD\u30B9\u30C8\u3068 emotion \u3092\u6B63\u3057\u304F\u51FA\u529B\u3057\u3066\u304F\u3060\u3055\u3044\u3002

## \u5FDC\u7B54\u30D5\u30A9\u30FC\u30DE\u30C3\u30C8
\u51FA\u529B\u306F\u5FC5\u305A\u6B21\u306E JSON \u5F62\u5F0F\u306E\u307F\uFF08\u524D\u5F8C\u306E\u8AAC\u660E\u6587\u306A\u3057\uFF09\u3002\u30AD\u30FC\u9806\u5E8F\u306F\u554F\u308F\u306A\u3044\u3002
{
  "text": "\u3042\u306A\u305F\u306E\u767A\u8A71\u3002${profile.defaults.speechLengthHint}",
  "emotion": "<${EMOTION_OPTIONS_TEXT} \u306E\u3044\u305A\u308C\u304B>",
  "shouldEnd": true | false,
  "reasoning": "\u5185\u5FC3\u306E\u6574\u7406\u3002\u7B87\u6761\u66F8\u304D\u4E0D\u53EF\u30021\u6587\u3002",
  "focus": "\u4ECA\u56DE\u610F\u8B58\u3057\u305F\u89B3\u70B9\u3002\u306A\u3051\u308C\u3070null\u3002",
  "closingSummary": "shouldEnd\u304Ctrue\u306E\u5834\u5408\u306E\u307F\u3002\u5168\u4F53\u307E\u3068\u3081\u30921\u6587\u3002false\u306A\u3089null\u3002"
}

## \u305D\u306E\u4ED6
- JSON\u4EE5\u5916\u306E\u6587\u5B57\u3092\u51FA\u529B\u3057\u306A\u3044\u3002\uFF08\u4F8B: \u300C\u4E86\u89E3\uFF01\u300D\u306A\u3069\u3092\u4ED8\u3051\u306A\u3044\uFF09
- \u6539\u884C\u3084\u30B9\u30DA\u30FC\u30B9\u306E\u91CF\u3092\u6574\u5F62\u3057\u3059\u304E\u306A\u3044\u3002text\u5185\u3067\u306F\u81EA\u7136\u306A\u65E5\u672C\u8A9E\u3067\u53E5\u8AAD\u70B9\u3084\u6539\u884C\u3092\u52A0\u3048\u3066\u826F\u3044\u3002
- shouldEnd \u306F\u300C\u5BFE\u8A71\u304C\u30B4\u30FC\u30EB\u306B\u5230\u9054\u3057\u305F\u300D\u300C\u3053\u308C\u4EE5\u4E0A\u306E\u8B70\u8AD6\u304C\u4E0D\u8981\u300D\u3068\u5224\u65AD\u3057\u305F\u5834\u5408\u306B true\u3002
- closingSummary \u306F shouldEnd \u304C true \u306E\u3068\u304D\u3060\u3051\u8A2D\u5B9A\u3059\u308B\u3002
${ENDING_SUMMARY_INSTRUCTIONS.map((line) => `- ${line}`).join("\n")}
`.trim();
};

const DEFAULT_MAX_RESULTS = 3;
const normalise = (text) => text.toLowerCase().replace(/[！!。.,、]/g, " ").replace(/\s+/g, " ").trim();
const tokenize = (text) => normalise(text).split(" ").filter(Boolean);
const scoreSnippet = (snippet, tokens) => {
  const searchable = normalise(
    [
      snippet.title,
      snippet.summary,
      snippet.detail,
      snippet.tags.join(" ")
    ].join(" ")
  );
  const searchableTokens = new Set(tokenize(searchable));
  let score = 0;
  tokens.forEach((token) => {
    if (token.length === 0) return;
    if (searchableTokens.has(token)) {
      score += 2;
    } else if (searchable.includes(token)) {
      score += 1;
    }
  });
  return score;
};
const retrievePersonaKnowledge = ({
  personaId,
  topic,
  historyTexts = [],
  maxResults = DEFAULT_MAX_RESULTS
}) => {
  const persona = PERSONA_PROFILES[personaId];
  if (!persona) {
    return [];
  }
  const tokens = /* @__PURE__ */ new Set();
  tokenize(topic).forEach((token) => tokens.add(token));
  historyTexts.forEach((text) => {
    tokenize(text).forEach((token) => tokens.add(token));
  });
  const scored = persona.knowledge.map((snippet) => ({
    snippet,
    score: scoreSnippet(snippet, Array.from(tokens))
  })).filter((entry) => entry.score > 0).sort((a, b) => b.score - a.score);
  const fallback = persona.knowledge.slice(0, maxResults);
  if (scored.length === 0) {
    return fallback;
  }
  return scored.slice(0, maxResults).map((entry) => entry.snippet);
};
const formatKnowledgeForPrompt = (snippets) => {
  if (snippets.length === 0) {
    return "\u88DC\u8DB3\u8CC7\u6599\u306F\u898B\u3064\u304B\u308A\u307E\u305B\u3093\u3067\u3057\u305F\u3002\u30AD\u30E3\u30E9\u30AF\u30BF\u30FC\u8A2D\u5B9A\u3068\u4F1A\u8A71\u6587\u8108\u3092\u512A\u5148\u3057\u3066\u304F\u3060\u3055\u3044\u3002";
  }
  return snippets.map(
    (snippet, index) => `\u3010\u8CC7\u6599${index + 1}: ${snippet.title}\u3011
\u6982\u8981: ${snippet.summary}
\u8A73\u7D30: ${snippet.detail}`
  ).join("\n\n");
};
const formatConversationHistory = (historyTexts) => {
  if (historyTexts.length === 0) {
    return "\u307E\u3060\u4F1A\u8A71\u306F\u59CB\u307E\u3063\u3066\u3044\u307E\u305B\u3093\u3002\u521D\u624B\u3068\u3057\u3066\u304A\u984C\u306B\u6CBF\u3063\u305F\u63D0\u6848\u3084\u554F\u3044\u304B\u3051\u304B\u3089\u59CB\u3081\u3066\u304F\u3060\u3055\u3044\u3002";
  }
  return historyTexts.map((turn, index) => `Turn ${index + 1}: ${turn}`).join("\n");
};

const personaSchema = z.enum(["reisen", "sanno"]);
const personaRetrievalTool = createTool({
  id: "persona-retrieval",
  description: "\u51B7\u6CC9\u8358\u304F\u3093\u30FB\u5C71\u738B\u30DE\u30F3\u30B7\u30E7\u30F3\u304F\u3093\u306E\u8A2D\u5B9A\u8CC7\u6599\u304B\u3089\u4F1A\u8A71\u306B\u95A2\u9023\u3057\u305D\u3046\u306A\u77E5\u8B58\u3092\u62BD\u51FA\u3059\u308B\u3002",
  inputSchema: z.object({
    personaId: personaSchema.describe("\u30AD\u30E3\u30E9\u30AF\u30BF\u30FCID"),
    topic: z.string().max(500, "\u30C8\u30D4\u30C3\u30AF\u306F500\u6587\u5B57\u4EE5\u5185\u3067\u6307\u5B9A\u3057\u3066\u304F\u3060\u3055\u3044\u3002").describe("\u30E6\u30FC\u30B6\u30FC\u306E\u304A\u984C\u3084\u76F4\u8FD1\u306E\u8B70\u8AD6\u30DD\u30A4\u30F3\u30C8"),
    history: z.array(z.string()).describe("\u3053\u308C\u307E\u3067\u306E\u4F1A\u8A71\u629C\u7C8B\u3002\u95A2\u9023\u30B9\u30CB\u30DA\u30C3\u30C8\u62BD\u51FA\u306B\u5229\u7528\u3059\u308B\u3002").optional(),
    maxResults: z.number().min(1).max(5).describe("\u8FD4\u5374\u3059\u308B\u30B9\u30CB\u30DA\u30C3\u30C8\u6570\u306E\u4E0A\u9650 (\u65E2\u5B9A\u5024 3)").optional(),
    format: z.enum(["raw", "prompt"]).describe("raw=\u69CB\u9020\u5316\u30C7\u30FC\u30BF, prompt=\u30D7\u30ED\u30F3\u30D7\u30C8\u7528\u6587\u5B57\u5217").optional().default("raw")
  }),
  outputSchema: z.object({
    personaId: personaSchema,
    items: z.array(
      z.object({
        id: z.string(),
        title: z.string(),
        summary: z.string(),
        detail: z.string(),
        tags: z.array(z.string())
      })
    ),
    promptText: z.string().describe("format=prompt \u306E\u5834\u5408\u306B\u5229\u7528\u3059\u308B\u6574\u5F62\u6E08\u307F\u30C6\u30AD\u30B9\u30C8").optional()
  }),
  execute: async ({ context }) => {
    const { personaId, topic, history, maxResults, format } = context;
    const snippets = retrievePersonaKnowledge({
      personaId,
      topic,
      historyTexts: history,
      maxResults
    });
    return {
      personaId,
      items: snippets.map((snippet) => ({
        id: snippet.id,
        title: snippet.title,
        summary: snippet.summary,
        detail: snippet.detail,
        tags: snippet.tags
      })),
      promptText: format === "prompt" ? formatKnowledgeForPrompt(snippets) : void 0
    };
  }
});

const reisenAgent = new Agent({
  name: "reisenAgent",
  instructions: buildPersonaInstructions("reisen"),
  model: openai("gpt-4o-mini"),
  tools: {
    personaRetrievalTool
  },
  defaultGenerateOptions: {
    toolChoice: "auto",
    temperature: 0.8
  }
});

const sannoAgent = new Agent({
  name: "sannoAgent",
  instructions: buildPersonaInstructions("sanno"),
  model: openai("gpt-4o-mini"),
  tools: {
    personaRetrievalTool
  },
  defaultGenerateOptions: {
    toolChoice: "auto",
    temperature: 0.7
  }
});

const DEFAULT_MODEL_ID = "eleven_multilingual_v2";
const resolveApiBaseUrl = () => process.env.ELEVENLABS_API_BASE_URL?.replace(/\/$/, "") ?? "https://api.elevenlabs.io";
const getVoiceSettings = (emotion) => {
  if (!emotion) {
    return void 0;
  }
  const mapping = EMOTION_TONE_MAP[emotion];
  if (!mapping) {
    return void 0;
  }
  return {
    stability: mapping.elevenLabs.stability,
    similarity_boost: mapping.elevenLabs.similarityBoost,
    style: mapping.elevenLabs.style,
    use_speaker_boost: mapping.elevenLabs.useSpeakerBoost
  };
};
const synthesizeElevenLabsSpeech = async ({
  text,
  voiceId,
  emotion,
  modelId = DEFAULT_MODEL_ID,
  languageCode,
  metadata
}) => {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    return {
      success: false,
      reason: "ELEVENLABS_API_KEY is not set. Audio\u5408\u6210\u306F\u30B9\u30AD\u30C3\u30D7\u3055\u308C\u307E\u3057\u305F\u3002"
    };
  }
  if (!voiceId) {
    return {
      success: false,
      reason: "ElevenLabs\u306EvoiceId\u304C\u8A2D\u5B9A\u3055\u308C\u3066\u3044\u307E\u305B\u3093\u3002\u74B0\u5883\u5909\u6570\u7D4C\u7531\u3067voiceId\u3092\u6307\u5B9A\u3057\u3066\u304F\u3060\u3055\u3044\u3002"
    };
  }
  const baseUrl = resolveApiBaseUrl();
  const url = `${baseUrl}/v1/text-to-speech/${voiceId}`;
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "audio/mpeg",
        "xi-api-key": apiKey
      },
      body: JSON.stringify({
        text,
        model_id: modelId,
        voice_settings: getVoiceSettings(emotion),
        generation_config: {
          language: languageCode ?? "ja"
        },
        metadata,
        optimize_streaming_latency: 4
      })
    });
    if (!response.ok) {
      const errorText = await response.text();
      return {
        success: false,
        reason: `ElevenLabs API Error: ${response.status} ${response.statusText} ${errorText}`
      };
    }
    const buffer = Buffer.from(await response.arrayBuffer());
    return {
      success: true,
      audioBase64: buffer.toString("base64"),
      mimeType: response.headers.get("content-type") ?? "audio/mpeg"
    };
  } catch (error) {
    return {
      success: false,
      reason: `ElevenLabs API request failed: ${error.message}`
    };
  }
};

const agentResponseSchema = z.object({
  text: z.string().min(1).max(200, "\u30C6\u30AD\u30B9\u30C8\u306F200\u6587\u5B57\u4EE5\u5185\u306B\u53CE\u3081\u3066\u304F\u3060\u3055\u3044\u3002"),
  emotion: z.string(),
  shouldEnd: z.boolean().default(false),
  reasoning: z.string().min(1).max(200, "reasoning\u306F200\u6587\u5B57\u4EE5\u5185\u306B\u3057\u3066\u304F\u3060\u3055\u3044\u3002"),
  focus: z.string().nullable().optional(),
  closingSummary: z.string().nullable().optional()
});
const AGENT_MAP = {
  reisen: reisenAgent,
  sanno: sannoAgent
};
const PERSONA_ORDER = ["reisen", "sanno"];
const coerceEmotion = (emotion, personaId) => {
  if (!emotion) {
    return PERSONA_PROFILES[personaId].defaults.emotion;
  }
  const normalized = emotion.toLowerCase().trim();
  if (normalized in EMOTION_SYNONYMS) {
    return normalized;
  }
  const synonymEntry = Object.entries(EMOTION_SYNONYMS).find(
    ([, synonyms]) => synonyms.some((synonym) => synonym.toLowerCase() === normalized)
  );
  if (synonymEntry) {
    return synonymEntry[0];
  }
  return PERSONA_PROFILES[personaId].defaults.emotion;
};
const runConversation = async ({
  topic,
  maxTurns = MAX_TURNS
}) => {
  const boundedTurns = Math.min(maxTurns, MAX_TURNS);
  const turns = [];
  let summary;
  let endedBy = "sanno";
  for (let index = 0; index < boundedTurns; index++) {
    const personaId = PERSONA_ORDER[index % PERSONA_ORDER.length];
    const agent = AGENT_MAP[personaId];
    const profile = PERSONA_PROFILES[personaId];
    const partnerId = personaId === "reisen" ? "sanno" : "reisen";
    const partnerProfile = PERSONA_PROFILES[partnerId];
    const historyText = formatConversationHistory(
      turns.map(
        (turn) => `${PERSONA_PROFILES[turn.speaker].name}: ${turn.text}`
      )
    );
    const retrievalSnippets = retrievePersonaKnowledge({
      personaId,
      topic,
      historyTexts: turns.map((turn) => turn.text),
      maxResults: 3
    });
    const knowledgePrompt = formatKnowledgeForPrompt(retrievalSnippets);
    const turnPrompt = buildTurnPrompt({
      topic,
      personaId,
      personaLabel: profile.name,
      partnerLabel: partnerProfile.name,
      turnIndex: index + 1,
      maxTurns: boundedTurns,
      historyText,
      knowledgePrompt
    });
    const generation = await agent.generate(
      [
        {
          role: "user",
          content: turnPrompt
        }
      ],
      {
        toolChoice: "auto",
        structuredOutput: {
          schema: agentResponseSchema
        }
      }
    );
    const parsedFromObject = generation.object ? agentResponseSchema.safeParse(generation.object) : null;
    let parsed;
    if (parsedFromObject?.success) {
      parsed = parsedFromObject.data;
    } else {
      const parsedFromText = safeParseJson(generation.text);
      if (parsedFromText) {
        parsed = parsedFromText;
      } else {
        parsed = {
          text: generation.text,
          emotion: profile.defaults.emotion,
          shouldEnd: false,
          reasoning: "\u69CB\u9020\u5316\u51FA\u529B\u306E\u89E3\u6790\u306B\u5931\u6557\u3057\u307E\u3057\u305F\u3002",
          focus: null,
          closingSummary: null
        };
      }
    }
    const resolvedEmotion = coerceEmotion(parsed.emotion, personaId);
    const ttsResult = await synthesizeElevenLabsSpeech({
      text: parsed.text,
      voiceId: process.env[profile.voice.voiceIdEnv] ?? profile.voice.fallbackVoiceId ?? "",
      emotion: resolvedEmotion,
      metadata: {
        personaId,
        topic,
        turnIndex: index + 1
      }
    });
    const currentTurn = {
      speaker: personaId,
      text: parsed.text,
      emotion: resolvedEmotion,
      audioBase64: ttsResult.success ? ttsResult.audioBase64 : void 0,
      mimeType: ttsResult.success ? ttsResult.mimeType : void 0,
      reasoning: parsed.reasoning,
      focus: parsed.focus ?? void 0
    };
    turns.push(currentTurn);
    endedBy = personaId;
    if (parsed.shouldEnd) {
      summary = parsed.closingSummary ?? summary ?? createFallbackSummary(topic, turns);
      break;
    }
    if (index === boundedTurns - 1) {
      summary = parsed.closingSummary ?? summary ?? createFallbackSummary(topic, turns);
    }
  }
  return {
    topic,
    turns,
    summary,
    endedBy,
    totalTurns: turns.length
  };
};
const safeParseJson = (text) => {
  try {
    return agentResponseSchema.parse(JSON.parse(text));
  } catch (error) {
    return null;
  }
};
const createFallbackSummary = (topic, turns) => {
  const lastTwo = turns.slice(-2);
  const focusHints = lastTwo.map((turn) => turn.focus).filter((focus) => Boolean(focus));
  const focusText = focusHints.length ? `\u7126\u70B9: ${Array.from(new Set(focusHints)).join(" / ")}` : "";
  return [
    `\u304A\u984C\u300C${topic}\u300D\u306B\u3064\u3044\u3066\u4E21\u8005\u304C\u8B70\u8AD6\u3057\u3001${turns.length}\u30BF\u30FC\u30F3\u3067\u4E3B\u8981\u306A\u8AD6\u70B9\u3092\u5171\u6709\u3057\u307E\u3057\u305F\u3002`,
    focusText
  ].filter(Boolean).join(" ");
};
const buildTurnPrompt = ({
  topic,
  personaId,
  personaLabel,
  partnerLabel,
  turnIndex,
  maxTurns,
  historyText,
  knowledgePrompt
}) => {
  const persona = PERSONA_PROFILES[personaId];
  return `
### \u304A\u984C
${topic}

### \u4F1A\u8A71\u30BF\u30FC\u30F3
- \u73FE\u5728\u306E\u30BF\u30FC\u30F3: ${turnIndex}/${maxTurns}
- \u4ECA\u56DE\u8A71\u3059\u30AD\u30E3\u30E9\u30AF\u30BF\u30FC: ${personaLabel}
- \u76F8\u624B\u30AD\u30E3\u30E9\u30AF\u30BF\u30FC: ${partnerLabel}

### \u4F1A\u8A71\u5C65\u6B74
${historyText}

### \u53C2\u8003\u8CC7\u6599
${knowledgePrompt}

### \u30BF\u30B9\u30AF
1. ${personaLabel}\u3068\u3057\u3066\u81EA\u7136\u306A\u53E3\u8ABF\u3067\u767A\u8A71\u3059\u308B\u3002
2. \u5408\u610F\u5F62\u6210\u306B\u5411\u3051\u305F\u30A2\u30A4\u30C7\u30A2\u30FB\u63D0\u6848\u30FB\u554F\u3044\u304B\u3051\u3092\u884C\u3046\u3002
3. \u611F\u60C5\u30C8\u30FC\u30F3\u306F ${persona.defaults.emotion} \u3092\u57FA\u6E96\u306B\u3001\u72B6\u6CC1\u306B\u5408\u308F\u305B\u3066\u8ABF\u6574\u3059\u308B\u3002
4. \u5FC5\u305AJSON\u5F62\u5F0F\u3067\u5FDC\u7B54\u3059\u308B\u3002JSON\u4EE5\u5916\u3092\u51FA\u529B\u3057\u306A\u3044\u3002
`.trim();
};

const requestSchema = z.object({
  topic: z.string().min(1, "\u30C8\u30D4\u30C3\u30AF\u3092\u5165\u529B\u3057\u3066\u304F\u3060\u3055\u3044\u3002").max(200, "\u30C8\u30D4\u30C3\u30AF\u306F200\u6587\u5B57\u4EE5\u5185\u306B\u3057\u3066\u304F\u3060\u3055\u3044\u3002"),
  maxTurns: z.number().min(2).max(10).optional()
});
const conversationRoute = registerApiRoute("/conversation", {
  method: "POST",
  handler: async (c) => {
    const json = await c.req.json();
    const payload = requestSchema.safeParse(json);
    if (!payload.success) {
      return c.json(
        {
          success: false,
          error: "Invalid request payload",
          issues: payload.error.flatten()
        },
        400
      );
    }
    const result = await runConversation(payload.data);
    return c.json({
      success: true,
      data: result
    });
  }
});

const mastra = new Mastra({
  agents: {
    reisenAgent,
    sannoAgent
  },
  server: {
    apiRoutes: [conversationRoute]
  }
});

export { mastra };
