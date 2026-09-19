import { desc } from "drizzle-orm";
import { getDb } from "@/db";
import { memories } from "@/db/schema";

const traits = {
  vision: { title: "عزّنا برؤيتنا", color: "#8f6b25" },
  courage: { title: "عزّنا بشجاعتنا", color: "#607c41" },
  determination: { title: "عزّنا بهمتنا", color: "#a31355" },
  authenticity: { title: "عزّنا بأصالتنا", color: "#5bab1e" },
  generosity: { title: "عزّنا بكرمنا", color: "#0060bf" },
  giving: { title: "عزّنا بجودنا", color: "#6656e0" },
} as const;

export async function GET() {
  try {
    const rows = await getDb()
      .select()
      .from(memories)
      .orderBy(desc(memories.createdAt), desc(memories.id))
      .limit(100);
    return Response.json({ memories: rows });
  } catch (error) {
    console.error("Failed to load memories", error);
    return Response.json({ error: "تعذر تحميل جدار البصمات الآن." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as {
      name?: string;
      message?: string;
      traitKey?: string;
      anonymous?: boolean;
    };
    const message = payload.message?.trim() ?? "";
    const rawName = payload.name?.trim() ?? "";
    const traitKey = payload.traitKey as keyof typeof traits;
    const trait = traits[traitKey];

    if (!message || message.length > 180) {
      return Response.json({ error: "اكتبي رسالة لا تتجاوز 180 حرفًا." }, { status: 400 });
    }
    if (!trait) {
      return Response.json({ error: "اختاري إحدى القيم." }, { status: 400 });
    }

    const name = payload.anonymous ? "مشارك دون اسم" : (rawName || "مشارك من جامعة نجران").slice(0, 30);
    const [memory] = await getDb()
      .insert(memories)
      .values({ name, message, traitKey, traitTitle: trait.title, color: trait.color })
      .returning();

    return Response.json({ memory }, { status: 201 });
  } catch (error) {
    console.error("Failed to save memory", error);
    return Response.json({ error: "تعذر حفظ بصمتك الآن. حاولي مرة أخرى." }, { status: 500 });
  }
}
