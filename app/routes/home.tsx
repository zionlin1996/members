import { useEffect, useState } from "react";
import {
  Box,
  Button,
  FormControl,
  FormErrorMessage,
  FormHelperText,
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
import { deriveUsername, isValidUsername } from "../libs/username";

type AvailabilityStatus = "idle" | "checking" | "available" | "taken" | "error";

type Step = "identity" | "method";
type NativeMethod = "password" | "passkey";

// ── Module-level constants (never rebuilt on render) ───────────────────────

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

// ── Component ──────────────────────────────────────────────────────────────

export default function Home() {
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [availability, setAvailability] = useState<AvailabilityStatus>("idle");
  const [step, setStep] = useState<Step>("identity");
  const [selectedMethod, setSelectedMethod] = useState<NativeMethod | null>(null);
  const [password, setPassword] = useState("");
  const [backupEmail, setBackupEmail] = useState("");

  function handleDisplayNameChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value;
    setDisplayName(value);
    setUsername(deriveUsername(value));
    setAvailability("idle");
  }

  function handleUsernameChange(e: React.ChangeEvent<HTMLInputElement>) {
    setUsername(e.target.value);
    setAvailability("idle");
  }

  useEffect(() => {
    if (!username || !isValidUsername(username)) return;

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setAvailability("checking");
      try {
        const res = await fetch(
          `${import.meta.env.VITE_API_URL}/auth/availability?username=${encodeURIComponent(username)}`,
          { signal: controller.signal }
        );
        const data = await res.json();
        setAvailability(data.username?.available ? "available" : "taken");
      } catch (err) {
        if (err instanceof Error && err.name !== "AbortError") {
          setAvailability("error");
        }
      }
    }, 400);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [username]);

  const formatError =
    username && !isValidUsername(username)
      ? "Only lowercase letters, numbers, and . – _ separators"
      : "";
  const isUsernameInvalid = !!formatError || availability === "taken";
  const usernameRing = isUsernameInvalid
    ? "0 0 0 2px var(--chakra-colors-red-400)"
    : availability === "available"
    ? "0 0 0 2px var(--chakra-colors-green-400)"
    : undefined;
  const canContinue = availability === "available" && !formatError;

  const canSubmitNative =
    selectedMethod === "password"
      ? !!password && !!backupEmail
      : !!backupEmail;

  return (
    <Box
      minH="100vh"
      display="flex"
      alignItems="center"
      justifyContent="center"
      px={4}
    >
      <Box
        bg="bg.base"
        borderRadius="md"
        p={8}
        w="full"
        maxW="440px"
        boxShadow="0 2px 10px 0 rgba(0,0,0,.4)"
      >
        {/* ── Step 1: Identity ── */}
        {step === "identity" && (
          <>
            <VStack spacing={2} mb={6} textAlign="center">
              <Heading size="xl" color="text.primary" fontWeight="bold">
                Create your account
              </Heading>
              <Text color="text.secondary" fontSize="sm">
                Pick a display name to get started
              </Text>
            </VStack>

            <VStack spacing={5} align="stretch">
              <FormControl>
                <FormLabel {...labelProps}>Display name</FormLabel>
                <Input
                  value={displayName}
                  onChange={handleDisplayNameChange}
                  placeholder="e.g. John Doe"
                  autoFocus
                />
              </FormControl>

              <FormControl isInvalid={isUsernameInvalid}>
                <FormLabel {...labelProps}>Username</FormLabel>
                <Box
                  display="flex"
                  alignItems="center"
                  bg="bg.input"
                  borderRadius="sm"
                  h={10}
                  boxShadow={usernameRing}
                  _focusWithin={{
                    boxShadow: usernameRing ?? "0 0 0 2px var(--chakra-colors-brand-500)",
                  }}
                  transition="box-shadow 0.15s"
                >
                  <Input
                    value={username}
                    onChange={handleUsernameChange}
                    placeholder="john.doe"
                    maxLength={64}
                    bg="transparent"
                    border="none"
                    borderRadius="sm"
                    color="text.primary"
                    _placeholder={{ color: "text.muted" }}
                    _focus={{ boxShadow: "none" }}
                    h="full"
                    flex={1}
                  />
                  {availability === "checking" && (
                    <Spinner size="xs" color="text.muted" mr={2} flexShrink={0} />
                  )}
                  <Text
                    color="text.muted"
                    fontSize="sm"
                    pr={4}
                    flexShrink={0}
                    userSelect="none"
                    whiteSpace="nowrap"
                  >
                    @yangfrenz.club
                  </Text>
                </Box>

                {formatError && (
                  <FormErrorMessage fontSize="xs">{formatError}</FormErrorMessage>
                )}
                {!formatError && availability === "taken" && (
                  <FormErrorMessage fontSize="xs">
                    {username} is already taken
                  </FormErrorMessage>
                )}
                {!formatError && availability === "available" && (
                  <FormHelperText color="green.400" fontSize="xs" mt={1}>
                    {username} is available
                  </FormHelperText>
                )}
                {!formatError && availability === "error" && (
                  <FormHelperText color="text.muted" fontSize="xs" mt={1}>
                    Could not check availability — please try again
                  </FormHelperText>
                )}
              </FormControl>

              <Button
                variant="brand"
                isDisabled={!canContinue}
                w="full"
                h={10}
                onClick={() => setStep("method")}
              >
                Continue
              </Button>
            </VStack>
          </>
        )}

        {/* ── Step 2: Auth method ── */}
        {step === "method" && (
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
              onClick={() => setStep("identity")}
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
                  {displayName.charAt(0).toUpperCase()}
                </Text>
              </Box>
              <Box flex={1} minW={0}>
                <Text color="text.primary" fontWeight="semibold" fontSize="sm" noOfLines={1}>
                  {displayName}
                </Text>
                <Text color="text.muted" fontSize="xs" noOfLines={1}>
                  {username}@yangfrenz.club
                </Text>
              </Box>
              <Text color="text.muted" fontSize="xs" flexShrink={0}>
                Change
              </Text>
            </Box>

            <VStack spacing={1} textAlign="center" py={3}>
              <Heading size="md" color="text.primary" fontWeight="bold">
                How do you want to sign up?
              </Heading>
              <Text color="text.secondary" fontSize="sm">
                Choose your preferred authentication method
              </Text>
            </VStack>

            {/* ── Native methods ── */}
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

            {/* Method-specific fields */}
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
                  Your browser will prompt you to register a passkey using
                  biometrics or a device PIN. No password needed.
                </Text>
              </Box>
            )}

            {/* Backup email — shared by both native methods */}
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

            {selectedMethod && (
              <Button variant="brand" isDisabled={!canSubmitNative} w="full" h={10}>
                {NATIVE_SUBMIT_LABEL[selectedMethod]}
              </Button>
            )}

            {/* ── Divider ── */}
            <Box display="flex" alignItems="center" gap={3} py={1}>
              <Box flex={1} h="1px" bg="whiteAlpha.200" />
              <Text color="text.muted" fontSize="xs" userSelect="none">
                or continue with
              </Text>
              <Box flex={1} h="1px" bg="whiteAlpha.200" />
            </Box>

            {/* ── Google — dark variant per brand guidelines ── */}
            <Button variant="google" w="full" h={10} leftIcon={<GoogleG />}>
              Continue with Google
            </Button>

            {/* ── Telegram — brand blue ── */}
            <Button variant="telegram" w="full" h={10} leftIcon={<FaTelegram size={20} />}>
              Continue with Telegram
            </Button>
          </VStack>
        )}
      </Box>
    </Box>
  );
}
