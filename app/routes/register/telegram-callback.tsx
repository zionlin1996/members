import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import {
  Alert,
  AlertDescription,
  AlertIcon,
  Spinner,
  Text,
  VStack,
} from '@chakra-ui/react'
import { useRegisterContext } from '../../context/RegisterContext'
import { telegramRegister } from '../../libs/api'
import type { TelegramAuthData } from '../../libs/api'

declare global {
  interface Window {
    Telegram?: {
      Login: {
        auth: (
          options: { bot_id: string | number; request_access?: boolean },
          callback: (data: TelegramAuthData | false) => void,
        ) => void
      }
    }
  }
}

function decodeTgAuthResult(encoded: string): TelegramAuthData | false {
  let padded = encoded.replace(/-/g, '+').replace(/_/g, '/')
  const rem = padded.length % 4
  if (rem > 1) padded += '='.repeat(4 - rem)
  try {
    return JSON.parse(window.atob(padded)) as TelegramAuthData
  } catch {
    return false
  }
}

export default function TelegramCallbackRoute() {
  const { identity } = useRegisterContext()
  const navigate = useNavigate()
  const [apiError, setApiError] = useState('')

  // Capture hash before React Router effects can navigate away
  const tgAuthResult = useMemo(() => {
    const match = window.location.hash.match(/[#&?]tgAuthResult=([A-Za-z0-9\-_=]*)/)
    return match ? match[1] : null
  }, [])

  // Derive widget availability at mount — avoids setState-in-effect
  const telegramReady = useMemo(() => !!window.Telegram?.Login, [])

  useEffect(() => {
    // Popup mode: relay auth result back to the parent window, then close
    if (tgAuthResult && window.opener) {
      const result = decodeTgAuthResult(tgAuthResult)
      window.opener.postMessage(
        JSON.stringify({ event: 'auth_result', result }),
        location.origin,
      )
      window.close()
      return
    }

    if (!identity) {
      navigate('/register', { replace: true })
      return
    }

    if (!telegramReady) return

    // Parent mode: open Telegram auth popup. return_to will point back here.
    window.Telegram!.Login.auth(
      { bot_id: import.meta.env.VITE_TELEGRAM_BOT_ID, request_access: true },
      async (data) => {
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
  }, [tgAuthResult, identity, navigate, telegramReady])

  if (apiError) {
    return (
      <Alert status='error' borderRadius='sm' fontSize='xs'>
        <AlertIcon />
        <AlertDescription>{apiError}</AlertDescription>
      </Alert>
    )
  }

  if (!telegramReady && !tgAuthResult) {
    return (
      <Alert status='error' borderRadius='sm' fontSize='xs'>
        <AlertIcon />
        <AlertDescription>
          Telegram widget failed to load. Please refresh and try again.
        </AlertDescription>
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
