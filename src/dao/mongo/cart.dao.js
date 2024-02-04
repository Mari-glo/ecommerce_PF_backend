import { cartModel } from "../models/carts.model.js";
import * as productService from "../../services/product.services.js";
import * as ticketService from "../../services/ticket.services.js";
import { sendTicketMail } from "../../utils/sendTicketMail.js";


const getAllCarts = async () => {
  const carts = await cartModel.find();
  return carts;
};


const getCartById = async (cid) => {
  const cart = await cartModel.findOne({ _id: cid }).populate("products.product");
  return cart;
};


const addCart = async () => {
  const newCart = {
    products: [],
  };
  const cart = await cartModel.create(newCart);
  return cart;
};


const addProductToCart = async (cid, pid) => {
  const cart = await getCartById(cid);
  const cartUpdate = await cartModel.findOneAndUpdate(
    { _id: cid, "products.product": pid },
    { $inc: { "products.$.quantity": 1 } },
    { new: true }
  );

  if (!cartUpdate) {
    const newCart = await cartModel.findByIdAndUpdate(
      cid,
      { $push: { products: { product: pid, quantity: 1 } } },
      { new: true }
    );
    const total = await sumTotal(cid);
    await cartModel.findOneAndUpdate({ _id: cid }, { $set: { total } });
    return newCart;
  }
  const total = await sumTotal(cid);
  await cartModel.findOneAndUpdate({ _id: cid }, { $set: { total } });
  return cart;
};


const deleteCart = async (cid) => {
  const cartDelete = await cartModel.deleteOne({ _id: cid });

  return cartDelete;
};


const removeAllProductsFromCart = async (cid) => {
  const cart = await getCartById(cid);

  const cartUpdate = await cart.updateOne({ $set: { products: [] } });

  return cartUpdate;
};


const updateCart = async (cid, arrayProducts) => {
  await removeAllProductsFromCart(cid);

  arrayProducts.forEach(async (product) => {
    await addProductToCart(cid, product._id);
  });

  return await getCartById(cid);
};


const updateProductQuantity = async (cid, pid, quantity) => {
  const cartUpdate = await cartModel.findOneAndUpdate(
    { _id: cid, "products.product": pid },
    { $set: { "products.$.quantity": quantity } },
    { new: true }
  );

  return cartUpdate;
};


const removeProductFromCart = async (cid, pid) => {
  
  const cart = await getCartById(cid);
  if (!cart) return "Carrito no encontrado"
  const product = await productService.getProductById(pid);
  if (!product) return "Producto no encontrado"

  const cartUpdate = await cartModel.findOneAndUpdate(
    { _id: cart._id, "products.product": product._id },
    { $inc: { "products.$.quantity": -1 } },
    { new: true }
  );

  
  if (cartUpdate.products.find((product) => product.quantity <= 0)) {
    await cartModel.findOneAndUpdate(
      { _id: cart._id },
      { $pull: { products: { quantity: { $lte: 0 } } } },
      { new: true }
    );

    return cartUpdate;
  };
};

const deleteProductFromCart = async (cid, pid) => {
  const cart = await getCartById(cid);
  if (!cart) return "Carrito no encontrado"
  const product = await productService.getProductById(pid);
  if (!product) return "Producto no encontrado"

  const cartUpdate = await cartModel.findOneAndUpdate(
    { _id: cart._id, "products.product": product._id },
    { $pull: { products: { product: product._id } } },
    { new: true }
  );

  return cartUpdate;
};


const purchaseCart = async (cid, user) => {

  const cart = await getCartById(cid);

  let productsOutOfStock = [];
  let productsInStock = [];

  for (const product of cart.products) {

    
    if (product.product.stock > product.quantity) {
      productsInStock.push(product);
      
      await deleteProductFromCart(cid, product.product._id);
      
      await productService.updateProduct(product.product._id, { stock: product.product.stock - product.quantity });
      await sumTotal(cid);
    } else {
      productsOutOfStock.push(product);
    }
  };

  
  const total = productsInStock.reduce((acc, product) => {
    return acc + product.product.price * product.quantity;
  }, 0);

  if(productsInStock.length === 0) return "No hay suficiente stock para realizar la compra"

  
  const ticket = await ticketService.generateTicket({
    purchaser: user.email,
    products: productsInStock,
    amount: total,
  });

  
  await sumTotal(cid);

  
  sendTicketMail(ticket);

  return ticket;

};



const sumTotal = async (cid) => {
  const cart = await getCartById(cid);

  const total = cart.products.reduce((acc, product) => {
    return acc + product.product.price * product.quantity;
  }, 0);

  
  await cartModel.findOneAndUpdate({ _id: cid }, { $set: { total } });

  return total;
};

export { getAllCarts, getCartById, addCart, addProductToCart, deleteCart, removeAllProductsFromCart,
  updateCart, updateProductQuantity, removeProductFromCart, purchaseCart, };