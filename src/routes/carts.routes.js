import { Router } from "express";
import { addCart, addProductInUserCart, addProductToCart, deleteAllProductsFromCart, deleteCart, deleteProductFromCart,
  getAllCarts, getCartById, purchaseCart, updateProductQuantityFromCart, updateProductsFromCart, } from "../controller/carts.controller.js";
import { isAuthorize, isLogin, isUserAuthorized } from "../middlewares/checkUser.js";

const routerCarts = Router();


routerCarts.get("/", getAllCarts);

routerCarts.get("/:cid", getCartById);

routerCarts.post("/", isAuthorize, addCart);

routerCarts.post("/:cid/products/:pid", isLogin, isUserAuthorized, addProductToCart);

routerCarts.post("/products/:pid", isLogin, isUserAuthorized, addProductInUserCart);

routerCarts.post("/:cid/purchase", isLogin, purchaseCart);

routerCarts.delete("/:cid", isAuthorize, deleteCart);

routerCarts.delete("/:cid/products", deleteAllProductsFromCart);

routerCarts.delete("/:cid/products/:pid", deleteProductFromCart);

routerCarts.put("/:cid", updateProductsFromCart);

routerCarts.put("/:cid/products/:pid", isAuthorize, updateProductQuantityFromCart);

export { routerCarts };