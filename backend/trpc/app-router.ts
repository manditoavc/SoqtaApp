import { createTRPCRouter } from "./create-context";
import hiRoute from "./routes/example/hi/route";
import { listOrdersRoute } from "./routes/orders/list";
import { createOrderRoute } from "./routes/orders/create";
import { updateOrderRoute } from "./routes/orders/update";
import { deleteOrderRoute } from "./routes/orders/delete";
import { listNotificationsRoute } from "./routes/notifications/list";
import { markNotificationAsReadRoute } from "./routes/notifications/markAsRead";
import { getSalesRoute } from "./routes/sales/get";
import { closeSalesRoute } from "./routes/sales/close";
import { resetSalesRoute } from "./routes/sales/reset";
import { openSalesRoute } from "./routes/sales/open";

export const appRouter = createTRPCRouter({
  example: createTRPCRouter({
    hi: hiRoute,
  }),
  orders: createTRPCRouter({
    list: listOrdersRoute,
    create: createOrderRoute,
    update: updateOrderRoute,
    delete: deleteOrderRoute,
  }),
  notifications: createTRPCRouter({
    list: listNotificationsRoute,
    markAsRead: markNotificationAsReadRoute,
  }),
  sales: createTRPCRouter({
    get: getSalesRoute,
    close: closeSalesRoute,
    reset: resetSalesRoute,
    open: openSalesRoute,
  }),
});

export type AppRouter = typeof appRouter;
