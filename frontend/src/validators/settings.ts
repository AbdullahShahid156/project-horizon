import { z } from 'zod';

export const updateSettingsSchema = z.object({
  theme: z.enum(['light', 'dark', 'system']),
  timezone: z.string().min(1),
  language: z.string().min(1),
  emailNotifications: z.boolean(),
  pushNotifications: z.boolean(),
});

export type UpdateSettingsInput = z.infer<typeof updateSettingsSchema>;
