import { oakCors } from "https://deno.land/x/cors/mod.ts";
import { z } from "https://deno.land/x/zod/mod.ts";
import {
  Application,
  Router,
  RouterContext,
} from "https://deno.land/x/oak@v11.1.0/mod.ts";
import {
  create,
  verify,
  getNumericDate,
} from "https://deno.land/x/djwt@v3.0.2/mod.ts";
import { key } from "./key.ts";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const RecepiesSchema = z.object({
  id: z.string(),
  name: z.string(),
  ingredients: z.array(z.string()),
});

type Recipes = z.infer<typeof RecepiesSchema>;

const recipes = new Map<string, Recipes>();

const router = new Router();

const RIGHT_EMAIL = "linustorvalds@gmail.com";
const RIGHT_PASSWORD = "ilovecats";

const API_TOKEN =
  "26df07b5b7318455b8ca09f923eaae6de6eb95530743eddcfdb541df9487df9d";

async function withAuthotized(
  context: RouterContext<any, any, any>,
  callback: () => {}
) {
  const jwt = context.request.headers.get("Authorization");

  const apiToken = context.request.headers.get("api_token");

  if (apiToken != null) {
    if (apiToken !== API_TOKEN) {
      context.response.body = {
        status: "error",
        code: "invalid_api_token",
      };
      context.response.status = 401;
      return;
    }

    await callback();

    return;
  }

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

  await callback();
}

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

    if (result.email.match('";')) {
      throw new Error("SQL Injection x.x");
    }

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
      code: "wrong_email_or_password",
    };
    context.response.status = 401;
  })
  .get("/api/recepies", async (context) => {
    await withAuthotized(context, async () => {
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
  })
  .get("/api/v2/recipes", async (context) => {
    await withAuthotized(context, async () => {
      context.response.body = {
        status: "sucess",
        payload: Array.from(recipes.values()),
      };
      context.response.status = 200;
    });
  })
  .post("/api/v2/recipes", async (context) => {
    await withAuthotized(context, async () => {
      const body = await context.request.body();
      const result = await body.value;

      try {
        const recipe = RecepiesSchema.parse(result);

        recipes.set(recipe.id, recipe);

        context.response.body = {
          status: "sucess",
          payload: recipe,
        };
        context.response.status = 200;
      } catch (error) {
        context.response.body = {
          status: "error",
          code: "invalid_recipe",
          errors: error.issues,
        };
        context.response.status = 400;
      }
    });
  })
  .get("/api/v2/recipes/:id", async (context) => {
    await withAuthotized(context, async () => {
      const { id } = context.params;

      const recipe = recipes.get(id);

      if (!recipe) {
        context.response.body = {
          status: "error",
          code: "recipe_not_found",
        };
        context.response.status = 404;
        return;
      }

      context.response.body = {
        status: "sucess",
        payload: recipe,
      };
      context.response.status = 200;
    });
  })
  .delete("/api/v2/recipes/:id", async (context) => {
    await withAuthotized(context, async () => {
      const { id } = context.params;

      const recipe = recipes.get(id);

      if (!recipe) {
        context.response.body = {
          status: "error",
          code: "recipe_not_found",
        };
        context.response.status = 404;
        return;
      }

      recipes.delete(id);

      context.response.body = {
        status: "sucess",
        payload: recipe,
      };
      context.response.status = 200;
    });
  });

const app = new Application();
app.use(oakCors());
app.use(router.routes());
app.use(router.allowedMethods());

await app.listen({ port: 8000 });
