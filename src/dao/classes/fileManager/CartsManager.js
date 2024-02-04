import fs from "fs";
import {faker} from "@faker-js/faker";
import ProductsManager from "./ProductsManager.js";
import {enumErrors} from "../../../errors/enumErrors.js";
const productsManager = new ProductsManager();

export default class CartsManager {
  constructor() {
    this.path = "src/dao/classes/fileManager/carts.json";
  }

  async getAll() {
    try {
      const document = await fs.promises.readFile(this.path);
      const carts = JSON.parse(document);
      if (!carts.length)
        return {status: 204, message: "No carts created", payload: carts};
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
      const getCarts = await this.getAll();
      if (getCarts.error) return getCarts;

      const carts = getCarts.payload;
      const cart = carts.find((dbCart) => dbCart.id === id);

      if (!cart)
        return {
          statusCode: 404,
          error: true,
          name: "Cart not found",
          cause: "The cart with the id sent not exist",
          message: "Check if the id is correct and try again",
          code: enumErrors.NOT_FOUND,
        };

      const cartPopulate = [];

      for (let product of cart.products) {
        const dbProduct = await productsManager.getById(product.id);
        const productPopulate = {...dbProduct, quantity: product.quantity};
        cartPopulate.push(productPopulate);
      }

      return {
        status: 200,
        mesagge: "Cart obtained successfully",
        payload: cartPopulate,
      };
    } catch (error) {
      return {
        statusCode: 500,
        error: true,
        name: "Error occurred at moment of getting the cart",
        casue: error.toString(),
        message: "We are working to fix this issue",
        code: enumErrors.ERROR_FROM_SERVER,
      };
    }
  }

  async post(products = []) {
    try {
      const getCarts = await this.getAll();
      if (getCarts.error) return getCarts;
      const carts = getCarts.payload;

      if (!products.length) {
        const newCart = {id: faker.database.mongodbObjectId(), products: []};

        carts.push(newCart);

        await this.writeFile(carts);

        return {
          status: 201,
          message: `Cart created successfully`,
          payload: newCart,
        };
      }

      const getProducts = await productsManager.getAll();
      if (getProducts.error) return getProducts;
      const dbProducts = getProducts.payload;

      const productsId = dbProducts.map((product) => product.id);
      const productsIdToInsert = products.map((product) => product.pid);
      const productsExist = productsIdToInsert.every((id) =>
        productsId.includes(id)
      );

      if (!productsExist) {
        return {
          statusCode: 404,
          error: true,
          name: "Product not exist",
          cause:
            "An attempt was made to add a non-existent product to the cart",
          message: "Check the product ids and try again",
          code: enumErrors.NOT_FOUND,
        };
      }

      products = products.map((product) => {
        product._id = product.pid;
        product.pid = undefined;
        return product;
      });

      const newCart = {id: faker.database.mongodbObjectId(), products};

      carts.push(newCart);

      await this.writeFile(carts);

      return {
        status: 201,
        message: `Cart created successfully`,
        payload: newCart,
      };
    } catch (error) {
      return {
        statusCode: 500,
        error: true,
        name: "Error occurred at moment of create the cart",
        casue: error.toString(),
        message: "We are working to fix this issue",
        code: enumErrors.ERROR_FROM_SERVER,
      };
    }
  }

  async postProductToCart(cid, pid, user) {
    try {
      const getCarts = await this.getAll();
      if (getCarts.error) return getCarts;
      const carts = getCarts.payload;

      const getCart = await this.getById(cid);
      if (getCart.error) return getCart;
      const cart = carts.find((cart) => cart.id === cid);

      const getProduct = await productsManager.getById(pid);
      if (getProduct.error) return getProduct;
      const productFinded = getProduct.payload;

      const cartIndex = carts.findIndex((dbCart) => dbCart.id === cid);
      const productInCart = cart.products.find(
        (dbProduct) => dbProduct.id === pid
      );

      if (productInCart) {
        const productIndex = cart.products.findIndex(
          (dbProduct) => dbProduct.id === pid
        );

        productInCart.quantity++;
        cart.products.splice(productIndex, 1, productInCart);
        carts.splice(cartIndex, 1, cart);

        await this.writeFile(carts);

        return {
          status: 200,
          message: "Quantity of product icreased successfully",
          payload: cart.products,
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

      cart.products.push({id: pid, quantity: 1});
      carts.splice(cartIndex, 1, cart);

      await this.writeFile(carts);

      return {
        status: 200,
        message: "Product added successfully",
        payload: cart.products,
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
      const getCarts = await this.getAll();
      if (getCarts.error) return getCarts;
      const carts = getCarts.payload;

      const getCart = await this.getById(cid);
      if (getCart.error) return getCart;
      const cart = carts.find((cart) => cart.id === cid);
      const cartIndex = carts.findIndex((cart) => cart.id === cid);

      const getProducts = await productsManager.getAll();
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
        product.id = product.pid;
        product.pid = undefined;
        return product;
      });

      cart.products = products;
      carts.splice(cartIndex, 1, cart);

      await this.writeFile(carts);

      return {
        status: 200,
        message: "Cart updated successfully",
        payload: cart,
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
      const getCarts = await this.getAll();
      if (getCarts.error) return getCarts;
      const carts = getCarts.payload;

      const getCart = await this.getById(cid);
      if (getCart.error) return getCart;
      const cart = carts.find((cart) => cart.id === cid);
      const cartIndex = carts.findIndex((cart) => cart.id === cid);

      const getProduct = await productsManager.getById(pid);
      if (getProduct.error) return getProduct;
      const productFinded = getProduct.payload;

      const productInCart = cart.products.find(
        (dbProduct) => dbProduct.id === pid
      );

      if (!productInCart)
        return {
          statusCode: 404,
          error: true,
          name: "Product not found in the cart",
          cause: `The product with id ${pid} was not found in the cart with id ${cid}`,
          message: "Check the product id and try again",
          code: enumErrors.NOT_FOUND,
        };

      const productIndex = cart.products.findIndex(
        (dbProduct) => dbProduct.id === pid
      );

      cart.products[productIndex].quantity = quantity;
      carts.splice(cartIndex, 1, cart);

      await this.writeFile(carts);

      return {
        status: 200,
        message: "Product quantity updated successfully",
        payload: cart,
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
      const getCarts = await this.getAll();
      if (getCarts.error) return getCarts;
      const carts = getCarts.payload;

      const getCart = await this.getById(cid);
      if (getCart.error) return getCart;
      const cart = carts.find((cart) => cart.id === cid);
      const cartIndex = carts.findIndex((dbCart) => dbCart.id === cid);

      const productInCart = cart.products.find(
        (dbProduct) => dbProduct.id === pid
      );

      if (!productInCart)
        return {
          statusCode: 404,
          error: true,
          name: "Product not found",
          cause: "The product not found in the cart",
          message: "Check the product id and try again",
          code: enumErrors.NOT_FOUND,
        };

      const productIndex = cart.products.findIndex(
        (dbProduct) => dbProduct.id === pid
      );

      cart.products.splice(productIndex, 1);
      carts.splice(cartIndex, 1, cart);

      await this.writeFile(carts);

      return {
        status: 200,
        message: "Product removed from cart succesfully",
        payload: cart,
      };
    } catch (error) {
      return {
        statusCode: 500,
        error: true,
        name: "Error occurred at moment of delete product to cart",
        casue: error.toString(),
        message: "We are working to fix this issue",
        code: enumErrors.ERROR_FROM_SERVER,
      };
    }
  }

  async deleteProducts(cid) {
    try {
      const getCarts = await this.getAll();
      if (getCarts.error) return getCarts;
      const carts = getCarts.payload;

      const getCart = await this.getById(cid);
      if (getCart.error) return getCart;
      const cart = carts.find((cart) => cart.id === cid);
      const cartIndex = carts.findIndex((dbCart) => dbCart.id === cid);

      cart.products = [];
      carts.splice(cartIndex, 1, cart);

      await this.writeFile(carts);

      return {
        status: 200,
        message: "Products deleted successfull",
        payload: cart,
      };
    } catch (error) {
      return {
        statusCode: 500,
        error: true,
        name: "Error occurred at moment of delete products to cart",
        casue: error.toString(),
        message: "We are working to fix this issue",
        code: enumErrors.ERROR_FROM_SERVER,
      };
    }
  }

  async deleteById(cid) {
    try {
      const getCarts = await this.getAll();
      if (getCarts.error) return getCarts;
      const carts = getCarts.payload;

      const getCart = await this.getById(cid);
      if (getCart.error) return getCart;
      const cartIndex = carts.findIndex((dbCart) => dbCart.id === cid);

      carts.splice(cartIndex, 1);

      await this.writeFile(carts);

      return {status: 204, message: `Cart with id ${cid} deleted successfully`};
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

  async purchase(cid, purchaser) {
    try {
      const getCart = await this.getById(cid);
      if (getCart.error) return getCart;
      const cart = getCart.payload;

      const existProductOutStock = cart.find(
        (product) => product.stock < product.quantity
      );

      if (existProductOutStock)
        return {
          statusCode: 400,
          error: true,
          name: "Product out stock",
          cause: "Exist product out stock",
          message: "Change the quantity for purchase",
          code: enumErrors.INVALID_REQUEST,
        };

      let totalAmount = 0;

      for (const product of cart) {
        const newStock = product.stock - product.quantity;
        totalAmount += product.price;
        /*const putProductResponse = await productsManager.putById(product.id, {
          stock: newStock,
        });
        if (putProductResponse.error) return putProductResponse; */
      }

      const ticket = {
        code: faker.database.mongodbObjectId(),
        purchaseDateTime: new Date().toLocaleString(),
        amount: totalAmount,
        purchaser: "examplePurchaser",
      };
      return {
        status: 200,
        message: "Cart purchased successfully",
        payload: {ticket, cart},
      };
    } catch (error) {
      return {
        statusCode: 500,
        error: true,
        name: "Error occurred at moment of purchase a cart",
        cause: error.toString(),
        message: "We are working to fix this issue",
        code: enumErrors.ERROR_FROM_SERVER,
      };
    }
  }

  async writeFile(data) {
    try {
      await fs.promises.writeFile(this.path, JSON.stringify(data));
      return {status: 200, message: "Overwrited successfully"};
    } catch (error) {
      return {
        status: 500,
        error: true,
        name: `Error occurred at moment of overwrite the database`,
        cause: error.toString(),
        message: "We are working to fix this issue",
        code: enumErrors.ERROR_FROM_SERVER,
      };
    }
  }
}