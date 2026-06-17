import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import {
  Alert,
  AlertDescription,
  AlertIcon,
  Box,
  Button,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Heading,
  Input,
  Spinner,
  Text,
  VStack,
  useToast,
} from "@chakra-ui/react";
import { MdArrowBack } from "react-icons/md";
import { startRegistration } from "@simplewebauthn/browser";
import { useRegisterContext } from "../../context/RegisterContext";
import type { Identity } from "../../context/RegisterContext";
import {
  passwordRegister,
  passkeyRegisterStart,
  passkeyRegisterFinish,
} from "../../libs/api";
import { DOMAIN } from "../../libs/constants";

// ── Shared form primitives ─────────────────────────────────────────────────

const BackButton = () => {
  const { setMethod } = useRegisterContext();
  const navigate = useNavigate();
  return (
    <Button
      variant="ghost"
      size="sm"
      alignSelf="flex-start"
      leftIcon={<MdArrowBack />}
      onClick={() => { setMethod(null); navigate("/register/method"); }}
      color="text.muted"
      _hover={{ bg: "whiteAlpha.100" }}
      px={2}
    >
      Back
    </Button>
  );
};

const BackupEmailInput = ({
  value,
  onChange,
  error,
}: {
  value: string;
  onChange: (v: string) => void;
  error?: string;
}) =>(
    <span style={{ display: "block" }}>
      <FormControl>
        <FormLabel>Backup email</FormLabel>
        <Input
          type="email"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Used for account recovery"
        />
      </FormControl>
      {error && (
        <Alert status="error" borderRadius="sm" fontSize="xs">
          <AlertIcon /><AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </span>
  )

const SubmitButton = ({
  children,
  disabled,
  loading,
  onClick,
}: React.PropsWithChildren<{
  disabled: boolean;
  loading: boolean;
  onClick: () => Promise<void>;
}>) => (
  <Button variant="brand" w="full" isDisabled={disabled || loading} onClick={onClick}>
    {loading ? <Spinner size="sm" /> : children}
  </Button>
);

// ── Forms ──────────────────────────────────────────────────────────────────

type FormProps = {
  identity: Identity;
  onSuccess: () => void;
};

const PasswordForm = ({ identity, onSuccess }: FormProps) => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [backupEmail, setBackupEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const passwordsMatch = !confirmPassword || password === confirmPassword;
  const canSubmit = !!password && !!confirmPassword && passwordsMatch && !!backupEmail;

  async function handleSubmit() {
    setSubmitting(true);
    setError("");
    try {
      await passwordRegister({
        displayName: identity.displayName,
        username: identity.username,
        password,
        backupEmail,
      });
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setSubmitting(false);
    }
  }

  return (
    <VStack spacing={5} align="stretch">
      <BackButton />
      <VStack spacing={1} textAlign="center">
        <Heading size="md" color="text.primary">Set a password</Heading>
        <Text color="text.secondary" fontSize="sm">for {identity.username}@{DOMAIN}</Text>
      </VStack>
      <FormControl>
        <FormLabel>Password</FormLabel>
        <Input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Choose a strong password"
          autoFocus
        />
      </FormControl>
      <FormControl isInvalid={!passwordsMatch}>
        <FormLabel>Confirm password</FormLabel>
        <Input
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Repeat your password"
        />
        <FormErrorMessage fontSize="xs">Passwords do not match</FormErrorMessage>
      </FormControl>
      <BackupEmailInput value={backupEmail} onChange={setBackupEmail} error={error} />
      <SubmitButton disabled={!canSubmit} loading={submitting} onClick={handleSubmit}>
        Create account
      </SubmitButton>
    </VStack>
  );
}

const PasskeyForm = ({ identity, onSuccess }: FormProps) => {
  const [backupEmail, setBackupEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit() {
    setSubmitting(true);
    setError("");
    try {
      const { sessionId, options } = await passkeyRegisterStart({
        displayName: identity.displayName,
        username: identity.username,
        backupEmail,
      });
      const credential = await startRegistration({ optionsJSON: options });
      await passkeyRegisterFinish({ sessionId, credential });
      onSuccess();
    } catch (err) {
      if (err instanceof Error && err.name === "NotAllowedError") {
        setError("Passkey setup was cancelled.");
      } else {
        setError(err instanceof Error ? err.message : "Something went wrong.");
      }
      setSubmitting(false);
    }
  }

  return (
    <VStack spacing={5} align="stretch">
      <BackButton />
      <VStack spacing={1} textAlign="center">
        <Heading size="md" color="text.primary">Set up a passkey</Heading>
        <Text color="text.secondary" fontSize="sm">for {identity.username}@{DOMAIN}</Text>
      </VStack>
      <Box bg="bg.input" borderRadius="sm" p={3}>
        <Text color="text.secondary" fontSize="xs" lineHeight="tall">
          Your browser will prompt you to register a passkey using biometrics or a device PIN. No password needed.
        </Text>
      </Box>
      <BackupEmailInput value={backupEmail} onChange={setBackupEmail} error={error} />
      <SubmitButton disabled={!backupEmail} loading={submitting} onClick={handleSubmit}>
        Set up passkey
      </SubmitButton>
    </VStack>
  );
}

// ── Route ──────────────────────────────────────────────────────────────────

const SetupRoute = () => {
  const { identity, method } = useRegisterContext();
  const navigate = useNavigate();
  const toast = useToast();
  const redirectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!identity) navigate("/register", { replace: true });
    else if (!method) navigate("/register/method", { replace: true });
  }, [identity, method, navigate]);

  useEffect(() => {
    return () => {
      if (redirectTimer.current) clearTimeout(redirectTimer.current);
    };
  }, []);

  if (!identity || !method) return null;

  function handleSuccess() {
    toast({
      title: "Account created!",
      description: `${identity!.username}@${DOMAIN} is pending admin approval. You'll be notified at your backup email once it's activated.`,
      status: "success",
      duration: 5000,
      isClosable: true,
    });
    redirectTimer.current = setTimeout(() => navigate("/"), 5000);
  }

  const FormComponent = method === "password" ? PasswordForm : PasskeyForm;

  return <FormComponent identity={identity} onSuccess={handleSuccess} />;
}

export default SetupRoute