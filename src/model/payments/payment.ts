import type { DateValue } from "@internationalized/date";

export type Payment = {
  id: number;
  amount: number;
  currency: string;
  paidAt: DateValue;
  paymentMethod: string | null;
  transactionRef: string | null;
};
