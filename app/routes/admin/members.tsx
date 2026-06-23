import { useEffect, useState } from 'react'
import {
  Badge,
  Box,
  Button,
  Heading,
  Spinner,
  Table,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
} from '@chakra-ui/react'
import { adminApproveMember, getMembers, type Member } from '@/libs/api'
import { errorMessage } from '@/libs/errors'
import { DOMAIN } from '@/libs/constants'

const STATUS_SCHEME: Record<string, string> = {
  ACTIVE: 'green',
  UNVERIFIED: 'orange',
  SUSPENDED: 'red',
}

export default function AdminMembers() {
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [approving, setApproving] = useState<string | null>(null)

  useEffect(() => {
    getMembers()
      .then(({ members }) => setMembers(members))
      .catch((err) => setError(errorMessage(err)))
      .finally(() => setLoading(false))
  }, [])

  async function handleApprove(member: Member) {
    setApproving(member.id)
    try {
      await adminApproveMember(member.id)
      setMembers((ms) => ms.map((m) => (m.id === member.id ? { ...m, status: 'ACTIVE' } : m)))
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setApproving(null)
    }
  }

  if (loading) {
    return (
      <Box display='flex' justifyContent='center' py={16}>
        <Spinner color='brand.500' />
      </Box>
    )
  }

  return (
    <Box>
      <Heading size='sm' color='text.primary' mb={6}>
        Members
        <Text as='span' color='text.muted' fontWeight='normal' ml={2} fontSize='sm'>
          {members.length} total
        </Text>
      </Heading>

      {error && (
        <Text color='red.400' fontSize='sm' mb={4}>
          {error}
        </Text>
      )}

      <Box borderRadius='lg' border='1px solid' borderColor='whiteAlpha.100' overflow='hidden'>
        <Table size='sm' variant='simple'>
          <Thead bg='whiteAlpha.50'>
            <Tr>
              <Th color='text.muted' fontSize='xs'>
                Name
              </Th>
              <Th color='text.muted' fontSize='xs'>
                Email
              </Th>
              <Th color='text.muted' fontSize='xs'>
                Status
              </Th>
              <Th color='text.muted' fontSize='xs'>
                Joined
              </Th>
              <Th />
            </Tr>
          </Thead>
          <Tbody>
            {members.map((m) => (
              <Tr key={m.id} _hover={{ bg: 'whiteAlpha.50' }}>
                <Td>
                  <Text color='text.primary' fontSize='sm' fontWeight='medium'>
                    {m.displayName}
                  </Text>
                  <Text color='text.muted' fontSize='xs'>
                    {m.username}
                  </Text>
                </Td>
                <Td>
                  <Text color='text.muted' fontSize='xs'>
                    {m.username}@{DOMAIN}
                  </Text>
                </Td>
                <Td>
                  <Badge
                    colorScheme={STATUS_SCHEME[m.status] ?? 'gray'}
                    fontSize='xs'
                    variant='subtle'
                  >
                    {m.status}
                  </Badge>
                </Td>
                <Td>
                  <Text color='text.muted' fontSize='xs'>
                    {new Date(m.createdAt).toLocaleDateString()}
                  </Text>
                </Td>
                <Td isNumeric>
                  {m.status === 'UNVERIFIED' && (
                    <Button
                      size='xs'
                      variant='brand'
                      isLoading={approving === m.id}
                      onClick={() => handleApprove(m)}
                    >
                      Approve
                    </Button>
                  )}
                </Td>
              </Tr>
            ))}
            {members.length === 0 && (
              <Tr>
                <Td colSpan={5}>
                  <Text color='text.muted' fontSize='sm' textAlign='center' py={4}>
                    No members yet.
                  </Text>
                </Td>
              </Tr>
            )}
          </Tbody>
        </Table>
      </Box>
    </Box>
  )
}
