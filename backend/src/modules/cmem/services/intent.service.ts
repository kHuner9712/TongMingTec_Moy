import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { CustomerIntent } from "../entities/customer-intent.entity";

const INTENT_RULES: Array<{
  keywords: string[];
  intentType: string;
  confidence: number;
}> = [
  {
    keywords: ["投诉", "退款", "取消", "差评", "不满"],
    intentType: "complaint",
    confidence: 0.85,
  },
  {
    keywords: ["价格", "购买", "下单", "报价", "多少钱"],
    intentType: "purchase",
    confidence: 0.8,
  },
  {
    keywords: ["续费", "到期", "续约", "续订"],
    intentType: "renewal",
    confidence: 0.85,
  },
  {
    keywords: ["沉默", "无响应", "失联", "不回复"],
    intentType: "churn_risk",
    confidence: 0.75,
  },
];

@Injectable()
export class IntentService {
  constructor(
    @InjectRepository(CustomerIntent)
    private readonly intentRepo: Repository<CustomerIntent>,
  ) {}

  async detectIntent(
    customerId: string,
    orgId: string,
    input: { content: string; sourceType: string },
  ): Promise<CustomerIntent> {
    let matchedIntent = "inquiry";
    let matchedConfidence = 0.6;
    const matchedKeywords: string[] = [];

    for (const rule of INTENT_RULES) {
      for (const keyword of rule.keywords) {
        if (input.content.includes(keyword)) {
          matchedIntent = rule.intentType;
          matchedConfidence = rule.confidence;
          matchedKeywords.push(keyword);
          break;
        }
      }
      if (matchedIntent !== "inquiry") break;
    }

    const intent = this.intentRepo.create({
      orgId,
      customerId,
      intentType: matchedIntent,
      confidence: matchedConfidence,
      evidence: {
        sourceType: input.sourceType,
        matchedKeywords,
        contentSnippet: input.content.substring(0, 200),
      },
      detectedAt: new Date(),
    });

    return this.intentRepo.save(intent);
  }

  async getIntent(
    customerId: string,
    orgId: string,
  ): Promise<CustomerIntent | null> {
    const intents = await this.intentRepo.find({
      where: { customerId, orgId },
      order: { detectedAt: "DESC" },
      take: 1,
    });
    return intents.length > 0 ? intents[0] : null;
  }

  async getLatestIntent(
    customerId: string,
    orgId: string,
  ): Promise<CustomerIntent | null> {
    return this.getIntent(customerId, orgId);
  }
}
