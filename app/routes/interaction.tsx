import { useEffect, useState } from 'react'
import { useParams } from 'react-router'
import { startAuthentication } from '@simplewebauthn/browser'
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
  List,
  ListIcon,
  ListItem,
  Spinner,
  Text,
  VStack,
} from '@chakra-ui/react'
import { FaTelegram } from 'react-icons/fa'
import { MdCheckCircle, MdVpnKey } from 'react-icons/md'
import {
  getInteraction,
  passkeyLoginStart,
  submitInteractionConsent,
  submitInteractionDeny,
  submitInteractionLogin,
  type InteractionDetails,
} from '@/libs/api'
import { AuthCard } from '@/components/AuthCard'
import { errorMessage, isPasskeyCancelled } from '@/libs/errors'
import { requestTelegramAuth } from '@/libs/telegram'

// Human-readable labels for the scopes a third-party app can request.
const SCOPE_LABELS: Record<string, string> = {
  openid: 'Verify your identity',
  profile: 'Your profile — name, picture, and details',
  email: 'Your email address',
  address: 'Your postal address',
  phone: 'Your phone number',
  membership: 'Your membership status',
  offline_access: 'Keep access while you’re away',
}

type LoginMethod = 'password' | 'passkey' | 'telegram'

// The OIDC Authorization Server redirects third-party users here (login +
// consent). This route is independent of the first-party session — the member
// authenticating here is granting an external app access to their data. It talks
// to the API's /interaction endpoints, which ride on the provider's interaction
// cookie. On success the API returns a resume URL we navigate the browser to.
export default function InteractionRoute() {
  const { uid = '' } = useParams()

  const [details, setDetails] = useState<InteractionDetails | null>(null)
  const [loadError, setLoadError] = useState('')

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState<LoginMethod | 'consent' | 'deny' | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    getInteraction(uid)
      .then((d) => active && setDetails(d))
      .catch(
        (err) =>
          active && setLoadError(errorMessage(err, 'This sign-in request is invalid or expired.')),
      )
    return () => {
      active = false
    }
  }, [uid])

  // Top-level navigation to the provider's resume URL (it 303s onward).
  const resume = (redirectTo: string) => window.location.assign(redirectTo)

  async function runLogin(
    method: LoginMethod,
    getPayload: () => Promise<Parameters<typeof submitInteractionLogin>[1] | null>,
  ) {
    setSubmitting(method)
    setError('')
    try {
      const payload = await getPayload()
      if (!payload) {
        setSubmitting(null)
        return
      }
      const { redirectTo } = await submitInteractionLogin(uid, payload)
      resume(redirectTo)
    } catch (err) {
      setError(isPasskeyCancelled(err) ? 'Passkey sign-in was cancelled.' : errorMessage(err))
      setSubmitting(null)
    }
  }

  const submitPassword = () =>
    runLogin('password', async () => ({ method: 'password', username, password }))

  const submitPasskey = () =>
    runLogin('passkey', async () => {
      const { sessionId, options } = await passkeyLoginStart(username || undefined)
      const credential = await startAuthentication({ optionsJSON: options })
      return { method: 'passkey', sessionId, credential }
    })

  const submitTelegram = () =>
    runLogin('telegram', async () => {
      const telegramData = await requestTelegramAuth()
      return telegramData ? { method: 'telegram', telegramData } : null
    })

  async function approveConsent() {
    setSubmitting('consent')
    setError('')
    try {
      const { redirectTo } = await submitInteractionConsent(uid)
      resume(redirectTo)
    } catch (err) {
      setError(errorMessage(err))
      setSubmitting(null)
    }
  }

  // Reject the request: the API aborts the OIDC flow and returns a resume URL
  // that bounces back to the app with an access_denied error.
  async function denyConsent() {
    setSubmitting('deny')
    setError('')
    try {
      const { redirectTo } = await submitInteractionDeny(uid)
      resume(redirectTo)
    } catch (err) {
      setError(errorMessage(err))
      setSubmitting(null)
    }
  }

  if (loadError) {
    return (
      <AuthCard>
        <Alert status='error' borderRadius='sm' fontSize='sm'>
          <AlertIcon />
          <AlertDescription>{loadError}</AlertDescription>
        </Alert>
      </AuthCard>
    )
  }

  if (!details) {
    return (
      <AuthCard>
        <VStack py={6}>
          <Spinner />
        </VStack>
      </AuthCard>
    )
  }

  const appName = details.client.name || 'An application'

  if (details.prompt === 'consent') {
    return (
      <AuthCard>
        <VStack spacing={2} mb={6} textAlign='center'>
          <Heading size='lg' color='text.primary' fontWeight='bold'>
            Authorize {appName}
          </Heading>
          <Text color='text.secondary' fontSize='sm'>
            {appName} is requesting access to:
          </Text>
        </VStack>

        <List spacing={3} mb={6}>
          {details.requestedScopes.map((scope) => (
            <ListItem
              key={scope}
              color='text.primary'
              fontSize='sm'
              display='flex'
              alignItems='center'
            >
              <ListIcon as={MdCheckCircle} color='brand.500' />
              {SCOPE_LABELS[scope] ?? scope}
            </ListItem>
          ))}
        </List>

        {error && (
          <Alert status='error' borderRadius='sm' fontSize='xs' mb={4}>
            <AlertIcon />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <VStack spacing={3}>
          <Button
            variant='brand'
            w='full'
            h={10}
            onClick={approveConsent}
            isDisabled={!!submitting}
          >
            {submitting === 'consent' ? <Spinner size='sm' /> : `Allow ${appName}`}
          </Button>
          <Button
            variant='ghost'
            w='full'
            h={10}
            color='text.muted'
            _hover={{ color: 'text.secondary', bg: 'whiteAlpha.100' }}
            onClick={denyConsent}
            isDisabled={!!submitting}
          >
            {submitting === 'deny' ? <Spinner size='sm' /> : 'Deny'}
          </Button>
        </VStack>
      </AuthCard>
    )
  }

  // prompt === 'login'
  const canSubmitPassword = !!username && !!password && !submitting

  return (
    <AuthCard>
      <VStack spacing={2} mb={6} textAlign='center'>
        <Heading size='lg' color='text.primary' fontWeight='bold'>
          Sign in to continue
        </Heading>
        <Text color='text.secondary' fontSize='sm'>
          {appName} wants you to sign in to your account
        </Text>
      </VStack>

      <VStack
        as='form'
        spacing={5}
        align='stretch'
        onSubmit={(e) => {
          e.preventDefault()
          if (canSubmitPassword) submitPassword()
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

        <Button
          type='submit'
          variant='brand'
          w='full'
          h={10}
          isDisabled={!canSubmitPassword}
          isLoading={submitting === 'password'}
          loadingText='Signing in...'
        >
          Sign in
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
          leftIcon={<MdVpnKey size={18} />}
          isDisabled={!!submitting}
          onClick={submitPasskey}
          isLoading={submitting === 'passkey'}
          loadingText='Signing in with a passkey...'
        >
          Sign in with a passkey
        </Button>

        <Button
          variant='telegram'
          leftIcon={<FaTelegram size={20} />}
          isDisabled={!!submitting}
          onClick={submitTelegram}
          isLoading={submitting === 'telegram'}
          loadingText='Signing in with Telegram...'
        >
          Sign in with Telegram
        </Button>
      </VStack>
    </AuthCard>
  )
}
