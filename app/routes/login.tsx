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
import { AuthCard } from '../components/AuthCard'
import { errorMessage, isPasskeyCancelled } from '../libs/errors'
import { requestTelegramAuth } from '../libs/telegram'

export default function LoginRoute() {
  const { status, login } = useAuth()
  const navigate = useNavigate()

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState<'password' | 'passkey' | 'telegram' | null>(null)
  const [error, setError] = useState('')

  // Already signed in → go to the app. Also handles post-login redirect:
  // login methods set status to 'authenticated', which triggers this effect.
  useEffect(() => {
    if (status === 'authenticated') navigate('/', { replace: true })
  }, [status, navigate])

  async function run(method: 'password' | 'passkey' | 'telegram', fn: () => Promise<void>) {
    setSubmitting(method)
    setError('')
    try {
      await fn()
    } catch (err) {
      setError(isPasskeyCancelled(err) ? 'Passkey sign-in was cancelled.' : errorMessage(err))
      setSubmitting(null)
    }
  }

  function handleTelegram() {
    run('telegram', async () => {
      const data = await requestTelegramAuth()
      if (!data) throw new Error('Telegram sign-in was cancelled.')
      await login('telegram')(data)
    })
  }

  const canSubmitPassword = !!username && !!password && !submitting

  return (
    <AuthCard>
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
    </AuthCard>
  )
}
