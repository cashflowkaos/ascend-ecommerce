import { compounds } from "../data/compounds";

export async function getProducts() {
  return compounds;
}

export async function getFeaturedProducts() {
  return compounds.filter((p) => p.featured);
}

export async function getProduct(slug: string) {
  return compounds.find((p) => p.slug === slug) ?? null;
}