import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import toast from 'react-hot-toast'
import { authAPI } from '../services/api'

const schema = z.object({
  username: z.string().min(2, 'Tên đăng nhập tối thiểu 2 ký tự'),
  email: z.string().email({ message: 'Email không hợp lệ' }),
  password: z.string().min(6, 'Mật khẩu tối thiểu 6 ký tự'),
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
      toast.success('Đã tạo tài khoản — vui lòng đăng nhập')
      nav('/login', { replace: true })
    } catch (e) {
      toast.error(e.response?.data?.error || 'Đăng ký thất bại')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <h1 className="text-2xl font-semibold text-slate-900">Tạo tài khoản</h1>
      <p className="mt-1 text-sm text-slate-600">
        Đã có tài khoản?{' '}
        <Link to="/login" className="text-primary-600 font-medium">
          Đăng nhập
        </Link>
      </p>
      <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700">Tên đăng nhập</label>
          <input className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" {...register('username')} />
          {errors.username && <p className="text-sm text-red-600 mt-1">{errors.username.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Thư điện tử</label>
          <input type="email" className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" {...register('email')} />
          {errors.email && <p className="text-sm text-red-600 mt-1">{errors.email.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Mật khẩu</label>
          <input type="password" className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" {...register('password')} />
          {errors.password && <p className="text-sm text-red-600 mt-1">{errors.password.message}</p>}
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-primary-600 py-2.5 font-medium text-white hover:bg-primary-700 disabled:opacity-50"
        >
          {loading ? 'Đang tạo…' : 'Đăng ký'}
        </button>
      </form>
    </div>
  )
}
