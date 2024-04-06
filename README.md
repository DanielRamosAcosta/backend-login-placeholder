# Backend Login Placeholder

Simple dirty login placeholder.

In order to do login, and retrieve a JWT for authorization, perform:

```http
POST https://backend-login-placeholder.deno.dev/api/users/login
Content-Type: application/json

{
  "password": "ilovecats",
  "email": "linustorvalds@gmail.com"
}
```

After that, you can get a list of recepies.

```http
GET https://backend-login-placeholder.deno.dev/api/recepies
Authorization: Bearer YOUR_TOKEN
```

## Deploy

```
deployctl deploy -p backend-login-placeholder --prod
```
