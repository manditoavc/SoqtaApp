import { publicProcedure } from "../../create-context";
import { ordersDb } from "../../../db/orders-db";
import { z } from "zod";

export const closeSalesRoute = publicProcedure
  .input(
    z.object({
      closedBy: z.string()
    })
  )
  .mutation(async ({ input }) => {
    const closed = ordersDb.closeDailySales(input.closedBy);
    if (!closed) {
      throw new Error("El d\u00eda ya estaba cerrado o ocurri\u00f3 un error.");
    }
    return { success: true };
  });
