
import ticketModel from "../../models/ticket.model.js";
import {enumErrors} from "../../../errors/enumErrors.js";
import nodemailer from "nodemailer"

const transport = nodemailer.createTransport({
  service: "gmail",
  port: 5087,
  auth: {
    user: "marigloria@gmail.com",
    pass: "xjrcbyzarjhlmnts",
  },
});



export default class TicketsManager {
  constructor() {}

  async getAll() {
    try {
      const tickets = await ticketModel.find().populate("carts._id");
      if (!tickets.length)
        return {
          status: 204,
          message: "No tickets created",
          payload: tickets,
        };

      return {
        status: 200,
        message: "tickets obtained successfully",
        payload: tickets,
      };
    } catch (error) {
      return {
        statusCode: 500,
        error: true,
        name: "Error occurred at moment of getting ticket",
        cause: error.toString(),
        message: "We are working to fix this issue",
        code: enumErrors.ERROR_FROM_SERVER,
      };
    }
  }


  async getById(id) {
    try {
      const ticket = await ticketModel.findById(id).lean().populate("carts._id");
      if (ticket === null)
        return {
          statusCode: 404,
          error: true,
          name: `Cart not found`,
          cause: `The cart with the id sent not exist`,
          message: "Check if the id is correct and try again",
          code: enumErrors.NOT_FOUND,
      };

      return {
        status: 200,
        message: "Ticket obtained successfully",
        payload: ticket,
      };
    } catch (error) {
      return {
        statusCode: 500,
        error: true,
        name: "An error occurred while obtaining the ticket by id",
        cause: error.toString(),
        message: "We are working to fix this issue",
        code: enumErrors.ERROR_FROM_SERVER,
      };
    }
  }


  async post(ticket = []) {
    try {
      const ticketCreate = await cartModel.create({ticket});

      await transport.sendMail({ 
        from: "marigloria@gmail.com",
        to: `${ticket.email}`,
        subject: "Aviso Compra Exitosa",
        text: `MAITEE ACCESORIOS - \n Gracias por su compra!!! \n Carrito: ${ticket.cartId}`,
      })


      return {
        status: 201,
        message: "Ticket created successfully",
        payload: ticketCreate,
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

}