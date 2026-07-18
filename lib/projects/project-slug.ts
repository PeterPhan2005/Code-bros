const PROJECT_SLUG_FALLBACK = "project";

export function toProjectSlug(name: string) {
  const slug = name
    .normalize("NFKD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  return slug || PROJECT_SLUG_FALLBACK;
}
