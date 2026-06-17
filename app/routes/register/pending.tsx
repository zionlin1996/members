import { Heading, Text, VStack } from "@chakra-ui/react";
import { useRegisterContext } from "../../context/RegisterContext";

export default function PendingRoute() {
  const { identity } = useRegisterContext();

  return (
    <VStack spacing={4} textAlign="center" py={4}>
      <Text fontSize="3xl">🎉</Text>
      <Heading size="md" color="text.primary">
        Account created!
      </Heading>
      <Text color="text.secondary" fontSize="sm" lineHeight="tall">
        {identity
          ? `${identity.username}@yangfrenz.club is pending admin approval.`
          : "Your account is pending admin approval."}
        {" "}You'll be notified at your backup email once it's activated.
      </Text>
    </VStack>
  );
}
