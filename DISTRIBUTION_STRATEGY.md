# FocusFlow 全球分发与支付策略 (Global Distribution & Payment Strategy) V2

## 1. 支付方案核心架构 (The "Revenue Stack")

为了平衡“开发难度”、“手续费成本”和“合规性”，我们建议采用 **RevenueCat + IAP + Stripe** 的混合架构。

| 渠道 | 支付工具 | 抽成 | 评价 |
| :--- | :--- | :--- | :--- |
| **iOS (App Store)** | Apple IAP | 15% - 30% | **强制性**。不走这个会被下架。通过 RevenueCat 接入可极大简化逻辑。 |
| **Android (Google Play)** | Google Billing | 15% | **强制性**。适用于国际版。 |
| **Android (中国区/官网版)** | Stripe / 支付宝 / 微信 | 1% - 3% | **高自由度**。不受谷歌限制，建议通过 Stripe 接入网页版支付。 |
| **Web 官网** | **Stripe** | ~3% | **利润最高**。建议引导核心老用户在此续费。 |

---

## 2. RevenueCat：支付救星 (Recommended Workflow)

不要直接调用 Apple/Google 的底层 SDK，使用 **RevenueCat** 封装：
1.  **统一模型**: 定义一次 `pro_membership`，它自动对应 Apple 的 IAP ID 和 Stripe 的价格 ID。
2.  **免后端验证**: 它自动处理收据验证，你不需要自己写服务器。
3.  **防作弊**: 自动处理黑产退款、跨设备多开等异常。

---

## 3. 苹果/谷歌合规死线 (Compliance Hard-lines)

### ❌ 绝对禁止 (会导致下架)
*   在 iOS/Android App 内显示：“由于苹果抽成，请去官网购买更便宜”。
*   在 App 内部放置任何指向 Stripe 支付页面的外链。
*   在 App 内部提供使用信用卡直接支付数字功能的功能。

### ✅ 允许操作
*   **静默同步**: 用户在 Web 端支付后，App 内登录即解锁（App 内保持沉默）。
*   **外部链接政策 (仅限部分地区)**: 在欧盟等特定地区，现在允许有限度地告知用户有外部支付选项，但操作流程极其繁琐且仍需缴纳“引导费”。

---

## 4. 实施建议 (Implementation Plan)

1.  **初期 (MVP)**: 仅接入 **Apple IAP** (通过 RevenueCat)。虽然抽成 30%，但它能让你最快拿到第一笔收入，且无需担心合规。
2.  **中期 (Scale)**: 建立 **FocusFlow Web Dashboard**，接入 **Stripe**。在发送给用户的营销邮件、社交媒体广告中推广官网购买链接。
3.  **长期 (Optimization)**: 利用 RevenueCat 的实验功能，对官网 Stripe 用户和 App Store 用户展示不同的促销活动。

---

## 5. 总结
**Stripe 是省钱的工具，但 IAP 是在苹果/谷歌领地生存的门票。** 我们通过 RevenueCat 把这两者桥接起来，实现“代码写一次，钱从四方来”。