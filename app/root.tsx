import { Links, Meta, Outlet, Scripts, ScrollRestoration } from 'react-router'
import { ChakraProvider } from '@chakra-ui/react'
import { theme } from './theme'
import { AuthProvider } from '@/context/AuthContext'

export default function Root() {
  return (
    <html lang='en'>
      <head>
        <meta charSet='UTF-8' />
        <link rel='icon' type='image/svg+xml' href='/favicon.svg' />
        <meta name='viewport' content='width=device-width, initial-scale=1.0' />
        <Meta />
        <Links />
      </head>
      <body>
        <ChakraProvider theme={theme}>
          <AuthProvider>
            <Outlet />
          </AuthProvider>
        </ChakraProvider>
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  )
}
