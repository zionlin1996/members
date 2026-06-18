import { Link } from 'react-router'
import { Box, Button, Heading, Text, VStack } from '@chakra-ui/react'

export default function Home() {
  return (
    <Box minH='100vh' display='flex' alignItems='center' justifyContent='center' px={4}>
      <VStack spacing={4} textAlign='center'>
        <Heading size='xl' color='text.primary'>
          Welcome to YangFrenz
        </Heading>
        <Text color='text.secondary' fontSize='sm'>
          A members-only community.
        </Text>
        <Button as={Link} to='/register' variant='brand' h={10} px={8}>
          Create account
        </Button>
      </VStack>
    </Box>
  )
}
