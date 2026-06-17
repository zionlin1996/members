import { Outlet } from "react-router";
import { Box } from "@chakra-ui/react";
import { withRegisterContext } from "../../context/RegisterContext";

const RegisterLayout = withRegisterContext(function RegisterLayout() {
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
        <Outlet />
      </Box>
    </Box>
  );
});

// Named export satisfies Fast Refresh — it can verify this is a React component
export default function Register() {
  return <RegisterLayout />;
}
