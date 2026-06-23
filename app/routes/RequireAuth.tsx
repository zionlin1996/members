import { useEffect } from 'react'
import { Outlet, useNavigate } from 'react-router'
import { Box, Spinner, Text, VStack } from '@chakra-ui/react'
import { useAuth } from '@/context/AuthContext'
import { MemberLayout } from '@/components/MemberLayout'

const PendingNotice = () => (
  <VStack spacing={2} py={4} textAlign='center'>
    <Text color='text.secondary' fontSize='sm'>
      Your account is awaiting admin approval.
    </Text>
    <Text color='text.muted' fontSize='xs'>
      You'll receive a notification at your backup email once it's active.
    </Text>
  </VStack>
)

// Layout guard — three states:
//   loading / anonymous → spinner or redirect to /login
//   authenticated + UNVERIFIED → MemberShell + pending notice
//   authenticated + ACTIVE → MemberShell + <Outlet/>
export default function RequireAuth() {
  const { status, member } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (status === 'anonymous') navigate('/login', { replace: true })
  }, [status, navigate])

  if (status !== 'authenticated') {
    return (
      <Box minH='100vh' display='flex' alignItems='center' justifyContent='center'>
        <Spinner color='brand.500' />
      </Box>
    )
  }

  return (
    <MemberLayout>{member?.status === 'UNVERIFIED' ? <PendingNotice /> : <Outlet />}</MemberLayout>
  )
}
