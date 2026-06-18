import { type RouteConfig, index, route, layout } from '@react-router/dev/routes'

export default [
  index('routes/home.tsx'),
  layout('routes/register/index.tsx', [
    route('register', 'routes/register/identity.tsx'),
    route('register/method', 'routes/register/method.tsx'),
    route('register/setup', 'routes/register/setup.tsx'),
    route('register/success', 'routes/register/success.tsx'),
    route('register/telegram-callback', 'routes/register/telegram-callback.tsx'),
  ]),
] satisfies RouteConfig
