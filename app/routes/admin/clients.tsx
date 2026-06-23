import { useEffect, useState } from 'react'
import {
  Alert,
  AlertDescription,
  AlertIcon,
  Badge,
  Box,
  Button,
  Checkbox,
  CheckboxGroup,
  Flex,
  FormControl,
  FormHelperText,
  FormLabel,
  Heading,
  HStack,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Spinner,
  Stack,
  Table,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  useDisclosure,
  VStack,
} from '@chakra-ui/react'
import {
  adminListClients,
  adminCreateClient,
  adminUpdateClient,
  adminDeleteClient,
  SUPPORTED_SCOPES,
  type OAuthClient,
  type OAuthClientPayload,
} from '@/libs/api'
import { errorMessage } from '@/libs/errors'

// ── Client form ─────────────────────────────────────────────────────────────

const EMPTY_FORM: OAuthClientPayload = {
  name: '',
  redirectUris: [],
  allowedScopes: ['openid'],
  clientId: '',
  logoUri: '',
}

function clientToForm(c: OAuthClient): OAuthClientPayload {
  return {
    name: c.name,
    redirectUris: c.redirectUris,
    allowedScopes: c.allowedScopes,
    clientId: c.clientId,
    logoUri: c.logoUri ?? '',
  }
}

interface ClientModalProps {
  isOpen: boolean
  onClose: () => void
  initial: OAuthClientPayload | null
  onSave: (payload: OAuthClientPayload) => Promise<void>
}

const ClientModal = ({ isOpen, onClose, initial, onSave }: ClientModalProps) => {
  const [form, setForm] = useState<OAuthClientPayload>(initial ?? EMPTY_FORM)
  const [urisText, setUrisText] = useState((initial?.redirectUris ?? []).join('\n'))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function set<K extends keyof OAuthClientPayload>(key: K, value: OAuthClientPayload[K]) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  async function handleSave() {
    const uris = urisText
      .split('\n')
      .map((u) => u.trim())
      .filter(Boolean)
    const payload: OAuthClientPayload = {
      ...form,
      redirectUris: uris,
      clientId: form.clientId || undefined,
      logoUri: form.logoUri || undefined,
    }
    setSaving(true)
    setError('')
    try {
      await onSave(payload)
      onClose()
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  const isEdit = !!initial

  return (
    <Modal isOpen={isOpen} onClose={onClose} size='lg'>
      <ModalOverlay />
      <ModalContent bg='bg.base' border='1px solid' borderColor='whiteAlpha.100'>
        <ModalHeader fontSize='md' color='text.primary'>
          {isEdit ? 'Edit client' : 'New OAuth client'}
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack spacing={4} align='stretch'>
            <FormControl isRequired>
              <FormLabel fontSize='sm'>Name</FormLabel>
              <Input
                size='sm'
                value={form.name}
                onChange={(e) => set('name', e.target.value)}
                placeholder='My App'
              />
            </FormControl>

            {!isEdit && (
              <FormControl>
                <FormLabel fontSize='sm'>Client ID</FormLabel>
                <Input
                  size='sm'
                  value={form.clientId}
                  onChange={(e) => set('clientId', e.target.value)}
                  placeholder='Auto-generated if empty'
                />
              </FormControl>
            )}

            <FormControl isRequired>
              <FormLabel fontSize='sm'>Redirect URIs</FormLabel>
              <Input
                as='textarea'
                size='sm'
                value={urisText}
                onChange={(e) => setUrisText(e.target.value)}
                placeholder={'https://myapp.com/callback\nhttps://myapp.com/silent-refresh'}
                minH='80px'
                py={2}
                fontFamily='mono'
              />
              <FormHelperText fontSize='xs'>
                One URI per line. Must be https (or localhost).
              </FormHelperText>
            </FormControl>

            <FormControl>
              <FormLabel fontSize='sm'>Logo URI</FormLabel>
              <Input
                size='sm'
                value={form.logoUri}
                onChange={(e) => set('logoUri', e.target.value)}
                placeholder='https://myapp.com/logo.png'
              />
            </FormControl>

            <FormControl isRequired>
              <FormLabel fontSize='sm'>Allowed scopes</FormLabel>
              <CheckboxGroup
                value={form.allowedScopes}
                onChange={(vals) => set('allowedScopes', vals as string[])}
              >
                <Stack spacing={2} direction='row' flexWrap='wrap'>
                  {SUPPORTED_SCOPES.map((scope) => (
                    <Checkbox key={scope} value={scope} size='sm'>
                      <Text fontSize='xs' fontFamily='mono'>
                        {scope}
                      </Text>
                    </Checkbox>
                  ))}
                </Stack>
              </CheckboxGroup>
            </FormControl>

            {error && (
              <Alert status='error' borderRadius='sm' fontSize='xs'>
                <AlertIcon />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </VStack>
        </ModalBody>
        <ModalFooter gap={2}>
          <Button variant='ghost' size='sm' onClick={onClose} color='text.muted'>
            Cancel
          </Button>
          <Button variant='brand' size='sm' isLoading={saving} onClick={handleSave}>
            {isEdit ? 'Save changes' : 'Create client'}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}

// ── Main page ────────────────────────────────────────────────────────────────

export default function AdminClients() {
  const [clients, setClients] = useState<OAuthClient[]>([])
  const [loading, setLoading] = useState(true)
  const [pageError, setPageError] = useState('')
  const [deleting, setDeleting] = useState<string | null>(null)
  const [editing, setEditing] = useState<OAuthClient | null>(null)
  const { isOpen, onOpen, onClose } = useDisclosure()

  useEffect(() => {
    adminListClients()
      .then(({ clients }) => setClients(clients))
      .catch((err) => setPageError(errorMessage(err)))
      .finally(() => setLoading(false))
  }, [])

  function openCreate() {
    setEditing(null)
    onOpen()
  }

  function openEdit(client: OAuthClient) {
    setEditing(client)
    onOpen()
  }

  async function handleSave(payload: OAuthClientPayload) {
    if (editing) {
      const { client } = await adminUpdateClient(editing.id, payload)
      setClients((cs) => cs.map((c) => (c.id === editing.id ? client : c)))
    } else {
      const { client } = await adminCreateClient(payload)
      setClients((cs) => [...cs, client])
    }
  }

  async function handleDelete(client: OAuthClient) {
    if (!confirm(`Delete "${client.name}"? This will break any apps using it.`)) return
    setDeleting(client.id)
    try {
      await adminDeleteClient(client.id)
      setClients((cs) => cs.filter((c) => c.id !== client.id))
    } catch (err) {
      setPageError(errorMessage(err))
    } finally {
      setDeleting(null)
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
      <Flex justify='space-between' mb={6}>
        <Heading size='sm' color='text.primary'>
          OAuth Clients
          <Text as='span' color='text.muted' fontWeight='normal' ml={2} fontSize='sm'>
            {clients.length} registered
          </Text>
        </Heading>
        <Button variant='brand' size='xs' onClick={openCreate}>
          + New client
        </Button>
      </Flex>

      {pageError && (
        <Text color='red.400' fontSize='sm' mb={4}>
          {pageError}
        </Text>
      )}

      <Box borderRadius='lg' border='1px solid' borderColor='whiteAlpha.100' overflow='hidden'>
        <Table size='sm' variant='simple'>
          <Thead bg='whiteAlpha.50'>
            <Tr>
              <Th color='text.muted' fontSize='xs'>
                Client
              </Th>
              <Th color='text.muted' fontSize='xs'>
                Redirect URIs
              </Th>
              <Th color='text.muted' fontSize='xs'>
                Scopes
              </Th>
              <Th color='text.muted' fontSize='xs'>
                Created
              </Th>
              <Th />
            </Tr>
          </Thead>
          <Tbody>
            {clients.map((c) => (
              <Tr key={c.id} _hover={{ bg: 'whiteAlpha.50' }}>
                <Td>
                  <Text color='text.primary' fontSize='sm' fontWeight='medium'>
                    {c.name}
                  </Text>
                  <Text color='text.muted' fontSize='xs' fontFamily='mono'>
                    {c.clientId}
                  </Text>
                </Td>
                <Td>
                  <VStack align='flex-start' spacing={0.5}>
                    {c.redirectUris.map((uri) => (
                      <Text key={uri} color='text.muted' fontSize='xs' fontFamily='mono'>
                        {uri}
                      </Text>
                    ))}
                  </VStack>
                </Td>
                <Td>
                  <HStack spacing={1} flexWrap='wrap'>
                    {c.allowedScopes.map((s) => (
                      <Badge key={s} fontSize='xs' colorScheme='purple' variant='subtle'>
                        {s}
                      </Badge>
                    ))}
                  </HStack>
                </Td>
                <Td>
                  <Text color='text.muted' fontSize='xs'>
                    {new Date(c.createdAt).toLocaleDateString()}
                  </Text>
                </Td>
                <Td isNumeric>
                  <HStack justify='flex-end' spacing={2}>
                    <Button
                      size='xs'
                      variant='ghost'
                      color='text.muted'
                      onClick={() => openEdit(c)}
                    >
                      Edit
                    </Button>
                    <Button
                      size='xs'
                      variant='ghost'
                      color='red.400'
                      isLoading={deleting === c.id}
                      onClick={() => handleDelete(c)}
                    >
                      Delete
                    </Button>
                  </HStack>
                </Td>
              </Tr>
            ))}
            {clients.length === 0 && (
              <Tr>
                <Td colSpan={5}>
                  <Text color='text.muted' fontSize='sm' textAlign='center' py={4}>
                    No clients registered yet.
                  </Text>
                </Td>
              </Tr>
            )}
          </Tbody>
        </Table>
      </Box>

      <ClientModal
        key={editing?.id ?? 'new'}
        isOpen={isOpen}
        onClose={onClose}
        initial={editing ? clientToForm(editing) : null}
        onSave={handleSave}
      />
    </Box>
  )
}
