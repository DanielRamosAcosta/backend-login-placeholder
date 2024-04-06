import { oakCors } from "https://deno.land/x/cors/mod.ts";
import { Application, Router } from "https://deno.land/x/oak@v11.1.0/mod.ts";
import {
  create,
  verify,
  getNumericDate,
} from "https://deno.land/x/djwt@v3.0.2/mod.ts";
import { key } from "./key.ts";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const router = new Router();

const RIGHT_EMAIL = "linustorvalds@gmail.com";
const RIGHT_PASSWORD = "ilovecats";

router
  .post("/api/users/login", async (context) => {
    const body = await context.request.body();
    const result = await body.value;

    if (!result.password) {
      context.response.body = {
        status: "error",
        code: "missing_password_field",
      };
      context.response.status = 400;
      return;
    }

    if (!result.email) {
      context.response.body = {
        status: "error",
        code: "missing_email_field",
      };
      context.response.status = 400;
      return;
    }

    const randomMiliseconds = Math.floor(Math.random() * 1000) + 1000;

    await sleep(randomMiliseconds);

    if (result.email === RIGHT_EMAIL && result.password === RIGHT_PASSWORD) {
      const jwt = await create(
        { alg: "HS512", typ: "JWT" },
        {
          userId: "ef8b5230-b118-4b6c-8318-33bca35d0e44",
          email: RIGHT_EMAIL,
          exp: getNumericDate(60 * 60),
        },
        key
      );

      context.response.body = {
        status: "sucess",
        payload: {
          jwt,
        },
      };
      context.response.status = 200;
      return;
    }

    context.response.body = {
      status: "error",
      code: "worng_email_or_password",
    };
    context.response.status = 401;
  })
  .get("/api/recepies", async (context) => {
    const jwt = context.request.headers.get("Authorization");

    if (!jwt) {
      context.response.body = {
        status: "error",
        code: "missing_authorization_header",
      };
      context.response.status = 401;
      return;
    }

    const [_, jwtBase64] = jwt.split(" ");

    try {
      await verify(jwtBase64, key);
    } catch (error) {
      console.error(error);
      context.response.body = {
        status: "error",
        code: "invalid_jwt",
      };
      context.response.status = 401;
      return;
    }

    context.response.body = {
      status: "sucess",
      payload: [
        {
          id: "e386ba6d-b9a3-4b64-a374-f9952fa09938",
          name: "Pizza",
          ingredients: ["cheese", "tomato", "dough"],
        },
        {
          id: "99de4b25-0fe1-47a0-86f1-18cef3b908a9",
          name: "Pasta",
          ingredients: ["pasta", "tomato", "cheese"],
        },
      ],
    };
    context.response.status = 200;
  });

const app = new Application();
app.use(oakCors());
app.use(router.routes());
app.use(router.allowedMethods());

await app.listen({ port: 8000 });
