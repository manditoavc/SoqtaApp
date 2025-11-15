import { publicProcedure } from "../../create-context";
import { ordersDb } from "../../../db/orders-db";

export const listOrdersRoute = publicProcedure.query(() => {
  return ordersDb.getAllOrders();
});
