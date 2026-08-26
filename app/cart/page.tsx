import MemberCart from "@/components/cart/MemberCart";
import { requireApprovedMember } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function CartPage() {
  await requireApprovedMember();

  return <MemberCart />;
}