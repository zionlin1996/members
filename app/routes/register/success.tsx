import { useEffect } from 'react'
import { useNavigate } from 'react-router'
import { Box, Heading, Text, VStack } from '@chakra-ui/react'
import { MdCheckCircle } from 'react-icons/md'

export default function SuccessRoute() {
  const navigate = useNavigate()

  useEffect(() => {
    const timer = setTimeout(() => navigate('/', { replace: true }), 4000)
    return () => clearTimeout(timer)
  }, [navigate])

  return (
    <VStack spacing={5} align='center' py={4}>
      <Box
        w={16}
        h={16}
        borderRadius='full'
        bg='brand.500'
        display='flex'
        alignItems='center'
        justifyContent='center'
      >
        <MdCheckCircle size={36} color='white' />
      </Box>
      <VStack spacing={1} textAlign='center'>
        <Heading size='md' color='text.primary'>
          Account created!
        </Heading>
        <Text color='text.secondary' fontSize='sm'>
          Your account is pending admin approval.
        </Text>
      </VStack>
      <Text color='text.muted' fontSize='xs'>
        Redirecting you to home shortly…
      </Text>
    </VStack>
  )
}
