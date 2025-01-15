import Link from 'next/link'

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="text-4xl font-bold mb-8">Welcome to Auth and Shop</h1>
      <div className="flex space-x-4">
        <Link href="http://localhost:5000/auth/google" className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded">
          Login with Google
        </Link>
        <Link href="http://localhost:5000/auth/github" className="bg-gray-800 hover:bg-gray-900 text-white font-bold py-2 px-4 rounded">
          Login with GitHub
        </Link>
      </div>
    </main>
  )
}

