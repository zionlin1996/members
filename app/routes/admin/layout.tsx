import { useState } from 'react'
import { Link as RouterLink, NavLink, Outlet } from 'react-router'
import {
  Box,
  Button,
  Flex,
  FormControl,
  FormLabel,
  HStack,
  Input,
  Link,
  Text,
  VStack,
} from '@chakra-ui/react'
import { adminListClients, setAdminKey } from '@/libs/api'
import { errorMessage } from '@/libs/errors'
import { CenteredScreen } from '@/components/AuthCard'

// ── Key gate ────────────────────────────────────────────────────────────────

const KeyGate = ({ onUnlock }: { onUnlock: (key: string) => void }) => {
  const [input, setInput] = useState('')
  const [checking, setChecking] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!input.trim()) return
    setChecking(true)
    setError('')
    try {
      setAdminKey(input.trim())
      await adminListClients()
      onUnlock(input.trim())
    } catch (err) {
      setAdminKey(null)
      setError(errorMessage(err, 'Invalid API key'))
    } finally {
      setChecking(false)
    }
  }

  return (
    <CenteredScreen>
      <Box
        bg='bg.base'
        border='1px solid'
        borderColor='whiteAlpha.100'
        borderRadius='xl'
        boxShadow='card'
        p={8}
        w='full'
        maxW='380px'
      >
        <VStack spacing={1} mb={6} textAlign='center'>
          <Text fontWeight='bold' color='text.primary' fontSize='md'>
            Admin access
          </Text>
          <Text color='text.muted' fontSize='xs'>
            Enter your API key to continue
          </Text>
        </VStack>
        <VStack as='form' spacing={4} align='stretch' onSubmit={handleSubmit}>
          <FormControl>
            <FormLabel fontSize='sm'>API key</FormLabel>
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              type='password'
              placeholder='••••••••'
              autoFocus
              size='sm'
            />
          </FormControl>
          {error && (
            <Text color='red.400' fontSize='xs'>
              {error}
            </Text>
          )}
          <Button type='submit' variant='brand' size='sm' isLoading={checking} h={9}>
            Unlock
          </Button>
        </VStack>
      </Box>
    </CenteredScreen>
  )
}

// ── Admin shell ─────────────────────────────────────────────────────────────

const NAV: { label: string; to: string }[] = [
  { label: 'Members', to: '/admin' },
  { label: 'OAuth Clients', to: '/admin/clients' },
]

const AdminShell = ({ onLock, children }: React.PropsWithChildren<{ onLock: () => void }>) => (
  <Box minH='100vh'>
    <Flex
      px={6}
      h='44px'
      align='center'
      justify='space-between'
      bg='bg.base'
      borderBottom='1px solid'
      borderColor='whiteAlpha.100'
      position='sticky'
      top={0}
      zIndex={10}
    >
      <HStack spacing={6}>
        <Text fontSize='sm' color='text.primary'>
          yangfrenz{' '}
          <Text as='span' color='brand.500' fontWeight='semibold'>
            admin
          </Text>
        </Text>
        <HStack spacing={1}>
          {NAV.map(({ label, to }) => (
            <NavLink key={to} to={to} end={to === '/admin'}>
              {({ isActive }) => (
                <Text
                  px={3}
                  py={1}
                  borderRadius='md'
                  fontSize='xs'
                  fontWeight='medium'
                  color={isActive ? 'text.primary' : 'text.muted'}
                  bg={isActive ? 'whiteAlpha.100' : undefined}
                  _hover={{ color: 'text.secondary' }}
                  transition='all 0.15s'
                  as='span'
                  display='block'
                >
                  {label}
                </Text>
              )}
            </NavLink>
          ))}
        </HStack>
      </HStack>
      <HStack spacing={4}>
        <Link
          as={RouterLink}
          to='/'
          fontSize='xs'
          color='text.muted'
          _hover={{ color: 'text.secondary' }}
        >
          ← App
        </Link>
        <Button variant='ghost' size='xs' color='text.muted' onClick={onLock}>
          Lock
        </Button>
      </HStack>
    </Flex>
    <Box px={6} py={6} maxW='1000px' mx='auto'>
      {children}
    </Box>
  </Box>
)

// ── Layout route ────────────────────────────────────────────────────────────

export default function AdminLayout() {
  const [unlocked, setUnlocked] = useState(() => {
    const stored = sessionStorage.getItem('admin_key') ?? ''
    if (stored) setAdminKey(stored) // restore in-memory key on page reload
    return !!stored
  })

  function handleUnlock(k: string) {
    sessionStorage.setItem('admin_key', k)
    setAdminKey(k)
    setUnlocked(true)
  }

  function handleLock() {
    sessionStorage.removeItem('admin_key')
    setAdminKey(null)
    setUnlocked(false)
  }

  if (!unlocked) return <KeyGate onUnlock={handleUnlock} />

  return (
    <AdminShell onLock={handleLock}>
      <Outlet />
    </AdminShell>
  )
}
