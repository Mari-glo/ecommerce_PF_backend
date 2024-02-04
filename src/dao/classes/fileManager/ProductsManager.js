import fs from "fs";
import {faker} from "@faker-js/faker";
import {enumErrors} from "../../../errors/enumErrors";

export default class ProductManager {
  constructor() {
    this.path = "src/dao/classes/fileManager/products.json";
  }

  async getAll(query, limit = 10, page = 1, sort) {
    try {
      const document = await fs.promises.readFile(this.path);
      let products = JSON.parse(document);

      const quantityOfProducts = products.length;
      const totalPages = Math.floor(quantityOfProducts / limit);
      const hasPrevPage = page > 1;
      const hasNextPage = page - totalPages ? true : false;
      const prevPage = hasPrevPage ? page - 1 : null;
      const nextPage = hasNextPage ? page + 1 : null;
      let nextLink;
      let prevLink;

      if (hasNextPage)
        nextLink = `http://localhost:8080/api/products/?${
          query ? "query=" + query + "&" : ""
        }${"limit=" + limit}${"&page=" + (+page + 1)}${
          sort ? "&sort=" + sort : ""
        }`;

      if (hasPrevPage)
        prevLink = `http://localhost:8080/api/products/?${
          query ? "query=" + query + "&" : ""
        }${"limit=" + limit}${"&page=" + (+page - 1)}${
          sort ? "&sort=" + sort : ""
        }`;

      if (query) {
        query = JSON.parse(query);
        for (const prop in query) {
          products = products.filter(
            (product) => product[prop] === query[prop]
          );
        }
      }

      if (page > 1) products.splice(0, limit * page - 1);
      if (limit && limit <= products.length) products.length = limit;

      return {
        status: 200,
        message: "Products obtained successfully",
        payload: products,
        totalDocs: quantityOfProducts,
        limit,
        totalPages,
        page,
        hasPrevPage,
        hasNextPage,
        prevPage,
        nextPage,
        prevLink,
        nextLink,
      };
    } catch (error) {
      return {
        statusCode: 500,
        error: true,
        name: "Error occurred at moment of getting the products",
        cause: error.toString(),
        message: "We are working to fix this issue",
        code: enumErrors.ERROR_FROM_SERVER,
      };
    }
  }

  async getById(id) {
    try {
      const getProducts = await this.getAll();
      if (getProducts.error) return getProducts;
      const products = getProducts.payload;

      const product = products.find((product) => product.id === id);
      if (!product)
        return {
          status: 404,
          error: true,
          name: "Product not found",
          message: `Check the ${id} and try again`,
          cause: `The product with ${id} not exist in the database`,
          code: enumErrors.NOT_FOUND,
        };
      return {
        status: 200,
        message: "Product obtained successfully",
        payload: product,
      };
    } catch (error) {
      return {
        statusCode: 500,
        error: true,
        name: "Error occurred at moment of get the product",
        cause: error.toString(),
        message: "We are working to fix this issue",
        code: enumErrors.ERROR_FROM_SERVER,
      };
    }
  }

  async post(product) {
    try {
      const getProducts = await this.getAll();
      if (getProducts.error) return getProducts;
      const products = getProducts.payload;

      const existProduct = products.find(
        (dbProduct) => dbProduct.code === product.code
      );

      if (existProduct)
        return {
          statusCode: 400,
          error: true,
          name: `Product with code ${product.code} already exist`,
          cause: "Already exist a product with the code sent",
          message: "Change the code and try again",
          code: enumErrors.INVALID_REQUEST,
        };

      product.id = faker.database.mongodbObjectId();
      products.push(product);

      await this.writeFile(products);

      return {
        status: 200,
        message: "Product created successfully",
        payload: product,
      };
    } catch (error) {
      return {
        statusCode: 500,
        error: true,
        name: "Error occurred at moment of create the product",
        cause: error.toString(),
        message: "We are working to fix this issue",
        code: enumErrors.ERROR_FROM_SERVER,
      };
    }
  }

  async putById(id, object) {
    try {
      const getProducts = await this.getAll();
      if (getProducts.error) return getProducts;
      const products = getProducts.payload;

      const getProduct = await this.getById();
      if (getProduct.error) return getProduct;
      const product = getProduct.payload;
      const productIndex = products.findIndex(
        (dbProduct) => dbProduct.id === id
      );

      for (const prop in object) {
        if (object[prop] !== undefined) product[prop] = object[prop];
      }

      products.splice(productIndex, 1, product);

      await this.writeFile(products);

      return {
        status: 200,
        message: "Product updated successfully",
        payload: product,
      };
    } catch (error) {
      return {
        statusCode: 500,
        error: true,
        name: "Error occurred at moment of update the product",
        cause: error.toString(),
        message: "We are working to fix this issue",
        code: enumErrors.ERROR_FROM_SERVER,
      };
    }
  }

  async deleteById(id, user) {
    try {
      const getResponse = await this.getAll();
      if (getResponse.error) return getResponse;
      const products = getResponse.payload;

      const getProduct = await this.getById();
      if (getProduct.error) return getProduct;
      const product = getProduct.payload;
      const productIndex = products.findIndex(
        (dbProduct) => dbProduct.id === id
      );

      /*if (user.role === "premium" && product.owner !== user.email)
        return {
          statusCode: 400,
          error: true,
          name: "No puedes eliminar un producto que no es de tu propiedad",
          cause: "Se intento eliminar un producto ajeno",
          message: "Intenta eliminar un producto propio",
          code: enumErrors.INVALID_REQUEST,
        }; */

      products.splice(productIndex, 1);

      await this.writeFile(products);

      return {status: 204, message: `Product deleted succesfully`};
    } catch (error) {
      return {
        statusCode: 500,
        error: true,
        name: "Error occurred at moment of delete the product",
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