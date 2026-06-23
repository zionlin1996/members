import { useEffect, useState } from 'react'
import {
  Alert,
  AlertDescription,
  AlertIcon,
  Badge,
  Box,
  Button,
  Flex,
  Spinner,
  Text,
  VStack,
  Wrap,
  WrapItem,
} from '@chakra-ui/react'
import { getConnections, revokeConnection, type Connection } from '@/libs/api'
import { errorMessage } from '@/libs/errors'

const SCOPE_LABELS: Record<string, string> = {
  openid: 'Identity',
  profile: 'Profile',
  email: 'Email',
  address: 'Address',
  phone: 'Phone',
  membership: 'Membership',
  offline_access: 'Offline access',
}

const formatDate = (epochSeconds: number | null) =>
  epochSeconds ? new Date(epochSeconds * 1000).toLocaleDateString() : null

// Member self-service: the third-party apps authorized via the OIDC
// Authorization Server, with the ability to revoke each one's access.
export default function ConnectionsRoute() {
  const [connections, setConnections] = useState<Connection[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [revoking, setRevoking] = useState<string | null>(null)

  useEffect(() => {
    getConnections()
      .then((r) => setConnections(r.connections))
      .catch((err) => setError(errorMessage(err)))
      .finally(() => setLoading(false))
  }, [])

  async function revoke(clientId: string) {
    setRevoking(clientId)
    setError('')
    try {
      await revokeConnection(clientId)
      setConnections((cs) => cs.filter((c) => c.clientId !== clientId))
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setRevoking(null)
    }
  }

  if (loading) {
    return (
      <Box display='flex' justifyContent='center' py={12}>
        <Spinner color='brand.500' />
      </Box>
    )
  }

  return (
    <VStack spacing={5} align='stretch'>
      <Text
        fontSize='xs'
        fontWeight='semibold'
        color='text.muted'
        textTransform='uppercase'
        letterSpacing='wider'
      >
        Connected apps
      </Text>

      {error && (
        <Alert status='error' borderRadius='sm' fontSize='xs'>
          <AlertIcon />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {connections.length === 0 ? (
        <Text color='text.muted' fontSize='sm'>
          You haven’t authorized any third-party apps.
        </Text>
      ) : (
        connections.map((c) => {
          const authorized = formatDate(c.authorizedAt)
          return (
            <Flex
              key={c.clientId}
              p={4}
              borderRadius='md'
              border='1px solid'
              borderColor='whiteAlpha.100'
              justify='space-between'
              align='flex-start'
              gap={4}
            >
              <Box flex='1' minW={0}>
                <Text fontWeight='semibold' color='text.primary' fontSize='sm'>
                  {c.name}
                </Text>
                {authorized && (
                  <Text color='text.muted' fontSize='xs' mb={2}>
                    Authorized {authorized}
                  </Text>
                )}
                <Wrap spacing={1.5}>
                  {c.scopes.map((scope) => (
                    <WrapItem key={scope}>
                      <Badge variant='subtle' fontSize='2xs' textTransform='none'>
                        {SCOPE_LABELS[scope] ?? scope}
                      </Badge>
                    </WrapItem>
                  ))}
                </Wrap>
              </Box>

              <Button
                size='xs'
                variant='ghost'
                color='red.400'
                _hover={{ bg: 'whiteAlpha.100' }}
                onClick={() => revoke(c.clientId)}
                isDisabled={!!revoking}
                flexShrink={0}
              >
                {revoking === c.clientId ? <Spinner size='xs' /> : 'Revoke'}
              </Button>
            </Flex>
          )
        })
      )}
    </VStack>
  )
}
