import { createContext, useContext, useState } from "react";

export type Identity = {
  displayName: string;
  username: string;
};

export type AuthMethod = "password" | "passkey";

type RegisterContextValue = {
  identity: Identity | null;
  setIdentity: (identity: Identity) => void;
  method: AuthMethod | null;
  setMethod: (method: AuthMethod | null) => void;
};

const RegisterContext = createContext<RegisterContextValue | null>(null);

export function useRegisterContext() {
  const ctx = useContext(RegisterContext);
  if (!ctx) throw new Error("useRegisterContext must be used within withRegisterContext");
  return ctx;
}

export function withRegisterContext<P extends object>(
  Component: React.ComponentType<P>
) {
  return function WithRegisterContext(props: P) {
    const [identity, setIdentity] = useState<Identity | null>(null);
    const [method, setMethod] = useState<AuthMethod | null>(null);
    return (
      <RegisterContext.Provider value={{ identity, setIdentity, method, setMethod }}>
        <Component {...props} />
      </RegisterContext.Provider>
    );
  };
}
