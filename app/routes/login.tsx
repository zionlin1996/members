import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import {
  Alert,
  AlertDescription,
  AlertIcon,
  Box,
  Button,
  Divider,
  FormControl,
  FormLabel,
  Heading,
  Input,
  Spinner,
  Text,
  VStack,
} from '@chakra-ui/react'
import { FaTelegram } from 'react-icons/fa'
import { MdVpnKey } from 'react-icons/md'
import { useAuth } from '../context/AuthContext'
import { loadTelegramWidget } from '../libs/telegram'

export default function LoginRoute() {
  const { status, login } = useAuth()
  const navigate = useNavigate()

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState<'password' | 'passkey' | 'telegram' | null>(null)
  const [error, setError] = useState('')

  // Already signed in (e.g. landed here via back button) → go to the app.
  useEffect(() => {
    if (status === 'authenticated') navigate('/', { replace: true })
  }, [status, navigate])

  async function run(method: 'password' | 'passkey' | 'telegram', fn: () => Promise<void>) {
    setSubmitting(method)
    setError('')
    try {
      await fn()
      navigate('/', { replace: true })
    } catch (err) {
      if (err instanceof Error && err.name === 'NotAllowedError') {
        setError('Passkey sign-in was cancelled.')
      } else {
        setError(err instanceof Error ? err.message : 'Something went wrong.')
      }
      setSubmitting(null)
    }
  }

  function handleTelegram() {
    run('telegram', async () => {
      const tgLogin = await loadTelegramWidget()
      await new Promise<void>((resolve, reject) => {
        tgLogin.auth(
          { bot_id: import.meta.env.VITE_TELEGRAM_BOT_ID, request_access: true },
          async (data) => {
            if (!data) { reject(new Error('Telegram sign-in was cancelled.')); return }
            try { await login('telegram')(data); resolve() }
            catch (err) { reject(err) }
          },
        )
      })
    })
  }

  const canSubmitPassword = !!username && !!password && !submitting

  return (
    <Box minH='100vh' display='flex' alignItems='center' justifyContent='center' px={4}>
      <Box
        bg='bg.base'
        borderRadius='md'
        p={8}
        w='full'
        maxW='440px'
        boxShadow='0 2px 10px 0 rgba(0,0,0,.4)'
      >
        <VStack spacing={2} mb={6} textAlign='center'>
          <Heading size='xl' color='text.primary' fontWeight='bold'>
            Welcome back
          </Heading>
          <Text color='text.secondary' fontSize='sm'>
            Sign in to your account
          </Text>
        </VStack>

        <VStack
          as='form'
          spacing={5}
          align='stretch'
          onSubmit={(e) => {
            e.preventDefault()
            if (canSubmitPassword) run('password', () => login('password')(username, password))
          }}
        >
          <FormControl>
            <FormLabel>Username</FormLabel>
            <Input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder='john.doe'
              autoFocus
            />
          </FormControl>

          <FormControl>
            <FormLabel>Password</FormLabel>
            <Input
              type='password'
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder='Your password'
            />
          </FormControl>

          {error && (
            <Alert status='error' borderRadius='sm' fontSize='xs'>
              <AlertIcon />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button type='submit' variant='brand' w='full' h={10} isDisabled={!canSubmitPassword}>
            {submitting === 'password' ? <Spinner size='sm' /> : 'Sign in'}
          </Button>
        </VStack>

        <Box display='flex' alignItems='center' gap={3} my={5}>
          <Divider borderColor='whiteAlpha.300' />
          <Text color='text.muted' fontSize='xs' flexShrink={0}>
            or
          </Text>
          <Divider borderColor='whiteAlpha.300' />
        </Box>

        <VStack spacing={3}>
          <Button
            variant='native'
            w='full'
            h={10}
            leftIcon={<MdVpnKey size={18} />}
            isDisabled={!!submitting}
            onClick={() => run('passkey', () => login('passkey')(username || undefined))}
          >
            {submitting === 'passkey' ? <Spinner size='sm' /> : 'Sign in with a passkey'}
          </Button>

          <Button
            variant='telegram'
            w='full'
            h={10}
            leftIcon={<FaTelegram size={20} />}
            isDisabled={!!submitting}
            onClick={handleTelegram}
          >
            {submitting === 'telegram' ? <Spinner size='sm' /> : 'Sign in with Telegram'}
          </Button>
        </VStack>

        <Text color='text.secondary' fontSize='sm' textAlign='center' mt={6}>
          Don&apos;t have an account?{' '}
          <Text as={Link} to='/register' color='brand.500' fontWeight='semibold'>
            Create one
          </Text>
        </Text>
      </Box>
    </Box>
  )
}
