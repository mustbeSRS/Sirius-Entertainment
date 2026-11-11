import { z } from 'zod';
import { parsePhoneNumberFromString } from 'libphonenumber-js';
export const registrationSchema = z.object({
 fullName: z.string().trim().min(2).max(120),
 email: z.email().max(254).transform(v => v.trim().toLowerCase()),
 phone: z.string().max(40).transform((value, ctx) => { const phone = parsePhoneNumberFromString(value, 'OM'); if (!phone?.isValid()) { ctx.addIssue({ code: 'custom', message: 'Enter a valid mobile number, including country code.' }); return z.NEVER; } return phone.number; }),
 marketing: z.boolean().default(false),
 terms: z.literal(true),
});
