const keyBase64 =
  "CLsHF7Jw41b20XT4hANg0y4uMuBOZn+WlogarmskI5xEGWBmJ+Eu8l8XxK0wrHX98gEavBBJDltj2kFPLwahcOcjgE2rymW7xivw2Ddy9X5YQDSxe1uGo+1fS/1MOzDz0iOfa1/qOSYZYG9q4i/R74rlDy8t7c/g+esiH/EgKKw=";

const keyBuffer = Uint8Array.from(atob(keyBase64), (c) => c.charCodeAt(0));

export const key = await crypto.subtle.importKey(
  "raw",
  keyBuffer,
  { name: "HMAC", hash: "SHA-512" },
  true,
  ["sign", "verify"]
);
