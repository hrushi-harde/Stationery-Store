import { useState } from 'react'
import { toast } from 'react-toastify'
import { useDispatch } from 'react-redux'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { login } from '../redux/Slices/AuthSlice'
import { loginUser } from '../services/api'
import './Auth.css'

const Login = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const location = useLocation()

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!email) return
    setSubmitting(true)

    try {
      const session = await loginUser({ email, password })
      dispatch(login(session))
      const redirect = session.user?.role === 'owner'
        ? '/owner'
        : location.state?.from?.pathname || '/'
      navigate(redirect)
    } catch (apiError) {
      toast.error(apiError.message || 'Invalid email or password')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="auth-page">
      <form className="auth-card" onSubmit={handleSubmit}>
        <h1>Welcome Back</h1>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
        />
        {/* errors shown via toast */}
        <button type="submit" disabled={submitting}>
          {submitting ? 'Signing in...' : 'Login'}
        </button>
        <p>
          New here? <Link to="/signin">Create an account</Link>
        </p>
      </form>
    </div>
  )
}

export default Login
