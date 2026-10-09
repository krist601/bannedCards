"use client";
import { useLocale } from "./locale-provider";

export function PaymentBadge({ status }: { status: "paid" | "not_paid" }) {
  const { t } = useLocale();
  return <span className={`payment-badge payment-badge-${status === "paid" ? "paid" : "unpaid"}`}>{status === "paid" ? t("Paid") : t("Not paid")}</span>;
}
