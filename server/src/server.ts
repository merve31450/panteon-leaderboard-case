import { app } from "./app";
import { env } from "./config/env";
import "./db/redis";

app.listen(env.port, () => {
  console.log(`Server running on port ${env.port}`);
  console.log(
    `Admin API key guard ${env.adminApiKey?.trim() ? "enabled" : "disabled"}`
  );
});
