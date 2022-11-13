import { oakCors } from "https://deno.land/x/cors/mod.ts";
import { Application, Router } from "https://deno.land/x/oak@v11.1.0/mod.ts";

const router = new Router();

router.post("/api/users", async (context) => {
    const body = await context.request.body()
    const result = await body.value

    console.log(result)

    if (!result.password) {
      context.response.body = {
        status: "error",
        code: "missing_password_field"
      };
      context.response.status = 400
      return
    }

    if (!result.email) {
      context.response.body = {
        status: "error",
        code: "missing_email_field"
      };
      context.response.status = 400
      return
    }

    if (result.password.length < 5) {
      context.response.body = {
        status: "error",
        code: "password_too_short"
      };
      context.response.status = 400
      return
    }

    if (result.email === "danielramos@gmail.com") {
      context.response.body = {
        status: "error",
        code: "email_already_exists"
      };
      context.response.status = 400
      return
    }

    console.log(result)

  context.response.body = {
    status: "ok"
  };
});

const app = new Application();
app.use(oakCors());
app.use(router.routes());
app.use(router.allowedMethods());

await app.listen({ port: 8000 });