import * as cartDao from "../dao/mongo/cart.dao.js";


const getAllCarts = async () => {
  const carts = await cartDao.getAllCarts();
  return carts;
};


const getCartById = async (cid) => {
  const cart = await cartDao.getCartById(cid);
  return cart;
};


const addCart = async () => {
  const cart = await cartDao.addCart();
  return cart;
};


const addProductToCart = async (cid, pid) => {
  const cartUpdate = await cartDao.addProductToCart(cid, pid);

  return cartUpdate;
};


const deleteCart = async (cid) => {
  const cartDelete = await cartDao.deleteCart(cid);

  return cartDelete;
};


const removeAllProductsFromCart = async (cid) => {
  const cartUpdate = await cartDao.removeAllProductsFromCart(cid);

  return cartUpdate;
};


const updateCart = async (cid, arrayProducts) => {
  const cartUpdate = await cartDao.updateCart(cid, arrayProducts);

  return cartUpdate;
};


const updateProductQuantity = async (cid, pid, quantity) => {
  const cartUpdate = await cartDao.updateProductQuantity(cid, pid, quantity);

  return cartUpdate;
};


const removeProductFromCart = async (cid, pid) => {
  const cartUpdate = await cartDao.removeProductFromCart(cid, pid);

  return cartUpdate;
};

const purchaseCart = async (cid, user) => {
  const cart = await cartDao.purchaseCart(cid, user);
  return cart;
};

export { getAllCarts, getCartById, addCart, addProductToCart, deleteCart, removeAllProductsFromCart, updateCart,
  updateProductQuantity, removeProductFromCart, purchaseCart, };