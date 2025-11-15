import { publicProcedure } from "../../create-context";
import { ordersDb } from "../../../db/orders-db";

export const resetSalesRoute = publicProcedure
  .mutation(async () => {
    ordersDb.resetDailySales();
    return { success: true };
  });
