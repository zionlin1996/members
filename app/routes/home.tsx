import { useEffect, useState } from 'react'
import {
  Alert,
  AlertDescription,
  AlertIcon,
  Box,
  Button,
  Divider,
  FormControl,
  FormHelperText,
  FormLabel,
  Grid,
  Input,
  Spinner,
  Text,
  VStack,
} from '@chakra-ui/react'
import { getProfile, updateProfile, type Profile } from '@/libs/api'
import { errorMessage } from '@/libs/errors'

// ── Validation ──────────────────────────────────────────────────────────────

const validators: Partial<Record<keyof Profile, (v: string) => boolean>> = {
  picture: (v) => /^https?:\/\/.+/.test(v),
  website: (v) => /^https?:\/\/.+/.test(v),
  profileUrl: (v) => /^https?:\/\/.+/.test(v),
  phoneNumber: (v) => /^\+[1-9]\d{1,14}$/.test(v),
  birthdate: (v) => {
    const d = new Date(v)
    return !isNaN(d.getTime()) && d < new Date()
  },
  locale: (v) => /^[a-z]{2,3}(-[A-Za-z]{2,8})*$/.test(v),
  country: (v) => /^[A-Z]{2}$/.test(v),
}

const hints: Partial<Record<keyof Profile, string>> = {
  birthdate: 'YYYY-MM-DD',
  phoneNumber: 'E.164 — e.g. +41791234567',
  locale: 'BCP-47 — e.g. en-US',
  country: 'ISO 3166-1 alpha-2 — e.g. CH',
  picture: 'https://…',
  website: 'https://…',
  profileUrl: 'https://…',
}

// ── Field layout ────────────────────────────────────────────────────────────

type FieldKey = keyof Omit<Profile, 'phoneVerified' | 'createdAt' | 'updatedAt'>

const SECTIONS: { title: string; fields: FieldKey[] }[] = [
  { title: 'Name', fields: ['givenName', 'middleName', 'familyName', 'nickname'] },
  { title: 'Personal', fields: ['birthdate', 'gender', 'pronouns'] },
  { title: 'Online', fields: ['picture', 'website', 'profileUrl'] },
  { title: 'Contact', fields: ['phoneNumber'] },
  { title: 'Location', fields: ['streetAddress', 'locality', 'region', 'postalCode', 'country'] },
  { title: 'Locale', fields: ['locale', 'zoneinfo'] },
]

const LABELS: Record<FieldKey, string> = {
  givenName: 'Given name',
  middleName: 'Middle name',
  familyName: 'Family name',
  nickname: 'Nickname',
  birthdate: 'Birthdate',
  gender: 'Gender',
  pronouns: 'Pronouns',
  picture: 'Profile picture URL',
  website: 'Website',
  profileUrl: 'Profile URL',
  phoneNumber: 'Phone number',
  streetAddress: 'Street address',
  locality: 'City',
  region: 'State / Province',
  postalCode: 'Postal code',
  country: 'Country',
  locale: 'Language',
  zoneinfo: 'Timezone',
}

const WIDE_FIELDS = new Set<FieldKey>(['streetAddress', 'profileUrl', 'picture'])
const EDITABLE = SECTIONS.flatMap((s) => s.fields)

function profileToDraft(p: Profile): Record<string, string> {
  return Object.fromEntries(EDITABLE.map((k) => [k, (p[k] as string | null) ?? '']))
}

// ── Route ────────────────────────────────────────────────────────────────────

export default function Home() {
  const [loading, setLoading] = useState(true)
  const [draft, setDraft] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [saved, setSaved] = useState(false)
  const [original, setOriginal] = useState<Record<string, string>>({})

  useEffect(() => {
    getProfile()
      .then((p) => {
        const d = profileToDraft(p)
        setDraft(d)
        setOriginal(d)
      })
      .finally(() => setLoading(false))
  }, [])

  function set(field: string, value: string) {
    setDraft((d) => ({ ...d, [field]: value }))
    setSaved(false)
  }

  function isInvalid(field: FieldKey) {
    const val = draft[field]
    return !!val && validators[field]?.(val) === false
  }

  function getChanges() {
    const changes: Record<string, string | null> = {}
    for (const key of EDITABLE) {
      const cur = draft[key] ?? ''
      const orig = original[key] ?? ''
      if (cur !== orig) changes[key] = cur || null
    }
    return changes
  }

  const hasChanges = Object.keys(getChanges()).length > 0
  const hasErrors = EDITABLE.some(isInvalid)

  async function handleSave() {
    if (!hasChanges || hasErrors) return
    setSaving(true)
    setSaveError('')
    setSaved(false)
    try {
      const updated = await updateProfile(getChanges())
      const d = profileToDraft(updated)
      setDraft(d)
      setOriginal(d)
      setSaved(true)
    } catch (err) {
      setSaveError(errorMessage(err))
    } finally {
      setSaving(false)
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
    <VStack spacing={7} align='stretch'>
      {SECTIONS.map((section, si) => (
        <Box key={section.title}>
          {si > 0 && <Divider borderColor='whiteAlpha.100' mb={6} />}
          <Text
            fontSize='xs'
            fontWeight='semibold'
            color='text.muted'
            textTransform='uppercase'
            letterSpacing='wider'
            mb={4}
          >
            {section.title}
          </Text>
          <Grid templateColumns={{ base: '1fr', sm: '1fr 1fr' }} gap={3}>
            {section.fields.map((field) => (
              <FormControl
                key={field}
                isInvalid={isInvalid(field)}
                gridColumn={WIDE_FIELDS.has(field) ? { sm: 'span 2' } : undefined}
              >
                <FormLabel fontSize='sm'>{LABELS[field]}</FormLabel>
                <Input
                  type={field === 'birthdate' ? 'date' : 'text'}
                  value={draft[field] ?? ''}
                  onChange={(e) => set(field, e.target.value)}
                  size='sm'
                />
                {hints[field] && (
                  <FormHelperText fontSize='xs' color={isInvalid(field) ? 'red.400' : 'text.muted'}>
                    {hints[field]}
                  </FormHelperText>
                )}
              </FormControl>
            ))}
          </Grid>
        </Box>
      ))}

      <Box pt={1}>
        {saveError && (
          <Alert status='error' borderRadius='sm' fontSize='xs' mb={3}>
            <AlertIcon />
            <AlertDescription>{saveError}</AlertDescription>
          </Alert>
        )}
        {saved && (
          <Alert status='success' borderRadius='sm' fontSize='xs' mb={3}>
            <AlertIcon />
            <AlertDescription>Profile saved.</AlertDescription>
          </Alert>
        )}
        <Button
          variant='brand'
          isDisabled={!hasChanges || hasErrors}
          isLoading={saving}
          loadingText='Saving...'
          onClick={handleSave}
        >
          Save profile
        </Button>
      </Box>
    </VStack>
  )
}
