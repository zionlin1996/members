import { NavLink, useNavigate } from 'react-router'
import { Box, Button, Divider, Flex, HStack, Text, VStack } from '@chakra-ui/react'
import { useAuth } from '@/context/AuthContext'
import { DOMAIN } from '@/libs/constants'

const NAV_ITEMS = [
  { to: '/', label: 'Profile', end: true },
  { to: '/connections', label: 'Connected apps', end: false },
]

const MemberNav = () => (
  <HStack spacing={5} px={6} pt={4}>
    {NAV_ITEMS.map(({ to, label, end }) => (
      <Box
        key={to}
        as={NavLink}
        to={to}
        end={end}
        fontSize='sm'
        color='text.muted'
        pb={1}
        borderBottom='2px solid'
        borderColor='transparent'
        _hover={{ color: 'text.secondary' }}
        sx={{ '&.active': { color: 'text.primary', borderColor: 'brand.500' } }}
      >
        {label}
      </Box>
    ))}
  </HStack>
)

function getInitials(name: string) {
  const words = name.trim().split(/\s+/)
  return words.length === 1
    ? words[0].slice(0, 2).toUpperCase()
    : (words[0][0] + words[words.length - 1][0]).toUpperCase()
}

const STATUS_COLOR: Record<string, string> = {
  ACTIVE: 'green.400',
  UNVERIFIED: 'orange.400',
  SUSPENDED: 'red.400',
}

const STATUS_LABEL: Record<string, string> = {
  ACTIVE: 'Active',
  UNVERIFIED: 'Pending approval',
  SUSPENDED: 'Suspended',
}

export function MemberLayout({ children }: React.PropsWithChildren) {
  const { member, logout } = useAuth()
  const navigate = useNavigate()

  async function handleLogout() {
    await logout()
    navigate('/login', { replace: true })
  }

  const status = member?.status ?? ''
  const dotColor = STATUS_COLOR[status] ?? 'text.muted'

  return (
    <Box minH='100vh' py={10} px={4} display='flex' justifyContent='center' alignItems='flex-start'>
      <Box
        bg='bg.base'
        borderRadius='xl'
        boxShadow='card'
        border='1px solid'
        borderColor='whiteAlpha.100'
        w='full'
        maxW='560px'
        overflow='hidden'
      >
        {/* ── Business card header ── */}
        <Flex px={6} py={4} justify='space-between' align='center'>
          <HStack spacing={3}>
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
              <Text color='white' fontWeight='bold' fontSize='xs' letterSpacing='tight'>
                {member ? getInitials(member.displayName) : '?'}
              </Text>
            </Box>

            <VStack align='flex-start' spacing={0}>
              <HStack spacing={2} align='center'>
                <Text fontWeight='semibold' color='text.primary' fontSize='sm' lineHeight='shorter'>
                  {member?.displayName ?? '—'}
                </Text>
                <HStack spacing={1}>
                  <Box w={1.5} h={1.5} borderRadius='full' bg={dotColor} flexShrink={0} />
                  <Text fontSize='xs' color={dotColor} lineHeight='shorter'>
                    {STATUS_LABEL[status] ?? status}
                  </Text>
                </HStack>
              </HStack>
              <Text color='text.muted' fontSize='xs'>
                {member ? `${member.username}@${DOMAIN}` : ''}
              </Text>
            </VStack>
          </HStack>

          <Button
            variant='ghost'
            size='xs'
            color='text.muted'
            _hover={{ color: 'text.secondary', bg: 'whiteAlpha.100' }}
            onClick={handleLogout}
            flexShrink={0}
          >
            Sign out
          </Button>
        </Flex>

        <Divider borderColor='whiteAlpha.100' />

        {/* ── Sub-nav (active members only; the pending notice has no tabs) ── */}
        {status === 'ACTIVE' && <MemberNav />}

        {/* ── Content slot ── */}
        <Box px={6} py={6}>
          {children}
        </Box>
      </Box>
    </Box>
  )
}
