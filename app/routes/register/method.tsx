import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import {
  Alert,
  AlertDescription,
  AlertIcon,
  Box,
  Button,
  FormControl,
  FormLabel,
  Heading,
  Input,
  SimpleGrid,
  Spinner,
  Text,
  VStack,
} from "@chakra-ui/react";
import { FaTelegram } from "react-icons/fa";
import { MdLock, MdVpnKey } from "react-icons/md";
import { startRegistration } from "@simplewebauthn/browser";
import { useRegisterContext } from "../../context/RegisterContext";
import { passkeyRegisterStart, passkeyRegisterFinish } from "../../libs/api";

type NativeMethod = "password" | "passkey";

const labelProps = {
  color: "text.secondary",
  fontSize: "xs" as const,
  fontWeight: "bold" as const,
  textTransform: "uppercase" as const,
  letterSpacing: "wider",
  mb: "6px",
};

const NATIVE_METHODS = [
  { id: "password" as NativeMethod, label: "Password", desc: "Email & password", Icon: MdLock },
  { id: "passkey" as NativeMethod, label: "Passkey", desc: "Biometrics or PIN", Icon: MdVpnKey },
] as const;

const NATIVE_SUBMIT_LABEL: Record<NativeMethod, string> = {
  password: "Create account",
  passkey: "Set up passkey",
};

// Google G must stay as an inline SVG — react-icons renders single-color only,
// but Google's brand guidelines require the standard multicolor mark.
function GoogleG() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908C16.418 14.013 17.64 11.807 17.64 9.2z"/>
      <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"/>
      <path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"/>
      <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"/>
    </svg>
  );
}

export default function MethodRoute() {
  const { identity } = useRegisterContext();
  const navigate = useNavigate();

  const [selectedMethod, setSelectedMethod] = useState<NativeMethod | null>(null);
  const [password, setPassword] = useState("");
  const [backupEmail, setBackupEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    if (!identity) navigate("/register", { replace: true });
  }, [identity, navigate]);

  if (!identity) return null;

  const canSubmitNative =
    selectedMethod === "password" ? !!password && !!backupEmail : !!backupEmail;

  async function handlePasskeySubmit() {
    if (!identity) return;
    setSubmitting(true);
    setSubmitError("");
    try {
      const { sessionId, options } = await passkeyRegisterStart({
        displayName: identity.displayName,
        username: identity.username,
        backupEmail,
      });
      const credential = await startRegistration({ optionsJSON: options });
      await passkeyRegisterFinish({ sessionId, credential });
      navigate("/register/pending");
    } catch (err) {
      if (err instanceof Error && err.name === "NotAllowedError") {
        setSubmitError("Passkey setup was cancelled.");
      } else {
        setSubmitError(err instanceof Error ? err.message : "Something went wrong.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <VStack spacing={5} align="stretch">
      {/* Identity summary */}
      <Box
        display="flex"
        alignItems="center"
        gap={3}
        bg="bg.input"
        borderRadius="sm"
        p={3}
        cursor="pointer"
        onClick={() => navigate("/register")}
        _hover={{ bg: "whiteAlpha.100" }}
        transition="background 0.15s"
        role="button"
        aria-label="Go back and change identity"
      >
        <Box
          w={9}
          h={9}
          borderRadius="full"
          bg="brand.500"
          display="flex"
          alignItems="center"
          justifyContent="center"
          flexShrink={0}
        >
          <Text color="white" fontWeight="bold" fontSize="sm">
            {identity.displayName.charAt(0).toUpperCase()}
          </Text>
        </Box>
        <Box flex={1} minW={0}>
          <Text color="text.primary" fontWeight="semibold" fontSize="sm" noOfLines={1}>
            {identity.displayName}
          </Text>
          <Text color="text.muted" fontSize="xs" noOfLines={1}>
            {identity.username}@yangfrenz.club
          </Text>
        </Box>
        <Text color="text.muted" fontSize="xs" flexShrink={0}>
          Change
        </Text>
      </Box>

      <VStack spacing={1} textAlign="center">
        <Heading size="lg" color="text.primary" fontWeight="bold">
          How do you want to sign up?
        </Heading>
        <Text color="text.secondary" fontSize="sm">
          Choose your preferred authentication method
        </Text>
      </VStack>

      <SimpleGrid columns={2} spacing={3}>
        {NATIVE_METHODS.map(({ id, label, desc, Icon }) => {
          const selected = selectedMethod === id;
          return (
            <Box
              key={id}
              as="button"
              onClick={() => setSelectedMethod(selected ? null : id)}
              bg={selected ? "bg.brand-subtle" : "bg.input"}
              border="2px solid"
              borderColor={selected ? "brand.500" : "transparent"}
              borderRadius="sm"
              p={4}
              textAlign="left"
              cursor="pointer"
              transition="all 0.15s"
              _hover={{ borderColor: selected ? "brand.500" : "whiteAlpha.300" }}
              w="full"
            >
              <Box color={selected ? "brand.500" : "text.muted"} mb={2}>
                <Icon />
              </Box>
              <Text color="text.primary" fontWeight="semibold" fontSize="sm">
                {label}
              </Text>
              <Text color="text.muted" fontSize="xs" mt="2px">
                {desc}
              </Text>
            </Box>
          );
        })}
      </SimpleGrid>

      {selectedMethod === "password" && (
        <FormControl>
          <FormLabel {...labelProps}>Password</FormLabel>
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Choose a strong password"
            autoFocus
          />
        </FormControl>
      )}

      {selectedMethod === "passkey" && (
        <Box bg="bg.input" borderRadius="sm" p={3}>
          <Text color="text.secondary" fontSize="xs" lineHeight="tall">
            Your browser will prompt you to register a passkey using biometrics
            or a device PIN. No password needed.
          </Text>
        </Box>
      )}

      {selectedMethod && (
        <FormControl>
          <FormLabel {...labelProps}>Backup email</FormLabel>
          <Input
            type="email"
            value={backupEmail}
            onChange={(e) => setBackupEmail(e.target.value)}
            placeholder="Used for account recovery"
            autoFocus={selectedMethod === "passkey"}
          />
        </FormControl>
      )}

      {submitError && (
        <Alert status="error" borderRadius="sm" fontSize="xs">
          <AlertIcon />
          <AlertDescription>{submitError}</AlertDescription>
        </Alert>
      )}

      {selectedMethod && (
        <Button
          variant="brand"
          isDisabled={!canSubmitNative || submitting}
          w="full"
          h={10}
          onClick={selectedMethod === "passkey" ? handlePasskeySubmit : undefined}
        >
          {submitting ? <Spinner size="sm" /> : NATIVE_SUBMIT_LABEL[selectedMethod]}
        </Button>
      )}

      <Box display="flex" alignItems="center" gap={3} py={1}>
        <Box flex={1} h="1px" bg="whiteAlpha.200" />
        <Text color="text.muted" fontSize="xs" userSelect="none">
          or continue with
        </Text>
        <Box flex={1} h="1px" bg="whiteAlpha.200" />
      </Box>

      <Button variant="google" w="full" h={10} leftIcon={<GoogleG />}>
        Continue with Google
      </Button>

      <Button variant="telegram" w="full" h={10} leftIcon={<FaTelegram size={20} />}>
        Continue with Telegram
      </Button>
    </VStack>
  );
}
