import { Router } from "express";
import { cartDetail, changePass, chat, home, loginUser, logoutUser, productDetail, products, realTimeProducts,
  registerUser, resetPassword, viewChangePass, viewLogin, viewProfile, viewRegister, viewResetPassword, addProductToCart,
  buyCart, admin } from "../controller/views.controller.js";
import { checkResetToken } from "../middlewares/checkResetToken.js";
import { checkToken } from "../middlewares/checkToken.js";
import { isAdmin } from "../middlewares/checkUser.js";

const routerViews = Router();

routerViews.get("/home", home);

routerViews.get("/realtimeproducts", realTimeProducts);

routerViews.get("/chat", chat);

routerViews.get("/products", checkToken, products);

routerViews.get("/product/:pid", checkToken, productDetail);

routerViews.get("/cart/:cid", checkToken, cartDetail);

routerViews.get("/cart", checkToken, cartDetail);

routerViews.post("/cart/:pid", checkToken, addProductToCart);
routerViews.post("/cart/buy/:cid", checkToken, buyCart);

routerViews.get("/login", viewLogin);

routerViews.post("/login", loginUser);

routerViews.get("/register", viewRegister);

routerViews.post("/register", registerUser);

routerViews.get("/profile", checkToken, viewProfile);

routerViews.get("/logout", checkToken, logoutUser);

routerViews.get("/resetpassword", viewResetPassword);
routerViews.post("/resetpassword", resetPassword);

routerViews.get("/changePass/:token", checkResetToken, viewChangePass);
routerViews.post("/changePass", changePass);

routerViews.get("/admin", checkToken, isAdmin, admin);

// Documentación de la API
// routerViews.get("/docs", swaggerUiExpress.serve, swaggerUiExpress.setup(specs));

export { routerViews };