import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import {
  Alert,
  AlertDescription,
  AlertIcon,
  Box,
  Button,
  Flex,
  Heading,
  Text,
  VStack,
} from '@chakra-ui/react'
import { FaTelegram } from 'react-icons/fa'
import { MdLock, MdVpnKey } from 'react-icons/md'
import { useRegisterContext, type AuthMethod } from '../../context/RegisterContext'
import { DOMAIN } from '../../libs/constants'
import { telegramRegister } from '../../libs/api'
import type { TelegramAuthData } from '../../libs/api'

declare global {
  interface Window {
    Telegram?: {
      Login: {
        auth: (
          options: { bot_id: string; request_access?: boolean },
          callback: (data: TelegramAuthData | false) => void,
        ) => void
      }
    }
  }
}

// Google G must stay as an inline SVG — react-icons renders single-color only,
// but Google's brand guidelines require the standard multicolor mark.
function GoogleG() {
  return (
    <svg width='18' height='18' viewBox='0 0 18 18' aria-hidden='true'>
      <path
        fill='#4285F4'
        d='M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908C16.418 14.013 17.64 11.807 17.64 9.2z'
      />
      <path
        fill='#34A853'
        d='M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z'
      />
      <path
        fill='#FBBC05'
        d='M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z'
      />
      <path
        fill='#EA4335'
        d='M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z'
      />
    </svg>
  )
}

export default function MethodRoute() {
  const { identity, setMethod } = useRegisterContext()
  const navigate = useNavigate()
  const [tgLoading, setTgLoading] = useState(false)
  const [tgError, setTgError] = useState('')

  useEffect(() => {
    if (!identity) navigate('/register', { replace: true })
  }, [identity, navigate])

  const registerWith = (method: AuthMethod) => () => {
    setMethod(method)
    navigate('/register/setup')
  }

  function handleTelegram() {
    if (!window.Telegram?.Login) return
    setTgLoading(true)
    setTgError('')
    window.Telegram.Login.auth(
      { bot_id: import.meta.env.VITE_TELEGRAM_BOT_ID, request_access: true },
      async (data) => {
        if (!data) {
          setTgLoading(false)
          return
        }
        try {
          await telegramRegister({
            displayName: identity!.displayName,
            username: identity!.username,
            telegramData: data,
          })
          navigate('/register/success')
        } catch (err) {
          setTgError(err instanceof Error ? err.message : 'Something went wrong.')
          setTgLoading(false)
        }
      },
    )
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
        <Button variant='google' w='full' h={10} leftIcon={<GoogleG />}>
          Continue with Google
        </Button>
        <Button
          variant='telegram'
          w='full'
          h={10}
          leftIcon={<FaTelegram size={20} />}
          isLoading={tgLoading}
          onClick={handleTelegram}
        >
          Continue with Telegram
        </Button>
      </VStack>
      {tgError && (
        <Alert status='error' borderRadius='sm' fontSize='xs'>
          <AlertIcon />
          <AlertDescription>{tgError}</AlertDescription>
        </Alert>
      )}
    </VStack>
  )
}
