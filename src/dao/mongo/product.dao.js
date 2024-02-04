import { productModel } from "../models/products.model.js";


const getAllProducts = async (query, options) => {
  const products = await productModel.paginate(query, options);
  return products;
};


const getProductById = async (id) => {
  const productFind = await productModel.findOne({ _id: id });
  return productFind;
};


const addProduct = async (product) => {
  const checkProductInfo = Object.values(product).includes(undefined);

  if (checkProductInfo) return "Faltan propiedades al producto";

  const newProduct = await productModel.create(product);
  return newProduct;
};


const updateProduct = async (id, data) => {
  const productUpdate = await productModel.updateOne({ _id: id }, data);
  return productUpdate;
};


const deleteProduct = async (id) => {
  const productDelete = await productModel.deleteOne({ _id: id });

  return productDelete;
};

export { addProduct, updateProduct, deleteProduct, getAllProducts, getProductById };