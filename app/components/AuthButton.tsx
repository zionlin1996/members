import { Button } from '@chakra-ui/react'

const AuthButton = ({ children, ...props }: React.ComponentProps<typeof Button>) => (
  <Button w='full' h={10} {...props}>
    {children}
  </Button>
)

export default AuthButton
