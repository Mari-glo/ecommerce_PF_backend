import express from "express";
import cookieParser from "cookie-parser";
import handlebars from "express-handlebars";
import session from "express-session";
import passport from "passport";
import { Server } from "socket.io";
import config from "./config/config.js";
import { mongoDBConnection } from "./config/mongoDBconfig.js";
import { initializePassport } from "./config/passportConfig.js";
import { apiRoutes } from "./routes/api.routes.js";
import { routerViews } from "./routes/views.routes.js";
import * as messageServices from "./services/message.services.js";
import * as productServices from "./services/product.services.js";
import { logger } from "./utils/logger.js";


const { PORT, COOKIE_SECRET } = config;

const app = express();

app.engine(
  "handlebars", handlebars.engine({ 
    runtimeOptions: {
      allowProtoPropertiesByDefault: true,
      allowProtoMethodsByDefault: true,
    },
  })
);
app.set("views", "views");
app.set("view engine", "handlebars");

mongoDBConnection();

app.use(express.static('public'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser(COOKIE_SECRET));
app.use(session({ secret: COOKIE_SECRET, resave: true, saveUninitialized: true }));
initializePassport();
app.use(passport.initialize());
app.use(passport.session());


// Configuración de la documentación de la API
import swaggerJSDoc from "swagger-jsdoc";
import swaggerUiExpress from "swagger-ui-express";

const swaggerOptions = {
  definition: {
    openapi: "3.0.1",
    info: {
      title: "Documentación de la API",
      description: "Documentación de la API ; gestión de productos y carritos de compra",
    },
  },
  apis: ["./docs/**/*.yaml"],
};

const specs = swaggerJSDoc(swaggerOptions);

app.use("/docs", swaggerUiExpress.serve, swaggerUiExpress.setup(specs));
app.use("/api", apiRoutes);
app.use("/", routerViews);
app.get("*", (req, res) => {
  res.status(404).send({ error: "Página no encontrada" });
});

const httpServer = app.listen(PORT, () => {
  logger.info(`Servidor conectado desde puerto ${PORT}`);
});

const socketServer = new Server(httpServer);

socketServer.on("connection", async (socket) => {
  logger.info(`Cliente conectado ${socket.id}`);
  const products = await productServices.getAllProducts();

  socket.emit("products", products.docs);

  const messages = await messageServices.getMessages();
  socket.emit("messages", messages);

  socket.on("new-product", async (data) => {
    await productServices.addProduct(data);
    const products = await productServices.getAllProducts();
    socket.emit("products", products.docs);
  });

  socket.on("delete", async (id) => {
    await productServices.deleteProduct(id);
    const products = await productServices.getAllProducts();
    socket.emit("products", products.docs);
  });

  socket.on("chatMessage", async (data) => {
    await messageServices.saveMessage(data);
    const messages = await messageServices.getMessages();
    socketServer.emit("messages", messages);
  });
});