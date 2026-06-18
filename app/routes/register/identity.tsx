import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import {
  Box,
  Button,
  FormControl,
  FormErrorMessage,
  FormHelperText,
  FormLabel,
  Heading,
  Input,
  Spinner,
  Text,
  VStack,
} from '@chakra-ui/react'
import { useRegisterContext } from '../../context/RegisterContext'
import { checkAvailability } from '../../libs/api'
import { deriveUsername, isValidUsername } from '../../libs/username'
import { DOMAIN } from '../../libs/constants'

type AvailabilityStatus = 'idle' | 'checking' | 'available' | 'taken' | 'error'

export default function IdentityRoute() {
  const { setIdentity } = useRegisterContext()
  const navigate = useNavigate()

  const [displayName, setDisplayName] = useState('')
  const [username, setUsername] = useState('')
  const [availability, setAvailability] = useState<AvailabilityStatus>('idle')

  function handleDisplayNameChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value
    setDisplayName(value)
    setUsername(deriveUsername(value))
    setAvailability('idle')
  }

  function handleUsernameChange(e: React.ChangeEvent<HTMLInputElement>) {
    setUsername(e.target.value)
    setAvailability('idle')
  }

  useEffect(() => {
    if (!username || !isValidUsername(username)) return

    const controller = new AbortController()
    const timer = setTimeout(async () => {
      setAvailability('checking')
      try {
        const data = await checkAvailability(username, controller.signal)
        setAvailability(data.username.available ? 'available' : 'taken')
      } catch (err) {
        if (err instanceof Error && err.name !== 'AbortError') {
          setAvailability('error')
        }
      }
    }, 400)

    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [username])

  const formatError =
    username && !isValidUsername(username)
      ? 'Only lowercase letters, numbers, and . – _ separators'
      : ''
  const isUsernameInvalid = !!formatError || availability === 'taken'
  const usernameRing = isUsernameInvalid
    ? '0 0 0 2px var(--chakra-colors-red-400)'
    : availability === 'available'
      ? '0 0 0 2px var(--chakra-colors-green-400)'
      : undefined
  const canContinue = availability === 'available' && !formatError

  function handleContinue() {
    setIdentity({ displayName, username })
    navigate('/register/method')
  }

  return (
    <>
      <VStack spacing={2} mb={6} textAlign='center'>
        <Heading size='xl' color='text.primary' fontWeight='bold'>
          Create your account
        </Heading>
        <Text color='text.secondary' fontSize='sm'>
          Pick a display name to get started
        </Text>
      </VStack>

      <VStack spacing={5} align='stretch'>
        <FormControl>
          <FormLabel>Display name</FormLabel>
          <Input
            value={displayName}
            onChange={handleDisplayNameChange}
            placeholder='e.g. John Doe'
            autoFocus
          />
        </FormControl>

        <FormControl isInvalid={isUsernameInvalid}>
          <FormLabel>Username</FormLabel>
          <Box
            display='flex'
            alignItems='center'
            bg='bg.input'
            borderRadius='sm'
            h={10}
            boxShadow={usernameRing}
            _focusWithin={{
              boxShadow: usernameRing ?? '0 0 0 2px var(--chakra-colors-brand-500)',
            }}
            transition='box-shadow 0.15s'
          >
            <Input
              value={username}
              onChange={handleUsernameChange}
              placeholder='john.doe'
              maxLength={64}
              bg='transparent'
              border='none'
              borderRadius='sm'
              color='text.primary'
              _placeholder={{ color: 'text.muted' }}
              _focus={{ boxShadow: 'none' }}
              h='full'
              flex={1}
            />
            {availability === 'checking' && (
              <Spinner size='xs' color='text.muted' mr={2} flexShrink={0} />
            )}
            <Text
              color='text.muted'
              fontSize='sm'
              pr={4}
              flexShrink={0}
              userSelect='none'
              whiteSpace='nowrap'
            >
              @{DOMAIN}
            </Text>
          </Box>

          {formatError && <FormErrorMessage fontSize='xs'>{formatError}</FormErrorMessage>}
          {!formatError && availability === 'taken' && (
            <FormErrorMessage fontSize='xs'>{username} is already taken</FormErrorMessage>
          )}
          {!formatError && availability === 'available' && (
            <FormHelperText color='green.400' fontSize='xs' mt={1}>
              {username} is available
            </FormHelperText>
          )}
          {!formatError && availability === 'error' && (
            <FormHelperText color='text.muted' fontSize='xs' mt={1}>
              Could not check availability — please try again
            </FormHelperText>
          )}
        </FormControl>

        <Button variant='brand' isDisabled={!canContinue} w='full' h={10} onClick={handleContinue}>
          Continue
        </Button>
      </VStack>
    </>
  )
}
