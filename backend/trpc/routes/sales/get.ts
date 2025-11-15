import { publicProcedure } from "../../create-context";
import { ordersDb } from "../../../db/orders-db";
import { z } from "zod";

export const getSalesRoute = publicProcedure
  .input(
    z.object({
      date: z.string().optional()
    }).optional()
  )
  .query(async ({ input }) => {
    const date = input?.date || undefined;
    const dailySales = ordersDb.getDailySales(date);
    return dailySales;
  });
