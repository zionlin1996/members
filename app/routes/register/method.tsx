import { useEffect } from 'react'
import { useNavigate } from 'react-router'
import { Box, Button, Flex, Heading, Text, VStack } from '@chakra-ui/react'
import { FaTelegram } from 'react-icons/fa'
import { MdLock, MdVpnKey } from 'react-icons/md'
import { useRegisterContext, type AuthMethod } from '@/context/RegisterContext'
import { GoogleIcon } from '@/components/GoogleIcon'
import { googleRegisterUrl } from '@/libs/api'
import { DOMAIN } from '@/libs/constants'

export default function MethodRoute() {
  const { identity, setMethod } = useRegisterContext()
  const navigate = useNavigate()

  useEffect(() => {
    if (!identity) navigate('/register', { replace: true })
  }, [identity, navigate])

  const registerWith = (method: AuthMethod) => () => {
    setMethod(method)
    navigate('/register/setup')
  }

  if (!identity) return null

  return (
    <VStack spacing={5} align='stretch'>
      {/* Identity summary */}
      <Flex
        alignItems='center'
        gap={3}
        bg='bg.input'
        borderRadius='sm'
        p={3}
        cursor='pointer'
        onClick={() => navigate('/register')}
        _hover={{ bg: 'whiteAlpha.100' }}
        transition='background 0.15s'
        role='button'
        aria-label='Go back and change identity'
      >
        <Box
          w={9}
          h={9}
          borderRadius='full'
          bg='brand.500'
          display='flex'
          alignItems='center'
          justifyContent='center'
          flexShrink={0}
        >
          <Text color='white' fontWeight='bold' fontSize='sm'>
            {identity.displayName.charAt(0).toUpperCase()}
          </Text>
        </Box>
        <Box flex={1} minW={0}>
          <Text color='text.primary' fontWeight='semibold' fontSize='sm' noOfLines={1}>
            {identity.displayName}
          </Text>
          <Text color='text.muted' fontSize='xs' noOfLines={1}>
            {identity.username}@{DOMAIN}
          </Text>
        </Box>
        <Text color='text.muted' fontSize='xs' flexShrink={0}>
          Change
        </Text>
      </Flex>

      <VStack spacing={1} textAlign='center'>
        <Heading size='md' color='text.primary' fontWeight='bold'>
          How do you want to sign up?
        </Heading>
        <Text color='text.secondary' fontSize='sm'>
          Choose your preferred authentication method
        </Text>
      </VStack>

      <VStack spacing={3}>
        <Button
          variant='native'
          w='full'
          h={10}
          leftIcon={<MdLock size={18} />}
          onClick={registerWith('password')}
        >
          Password
        </Button>
        <Button
          variant='native'
          w='full'
          h={10}
          leftIcon={<MdVpnKey size={18} />}
          onClick={registerWith('passkey')}
        >
          Passkey
        </Button>
        <Button
          variant='google'
          w='full'
          h={10}
          leftIcon={<GoogleIcon />}
          onClick={() => {
            window.location.href = googleRegisterUrl(identity.displayName, identity.username)
          }}
        >
          Continue with Google
        </Button>
        <Button
          variant='telegram'
          w='full'
          h={10}
          leftIcon={<FaTelegram size={20} />}
          onClick={() => navigate('/register/telegram-callback')}
        >
          Continue with Telegram
        </Button>
      </VStack>
    </VStack>
  )
}
