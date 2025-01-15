'use client'

import { useEffect, useState } from 'react'
import { io, Socket } from 'socket.io-client'

interface Product {
  id: number
  name: string
  price: number
}

export default function Products() {
  const [isClient, setIsClient] = useState(false)
  const [products, setProducts] = useState<Product[]>([])
  const [user, setUser] = useState<any>(null)
  const [socket, setSocket] = useState<Socket | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    setIsClient(true) // Ensures client-side rendering

    const newSocket = io('http://localhost:5000')
    setSocket(newSocket)

    return () => {
      newSocket.disconnect()
    }
  }, [])

  useEffect(() => {
    if (isClient) {
      const fetchData = async () => {
        try {
          const [userData, productsData] = await Promise.all([
            fetch('http://localhost:5000/api/user', { credentials: 'include' }).then(res => res.json()),
            fetch('http://localhost:5000/api/products').then(res => res.json())
          ])
          setUser(userData)
          setProducts(productsData)
        } catch (error) {
          console.error('Error fetching data:', error)
        } finally {
          setIsLoading(false)
        }
      }

      fetchData()
    }
  }, [isClient])

  if (!isClient) {
    return <div>Loading...</div> // Client-only content loading
  }

  if (isLoading) {
    return <div>Loading...</div>
  }

  if (!user) {
    return <div>Please log in to view products</div>
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Welcome, {user.displayName || user.username}</h1>
      <h2 className="text-xl font-semibold mb-2">Products</h2>
      <ul>
        {products.map(product => (
          <li key={product.id} className="mb-4 p-4 border rounded">
            <h3 className="text-lg font-semibold">{product.name}</h3>
            <p className="mb-2">Price: ${product.price}</p>
            <div className="flex space-x-2">
              <button
                onClick={() => socket?.emit('addToCart', product.id)}
                className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
              >
                Add to Cart
              </button>
              <button
                onClick={() => socket?.emit('addToWishlist', product.id)}
                className="bg-pink-500 hover:bg-pink-600 text-white font-bold py-2 px-4 rounded"
              >
                Add to Wishlist
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
