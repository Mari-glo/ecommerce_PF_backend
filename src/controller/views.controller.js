import * as productServices from "../services/product.services.js";
import * as userServices from "../services/user.services.js";
import * as ticketService from "../services/ticket.services.js";
import * as cartService from "../services/cart.services.js";
import { createHash, isValidPassword } from "../utils/hashPassword.js";
import { generateToken, verifyToken } from "../utils/jwt.js";
import { logger } from "../utils/logger.js";
import { sendLinkResetPassword } from "../utils/sendLinkPassword.js";
import { userDTO } from "../DTOs/user.dto.js";

const home = async (req, res) => {
  try {
    
    res.render("home");
  } catch (error) {
    logger.error(error.message);
    res.status(500).json({ error: "Server internal error" });
  }
};

const realTimeProducts = async (req, res) => {
  try {
    const products = await productServices.getAllProducts();
    res.render("realTimeProducts", { products });  // Pasa los productos a la vista
  } catch (error) {
    logger.error(error.message);
    res.status(500).json({ error: "Server internal error" });
  }
};


const chat = async (req, res) => {
  try {
    res.render("chat");
  } catch (error) {
    logger.error(error.message);
    res.status(500).json({ error: "Server internal error" });
  }
};

const products = async (req, res) => {
  try {
    const resProducts = await productServices.getAllProducts(req.query);

    const { totalPages, docs, hasPrevPage, hasNextPage, prevPage, nextPage } = resProducts;
    res.render("products", {
      status: "success",
      products: docs,
      totalPages,
      prevPage,
      nextPage,
      page: resProducts.page,
      hasPrevPage,
      hasNextPage,
      prevLink: `http://localhost:8080/products?page=${prevPage}`,
      nextLink: `http://localhost:8080/products?page=${nextPage}`,
    });
  } catch (error) {
    logger.error(error.message);
    res.status(500).json({ error: "Server internal error" });
  }
};

const productDetail = async (req, res) => {
  const { pid } = req.params;
  try {
    const product = await productServices.getProductById(pid);
      res.render("itemDetail", product);
  } catch (error) {
    logger.error(error.message);
    res.status(500).json({ error: "Server internal error" });
  }
};

const cartDetail = async (req, res) => {
  try {
    const { user } = verifyToken(req.cookies.token);
    const cart = await cartService.getCartById(user.cart);
     
    if (!cart) return res.status(404).json({ msg: "Carrito no encontrado" });

    res.render("cart", { products: cart.products });
  } catch (error) {
    logger.error(error.message);
    res.status(500).json({ error: "Server internal error" });
  }
};

const viewLogin = async (req, res) => {
  try {
    res.render("login");
  } catch (error) {
    logger.error(error.message);
    res.status(500).json({ error: "Server internal error" });
  }
};

const loginUser = async (req, res) => {
  const { email, password } = req.body;
  try {
    // Verificamos los datos ingresados
    const user = await userServices.getUserByEmail(email);

    if (!user || !isValidPassword(user, password))
      return res.render("login", { error: "Usuario o contraseña incorrectos" });

    // Crear un carrito para el usuario (puedes ajustar esto según tus necesidades)
    const newCart = await cartService.addCart() // Supongamos que tienes una función para crear un carrito vacío

    // Asignar el carrito al usuario
    user.cart = newCart;

    // Guardar los cambios en la base de datos
    await user.save();

    const userToken = userDTO(user);
    console.log(user);

    const token = generateToken(userToken);

    res.cookie("token", token, { maxAge: 3600000, httpOnly: true });

    // Redireccionamos al Pagina de Inicio
    return res.redirect("/products");
  } catch (error) {
    logger.error(error.message);
    res.status(500).json({ error: "Server internal error" });
  }
};

const viewRegister = async (req, res) => {
  try {
    res.render("register");
  } catch (error) {
    logger.error(error.message);
    res.status(500).json({ error: "Server internal error" });
  }
};

const registerUser = async (req, res) => {
  const { first_name, last_name, age, email, password, role } = req.body;
  try {
    // Verificamos si el usuario ya existe
    const user = await userServices.getUserByEmail(email);
    if (user) {
      return res.render("register", { error: `El usuario con el mail ${email} ya existe` });
    }

    // Verificamos que ingreso todos los datos
    if (!first_name || !last_name || !age || !email || !password || !role) {
      return res.render("register", { error: "Debe ingresar todos los datos" });
    }

    const cart = await cartService.addCart();
    const newUser = {
      first_name,
      last_name,
      age,
      email,
      cart: cart._id,
      password: createHash(password),
      role,
      last_connection: new Date(),
    };

    await userServices.createUser(newUser);

    // Devolvemos el usuario creado
    return res.redirect("/login");
  } catch (error) {
    logger.error(error.message);
    res.status(500).json({ error: "Server internal error" });
  }
};

const viewProfile = async (req, res) => {
  try {
    const { user } = verifyToken(req.cookies.token);
    const products = await productServices.getAllProducts(req.query);

    // Si no hay usuario logueado redireccionamos al login
    if (!user) return res.redirect("/login");

    res.render("profile", { user, products: products.docs });
  } catch (error) {
    logger.error(error.message);
    res.status(500).json({ error: "Server internal error" });
  }
};

const logoutUser = async (req, res) => {
  try {
    // Destruimos la sesión
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ error: "Error al cerrar sesión" });
      }
      // Redireccionamos al login
      res.redirect("/login");
    });
  } catch (error) {
    logger.error(error.message);
    res.status(500).json({ error: "Server internal error" });
  }
};

const viewResetPassword = async (req, res) => {
  try {
    res.render("resetPassword");
  } catch (error) {
    logger.error(error.message);
    res.status(500).json({ error: "Server internal error" });
  }
};

const resetPassword = async (req, res) => {
  const { email } = req.body;
  try {
    const user = await userServices.getUserByEmail(email);

    if (!user) return res.render("resetPassword", { error: `El usuario con el mail ${email} no existe` });

    // Generamos un token que expira en 1hs
    const token = generateToken({ email }, "1h");

    // Enviamos el mail con el link para resetear la contraseña
    sendLinkResetPassword(token, email);

    res.render("sendEmail", { email });
  } catch (error) {
    logger.error(error.message);
    res.status(500).json({ error: "Server internal error" });
  }
};

const viewChangePass = async (req, res) => {
  try {
    res.render("changePass");
  } catch (error) {
    logger.error(error.message);
    res.status(500).json({ error: "Server internal error" });
  }
};

const changePass = async (req, res) => {
  const { password1, password2 } = req.body;
  try {
    if (password1 !== password2) return res.render("changePass", { error: "Las contraseñas no coinciden" });

    const email = req.cookies.token.user.email;
    const user = await userServices.getUserByEmail(email);
    if (!user) return res.render("changePass", { error: `El usuario con el mail ${email} no existe` });
    await user.updateOne({ password: createHash(password1) });
    res.render("changePassConfirm", { msg: "Contraseña cambiada con éxito" });
  } catch (error) {
    logger.error(error.message);
    res.status(500).json({ error: "Server internal error" });
  }
};

const generateTicket = async (req, res) => {
  try {
    const user = req.user;
    const cart = await cartService.getCartFromEmail(user.email);
    const data = {
      purchaser: user.email,
      amount: cart.total,
    };
    const ticket = await ticketService.generateTicket(data);

    res.status(201).json(ticket);
  } catch (error) {
    logger.error(error.message);
    res.status(500).json({ error: "Server internal error" });
  }
};

const getTicketFromEmail = async (req, res) => {
  try {
    const user = req.user;
    const ticket = await ticketService.getTicketFromEmail(user.email);
    res.status(200).json(ticket);
  } catch (error) {
    logger.error(error.message);
    res.status(500).json({ error: "Server internal error" });
  }
};

// Cart
const addProductToCart = async (req, res) => {

   try {
    const { user } = verifyToken(req.cookies.token);
  
    const cart = await cartService.getCartById(user.cart);
        
    const product = await productServices.getProductById(req.params.pid);
    if (!product) return res.status(404).json({ msg: "Producto no encontrado" });
        
    await cartService.addProductToCart(cart._id, req.params.pid);
    
    const newCart = await cartService.getCartById(user.cart);
    
 
    res.status(200).render("cart", { total: newCart.total, products: newCart.products, cartId: newCart._id });
  } catch (error) {
    logger.error(error.message);
    res.status(500).json({ error: "Server internal error" });
  }
};

const buyCart = async (req, res) => {
  try {
    const { user } = verifyToken(req.cookies.token);
    const cart = await cartService.getCartById(user.cart);

    const data = {
      purchaser: user.email,
      amount: cart.total,
    };
    const ticket = await ticketService.generateTicket(data);
    //Antes de eliminar cart recorrer el carro y por cada product descontar de la tabla de producto 
    cart.products.forEach(async (item) =>{
      const productDao = await productServices.getProductById(item.product.id);
      
      const newQuantity = productDao.stock - item.quantity
      await productServices.updateProduct(item.product.id, {stock: newQuantity});
    })
    await cartService.removeAllProductsFromCart(cart);
    res.status(200).render("ticket", { ticket });
  } catch (error) {
    logger.error(error.message);
    res.status(500).json({ error: "Server internal error" });
  }
};

const admin = async (req, res) => {
  try {
    const users = await userServices.getAllUsers();
    res.render("admin", { users });
   
  } catch (error) {
    logger.error(error.message);
    res.status(500).json({ error: "Server internal error" });
  }
}

export {
  home,
  realTimeProducts,
  chat,
  products,
  productDetail,
  cartDetail,
  viewLogin,
  loginUser,
  viewRegister,
  registerUser,
  viewProfile,
  logoutUser,
  viewResetPassword,
  resetPassword,
  generateTicket,
  getTicketFromEmail,
  changePass,
  viewChangePass,
  addProductToCart,
  buyCart,
  admin
};