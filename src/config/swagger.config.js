import swaggerJSDoc from "swagger-jsdoc";

const swaggerOptions = {
  definition: {
    openapi: "3.0.1",
    info: {
      title: "Documentación de la API",
      description: "Documentación de la API ; gestión de productos y carrito de compra",
    },
  },
  apis: ["/docs/**/*.yaml"],
};

const specs = swaggerJSDoc(swaggerOptions);

export { specs };