import { z } from "zod";

export const projectSchema = z.object({
  title: z.string().min(3),
  slug: z.string().min(3),

  category: z.string().min(1),
  status: z.enum(["Completed", "Ongoing"]),

  client: z.string().min(2),
  location: z.string().min(2),

  year: z.coerce.number(),

  duration: z.string(),
  budget: z.string(),
  area: z.string(),

  description: z.string().min(10),

  featured: z.boolean(),
});

export type ProjectFormInput = z.input<typeof projectSchema>;
export type ProjectFormValues = z.output<typeof projectSchema>;