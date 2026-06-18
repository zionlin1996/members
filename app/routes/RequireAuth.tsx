import { useEffect } from 'react'
import { Outlet, useNavigate } from 'react-router'
import { Box, Spinner } from '@chakra-ui/react'
import { useAuth } from '../context/AuthContext'

// Layout guard: anonymous visitors are redirected to /login. While the session
// is being revived from the refresh cookie we hold on a spinner rather than
// flashing the login screen. Uses useNavigate + useEffect per project convention
// (<Navigate> throws in RR v7 without an error boundary).
export default function RequireAuth() {
  const { status } = useAuth()
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

  return <Outlet />
}
