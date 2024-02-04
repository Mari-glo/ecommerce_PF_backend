import ProductManager from "./ProductsManager.js";
import cartModel from "../../models/carts.model.js";
import ticketModel from "../../models/ticket.model.js";
import {faker} from "@faker-js/faker";
import {enumErrors} from "../../../errors/enumErrors.js";

const dbpm = new ProductManager();

export default class CartsManager {
  constructor() {}

  async getAll() {
    try {
      const carts = await cartModel.find().populate("products._id");
      if (!carts.length)
        return {
          status: 204,
          message: "No carts created",
          payload: carts,
        };

      return {
        status: 200,
        message: "Carts obtained successfully",
        payload: carts,
      };
    } catch (error) {
      return {
        statusCode: 500,
        error: true,
        name: "Error occurred at moment of getting carts",
        cause: error.toString(),
        message: "We are working to fix this issue",
        code: enumErrors.ERROR_FROM_SERVER,
      };
    }
  }


  async getById(id) {
    try {
      const cart = await cartModel.findById(id).lean().populate("products._id");
      if (cart === null)
        return {
          statusCode: 404,
          error: true,
          name: `Cart not found`,
          cause: `The cart with the id sent not exist`,
          message: "Check if the id is correct and try again",
          code: enumErrors.NOT_FOUND,
        };

      const cartProducts = cart.products.map((cartProduct) => {
        const productPid = {...cartProduct._id};
        const quantity = cartProduct.quantity;
        return {...productPid, quantity};
      });

      return {
        status: 200,
        message: "Cart obtained successfully",
        payload: cartProducts,
      };
    } catch (error) {
      return {
        statusCode: 500,
        error: true,
        name: "An error occurred while obtaining the cart by id",
        cause: error.toString(),
        message: "We are working to fix this issue",
        code: enumErrors.ERROR_FROM_SERVER,
      };
    }
  }


  async post(products = []) {
    try {
      if (!products.length) {
        const cart = await cartModel.create({products: []});
        return {
          status: 201,
          message: "Cart created successfully",
          payload: cart,
        };
      }

      const getProducts = await dbpm.getAll();
      if (getProducts.error) return getProducts;
      const dbProducts = getProducts.payload;

      const productsId = dbProducts.map((product) => product._id.toString());
      const productsIdToInsert = products.map((product) => product.pid);

      const productsExist = productsIdToInsert.every((id) =>
        productsId.includes(id)
      );

      if (!productsExist)
        return {
          statusCode: 404,
          error: true,
          name: "Product not exist",
          cause:
            "An attempt was made to add a non-existent product to the cart",
          message: "Check the product ids and try again",
          code: enumErrors.NOT_FOUND,
        };

      products = products.map((product) => {
        product._id = product.pid;
        product.pid = undefined;
        return product;
      });

      const cart = await cartModel.create({products});

      return {
        status: 201,
        message: "Cart created successfully",
        payload: cart,
      };
    } catch (error) {
      return {
        statusCode: 500,
        error: true,
        name: "Error occurred at moment of create the cart",
        cause: error.toString(),
        message: "We are working to fix this issue",
        code: enumErrors.ERROR_FROM_SERVER,
      };
    }
  }


  async postProductToCart(cid, pid, user) {
    try {
      const getCart = await this.getById(cid);
      if (getCart.error) return getCart;

      const cart = getCart.payload;

      const getProduct = await dbpm.getById(pid);
      if (getProduct.error) return getProduct;

      const productFinded = getProduct.payload;
      const productInCart = cart.find((product) => product._id == pid);

      if (productInCart) {
        const productIndex = cart.findIndex((product) => product._id == pid);
        const newCart = cart;
        newCart[productIndex].quantity++;
        const updateResponse = await cartModel.findByIdAndUpdate(
          cid,
          {
            products: newCart,
          },
          {new: true}
        );

        return {
          status: 200,
          message: "Quantity of product icreased successfully",
          payload: updateResponse.products,
        };
      }

      /*if (productFinded.owner === user.email)
          return {
          statusCode: 400,
          error: true,
          name: "It is not possible to add your own product to the cart",
          cause: "The product you are trying to add was created by yourself",
          message:
            "Try adding a product that is not yours",
          code: enumErrors.INVALID_REQUEST,
        }; */

      const postResponse = await cartModel.findByIdAndUpdate(
        cid,
        {
          $push: {products: {_id: pid, quantity: 1}},
        },
        {new: true}
      );

      return {
        status: 200,
        message: "Product added successfully",
        payload: postResponse.products,
      };
    } catch (error) {
      return {
        statusCode: 500,
        error: true,
        name: "Error occurred at moment of post product to cart",
        casue: error.toString(),
        message: "We are working to fix this issue",
        code: enumErrors.ERROR_FROM_SERVER,
      };
    }
  }


  async putProducts(cid, products) {
    try {
      const getCart = await this.getById(cid);
      if (getCart.error) return getCart;

      const getProducts = await dbpm.getAll();
      if (getProducts.error) return getProducts;
      const dbProducts = getProducts.payload;

      const productsId = dbProducts.map((product) => product._id.toString());
      const productsIdToInsert = products.map((product) => product.pid);
      const productsExist = productsIdToInsert.every((id) =>
        productsId.includes(id)
      );

      if (!productsExist)
        return {
          statusCode: 404,
          error: true,
          name: "Product not exist",
          cause:
            "An attempt was made to add a non-existent product to the cart",
          message: "Check the product ids and try again",
          code: enumErrors.NOT_FOUND,
        };

      products = products.map((product) => {
        product._id = product.pid;
        product.pid = undefined;
        return product;
      });

      const updateResponse = await cartModel.findByIdAndUpdate(
        cid,
        {products},
        {new: true}
      );

      return {
        status: 200,
        message: "Cart updated successfully",
        payload: updateResponse.products,
      };
    } catch (error) {
      return {
        statusCode: 500,
        error: true,
        name: "Error occurred at moment of put products to cart",
        casue: error.toString(),
        message: "We are working to fix this issue",
        code: enumErrors.ERROR_FROM_SERVER,
      };
    }
  }


  async putProductQuantity(cid, pid, quantity) {
    try {
      const getCart = await this.getById(cid);
      if (getCart.error) return getCart;
      const cart = getCart.payload;

      const getProduct = await dbpm.getById(pid);
      if (getProduct.error) return getProduct;
      const productFinded = getProduct.payload;

      const productInCart = cart.find((product) => product._id == pid);

      if (!productInCart)
        return {
          statusCode: 404,
          error: true,
          name: "Product not found in the cart",
          cause: `The product with id ${pid} was not found in the cart with id ${cid}`,
          message: "Check the product id and try again",
          code: enumErrors.NOT_FOUND,
        };

      const productIndex = cart.findIndex((product) => product._id == pid);
      const newCart = [...cart];
      newCart[productIndex].quantity = quantity;

      const updateResponse = await cartModel.findByIdAndUpdate(
        cid,
        {products: newCart},
        {new: true}
      );

      return {
        status: 200,
        message: "Product quantity updated successfully",
        payload: updateResponse.products,
      };
    } catch (error) {
      return {
        statusCode: 500,
        error: true,
        name: "Error occurred at moment of update the product quantity",
        cause: error.toString(),
        message: "We are working to fix this issue",
        code: enumErrors.ERROR_FROM_SERVER,
      };
    }
  }


  async deleteProductToCart(cid, pid) {
    try {
      const getCart = await this.getById(cid);
      if (getCart.error) return getCart;
      const cart = getCart.payload;

      const productInCart = cart.find((product) => product._id == pid);

      if (!productInCart) {
        return {
          statusCode: 404,
          error: true,
          name: "Product not found in the cart",
          cause: `The product with id ${pid} was not found in the cart with id ${cid}`,
          message: "Check the product id and try again",
          code: enumErrors.NOT_FOUND,
        };
      }

      const updateResponse = await cartModel.findByIdAndUpdate(
        cid,
        {$pull: {products: {_id: pid}}},
        {new: true}
      );

      return {
        status: 200,
        message: "Product deleted to cart successfully",
        payload: updateResponse.products,
      };
    } catch (error) {
      return {
        statusCode: 500,
        error: true,
        name: "Error occurred at moment of delete product to cart",
        cause: error.toString(),
        message: "We are working to fix this issue",
        code: enumErrors.ERROR_FROM_SERVER,
      };
    }
  }


  async deleteProducts(cid) {
    try {
      const getCart = await this.getById(cid);
      if (getCart.error) return getCart;

      const updateResponse = await cartModel.findByIdAndUpdate(
        cid,
        {products: []},
        {new: true}
      );
      return {
        status: "success",
        message: "All product deleted successfully",
        payload: updateResponse.products,
      };
    } catch (error) {
      return {
        statusCode: 500,
        error: true,
        name: "Error occurred at moment of delete products to cart",
        cause: error.toString(),
        message: "We are working to fix this issue",
        code: enumErrors.ERROR_FROM_SERVER,
      };
    }
  }


  async deleteById(cid) {
    try {
      const cartDeleted = await cartModel.findByIdAndDelete(cid);
      if (cartDeleted === null)
        return {
          statusCode: 404,
          error: true,
          name: "Cart not found",
          cause: `Cart with id ${cid} not found`,
          message: "Check the cart id and try again",
          code: enumErrors.NOT_FOUND,
        };
      return {
        status: 200,
        message: `Cart with id ${cid} deleted successfully`,
      };
    } catch (error) {
      return {
        statusCode: 500,
        error: true,
        name: "Error occurred at moment of delete a cart",
        cause: error.toString(),
        message: "We are working to fix this issue",
        code: enumErrors.ERROR_FROM_SERVER,
      };
    }
  }
}
