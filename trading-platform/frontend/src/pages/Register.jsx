import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import toast from 'react-hot-toast'
import { authAPI } from '../services/api'

const schema = z.object({
  username: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6, 'At least 6 characters'),
})

export default function Register() {
  const nav = useNavigate()
  const [loading, setLoading] = useState(false)
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: zodResolver(schema) })

  const onSubmit = async (data) => {
    setLoading(true)
    try {
      await authAPI.register(data)
      toast.success('Account created — sign in')
      nav('/login', { replace: true })
    } catch (e) {
      toast.error(e.response?.data?.error || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <h1 className="text-2xl font-semibold text-slate-900">Create account</h1>
      <p className="mt-1 text-sm text-slate-600">
        Already have one?{' '}
        <Link to="/login" className="text-primary-600 font-medium">
          Sign in
        </Link>
      </p>
      <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700">Username</label>
          <input className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" {...register('username')} />
          {errors.username && <p className="text-sm text-red-600 mt-1">{errors.username.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Email</label>
          <input type="email" className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" {...register('email')} />
          {errors.email && <p className="text-sm text-red-600 mt-1">{errors.email.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Password</label>
          <input type="password" className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" {...register('password')} />
          {errors.password && <p className="text-sm text-red-600 mt-1">{errors.password.message}</p>}
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-primary-600 py-2.5 font-medium text-white hover:bg-primary-700 disabled:opacity-50"
        >
          {loading ? 'Creating…' : 'Register'}
        </button>
      </form>
    </div>
  )
}
