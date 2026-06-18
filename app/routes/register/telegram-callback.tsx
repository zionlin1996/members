import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import { Alert, AlertDescription, AlertIcon, Spinner, Text, VStack } from '@chakra-ui/react'
import { useRegisterContext } from '../../context/RegisterContext'
import { telegramRegister } from '../../libs/api'
import { decodeTgAuthResult, loadTelegramWidget } from '../../libs/telegram'

export default function TelegramCallbackRoute() {
  const { identity } = useRegisterContext()
  const navigate = useNavigate()
  const [apiError, setApiError] = useState('')

  // Capture hash before React Router effects can navigate away
  const tgAuthResult = useMemo(() => {
    const match = window.location.hash.match(/[#&?]tgAuthResult=([A-Za-z0-9\-_=]*)/)
    return match ? match[1] : null
  }, [])

  useEffect(() => {
    // Popup mode: relay auth result back to the parent window, then close
    if (tgAuthResult && window.opener) {
      const result = decodeTgAuthResult(tgAuthResult)
      window.opener.postMessage(JSON.stringify({ event: 'auth_result', result }), location.origin)
      window.close()
      return
    }

    if (!identity) {
      navigate('/register', { replace: true })
      return
    }

    let active = true

    loadTelegramWidget()
      .then((tgLogin) => {
        if (!active) return
        tgLogin.auth(
          { bot_id: import.meta.env.VITE_TELEGRAM_BOT_ID, request_access: true },
          async (data) => {
            if (!active) return
            if (!data) {
              navigate('/register/method', { replace: true })
              return
            }
            try {
              await telegramRegister({
                displayName: identity.displayName,
                username: identity.username,
                telegramData: data,
              })
              navigate('/register/success')
            } catch (err) {
              setApiError(err instanceof Error ? err.message : 'Something went wrong.')
            }
          },
        )
      })
      .catch((err: unknown) => {
        if (!active) return
        setApiError(err instanceof Error ? err.message : 'Telegram widget failed to load.')
      })

    return () => {
      active = false
    }
  }, [tgAuthResult, identity, navigate])

  if (apiError) {
    return (
      <Alert status='error' borderRadius='sm' fontSize='xs'>
        <AlertIcon />
        <AlertDescription>{apiError}</AlertDescription>
      </Alert>
    )
  }

  return (
    <VStack spacing={3} py={6} align='center'>
      <Spinner size='md' color='brand.500' />
      <Text color='text.muted' fontSize='sm'>
        Connecting to Telegram…
      </Text>
    </VStack>
  )
}
