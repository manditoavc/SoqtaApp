import { publicProcedure } from "../../create-context";
import { ordersDb } from "../../../db/orders-db";

export const listNotificationsRoute = publicProcedure.query(() => {
  return ordersDb.getNotifications();
});
