import {enumErrors} from "../../../errors/enumErrors.js";
import productModel from "../../models/products.model.js";
export default class ProductManager {
  constructor() {}

  async getAll(query, limit = 10, page = 1, sort) {
    try {
      const result = await productModel.paginate(query, {
        limit: limit,
        page: page,
        sort: {price: sort},
        lean: true,
      });

      const baseUrl = "http://localhost:8080/api/products/";

      if (result.hasNextPage)
        result.nextLink = `${baseUrl}?${query ? "query=" + query + "&" : ""}${
          "limit=" + limit
        }${"&page=" + (+page + 1)}${sort ? "&sort=" + sort : ""}`;
      if (result.hasPrevPage)
        result.prevLink = `${baseUrl}?${query ? "query=" + query + "&" : ""}${
          "limit=" + limit
        }${"&page=" + (+page - 1)}${sort ? "&sort=" + sort : ""}`;

      return {
        status: 200,
        message: "Products obtained successfully",
        payload: result.docs,
        totalDocs: result.totalDocs,
        limit: result.limit,
        totalPages: result.totalPages,
        page: result.page,
        hasPrevPage: result.hasPrevPage,
        hasNextPage: result.hasNextPage,
        prevPage: result.prevPage,
        nextPage: result.nextPage,
        prevLink: result.prevLink,
        nextLink: result.nextLink,
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
      const product = await productModel.findById(id);
      if (product === null)
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
      const newProduct = await productModel.create(product);
      return {
        status: 200,
        message: "Product created successfully",
        payload: newProduct,
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
      const productUpdated = await productModel.findByIdAndUpdate(id, object, {
        new: true,
      });
      if (productUpdated === null)
        return {
          statusCode: 404,
          error: true,
          name: `Product with id ${id} not found`,
          cause: "The product not exist in the database",
          message: "Check the id an try again",
          code: enumErrors.NOT_FOUND,
        };
      return {
        status: 200,
        message: "Product updated successfully",
        payload: productUpdated,
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
      const getProduct = await this.getById(id);
      if (getProduct.error) return getProduct;
      const product = getProduct.payload;
      
      await productModel.findByIdAndDelete(id);

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
}