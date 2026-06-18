import { useNavigate } from 'react-router'
import { Box, Button, Heading, Text, VStack } from '@chakra-ui/react'
import { DOMAIN } from '../libs/constants'
import { useAuth } from '../context/AuthContext'

export default function Home() {
  const { member, logout } = useAuth()
  const navigate = useNavigate()

  async function handleLogout() {
    await logout()
    navigate('/login', { replace: true })
  }

  return (
    <Box minH='100vh' display='flex' alignItems='center' justifyContent='center' px={4}>
      <VStack spacing={4} textAlign='center'>
        <Heading size='xl' color='text.primary'>
          Welcome{member ? `, ${member.displayName}` : ''}
        </Heading>
        <Text color='text.secondary' fontSize='sm'>
          {member ? `${member.username}@${DOMAIN}` : 'A members-only community.'}
        </Text>
        <Button variant='brand' h={10} px={8} onClick={handleLogout}>
          Sign out
        </Button>
      </VStack>
    </Box>
  )
}
