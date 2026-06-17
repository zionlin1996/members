import { createContext, useContext, useState } from "react";

export type Identity = {
  displayName: string;
  username: string;
};

type RegisterContextValue = {
  identity: Identity | null;
  setIdentity: (identity: Identity) => void;
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
    return (
      <RegisterContext.Provider value={{ identity, setIdentity }}>
        <Component {...props} />
      </RegisterContext.Provider>
    );
  };
}
