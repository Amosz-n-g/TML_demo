import fs from "fs";
import path from "path";

const IMAGE_MAP: Record<string, string> = {
  confusion_matrix: "confusion_matrix.png",
  per_class_accuracy: "per_class_accuracy.png",
};

export async function GET(_: Request, { params }: { params: { imageName: string } | Promise<{ imageName: string }> }) {
  const resolvedParams = await params;
  const imageName = resolvedParams.imageName;
  const imageFile = IMAGE_MAP[imageName];

  if (!imageFile) {
    return new Response(JSON.stringify({ error: "Not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  const imagePath = path.resolve(process.cwd(), "public", imageFile);
  try {
    const buffer = await fs.promises.readFile(imagePath);
    return new Response(buffer, {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=86400, stale-while-revalidate=3600",
      },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: "Unable to load image" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
