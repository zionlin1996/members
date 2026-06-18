import { Outlet } from 'react-router'
import { withRegisterContext } from '../../context/RegisterContext'
import { AuthCard } from '../../components/AuthCard'

const RegisterLayout = withRegisterContext(function RegisterLayout() {
  return (
    <AuthCard>
      <Outlet />
    </AuthCard>
  )
})

// Named export satisfies Fast Refresh — it can verify this is a React component
export default function Register() {
  return <RegisterLayout />
}
