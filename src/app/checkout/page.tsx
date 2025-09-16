// app/checkout/page.tsx
import CheckoutClient from "./CheckoutClient";

export const dynamic = "force-dynamic"; // make sure we always use fresh cart data
export const revalidate = 0;

export default async function CheckoutPage() {
  return <CheckoutClient />;
}
