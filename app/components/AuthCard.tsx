import { Box } from '@chakra-ui/react'

export const CenteredScreen = ({ children }: React.PropsWithChildren) => (
  <Box minH='100vh' display='flex' alignItems='center' justifyContent='center' px={4}>
    {children}
  </Box>
)

export const AuthCard = ({ children }: React.PropsWithChildren) => (
  <CenteredScreen>
    <Box bg='bg.base' borderRadius='md' p={8} w='full' maxW='440px' boxShadow='card'>
      {children}
    </Box>
  </CenteredScreen>
)
