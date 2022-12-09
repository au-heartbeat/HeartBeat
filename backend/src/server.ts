import Koa from "koa";
import bodyParser from "koa-bodyparser";
import cors from "@koa/cors";


import { config } from "./config";
import { swaggerRouter } from "./router";
import errorHandler from "./errorHandler";

console.log("try to start");
const app = new Koa();

app.use(cors());
app.use(bodyParser());
app.use(errorHandler());
app.use(swaggerRouter.routes()).use(swaggerRouter.allowedMethods());

console.log(`Server running on port ${config.port}`);

export default app.listen(process.env.PORT || config.port);
