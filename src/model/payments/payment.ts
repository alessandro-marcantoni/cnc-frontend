import type { DateValue } from "@internationalized/date";

export type Payment = {
  amount: number;
  currency: string;
  paidAt: DateValue;
  paymentMethod: string | null;
  transactionRef: string | null;
};
