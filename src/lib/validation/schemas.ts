import { z } from "zod";

export const SocialSignalSchema = z.object({
  entity_id: z.string().uuid(),
  entity_name: z.string().min(1).max(300),
  platform: z.enum(["instagram", "twitter", "facebook", "youtube"]),
  signal_type: z.enum(["mention_spike", "sentiment_drop", "viral_post", "crisis_alert"]),
  mentions_count: z.number().int().min(0),
  sentiment_score: z.number().min(-1).max(1),
  detected_at: z.string().datetime({ local: false }),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export type SocialSignal = z.infer<typeof SocialSignalSchema>;