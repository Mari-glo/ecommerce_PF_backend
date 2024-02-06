import passport from "passport";
import GitHubStrategy from "passport-github2";
import local from "passport-local";
import { createHash, isValidPassword } from "../utils/hashPassword.js";
import * as userServices from "../services/user.services.js";
import * as cartServices from "../services/cart.services.js";
import { logger } from "../utils/logger.js";

const LocalStrategy = local.Strategy;
const initializePassport = () => {
  passport.use(
    "register", new LocalStrategy({ passReqToCallback: true, usernameField: "email" }, async (req, username, password, done) => {
     
      const { first_name, last_name, age, email, role } = req.body;
      try {
        const user = await userServices.getUserByEmail(username);
        if (user) {
          
          return done(null, false);
        }
        const cart = await cartServices.addCart();
        const newUser = { first_name, last_name, age, email, cart: cart._id, password: createHash(password), role, last_connection: new Date(), };

        let result = await userServices.createUser(newUser);
        
        return done(null, result);
      } catch (error) {
        return done("Error al obtener el usuario" + error);
      }
    })
  );
  passport.serializeUser((user, done) => {
    
    done(null, user._id);
  });
  passport.deserializeUser(async (id, done) => {
    const user = await userServices.getUserById(id);
    done(null, user);
  });
  passport.use(
    "login",
    new LocalStrategy({ usernameField: "email" }, async (username, password, done) => {
      try {
        const user = await userServices.getUserByEmail(username);
        if (!user) {
          logger.error(`El usuario con el mail ${username} no existe`);
          return done(null, false);
        }

        if (!isValidPassword(user, password)) return done(null, false);

        return done(null, user);
      } catch (error) {
        return done("Error al obtener el usuario" + error);
      }
    })
  );
  passport.use( "github", new GitHubStrategy(
      {
        clientID: "Iv1.4040ecaece694a96",
        clientSecret: "361c4082cc4eb305f635d95b8bc28e45e0d90ad8",
        callbackURL: "http://localhost:8080/api/sessions/githubcallback",
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const user = await userServices.getUserByEmail(profile._json.email);
          if (!user) {
            const email = profile._json.email || profile._json.id;
            const newUser = {
              first_name: profile._json.name,
              last_name: "",
              age: 30,
              email:"",
              password: "",
            };
            const result = await userServices.createUser(newUser);
            return done(null, result);
          }

          return done(null, user);
        } catch (error) {
          return done("Error al obtener el usuario" + error);
        }
      }
    )
  );
};

export { initializePassport };