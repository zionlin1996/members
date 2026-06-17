import { type RouteConfig, index, route, layout } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  layout("routes/register/index.tsx", [
    route("register", "routes/register/identity.tsx"),
    route("register/method", "routes/register/method.tsx"),
  ]),
] satisfies RouteConfig;
