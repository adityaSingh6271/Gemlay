'use client';

import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { FaShoppingCart, FaHeart } from 'react-icons/fa';

interface Product {
  id: number;
  name: string;
  price: number;
  image: string;
}

const randomProducts: Product[] = [
  {
    id: 1,
    name: 'Apple iPhone 14',
    price: 699,
    image: 'https://assets.superhivemarket.com/store/productimage/333360/image/385be1d77022612c27d2323091f3fbcf.png',
  },
  {
    id: 2,
    name: 'Apple iPhone 16',
    price: 799,
    image: 'https://store.storeimages.cdn-apple.com/1/as-images.apple.com/is/iphone-16-finish-select-202409-6-1inch-black_FMT_WHH?wid=1280&hei=492&fmt=p-jpg&qlt=80&.v=UXp1U3VDY3IyR1hNdHZwdFdOLzg1V0tFK1lhSCtYSGRqMUdhR284NTN4OXJ2ZmJPL0RPUUo3QVV2SDlVcFh6VGJWU3RPOURZS0RCaG1weXBRYytNTEZIMVU3blhIMm9GdXVFaFpISW1jUFBjVXh4d3Jwc2ppTG5KajBIdzdxOHVaNkR4amhRYktYVU5hSUlOMU9QbE13&traceId=1',
  },
  {
    id: 3,
    name: 'Sony WH-1000XM5',
    price: 399,
    image: 'https://cdna.artstation.com/p/assets/images/images/063/662/446/large/moyra-donnelly-shot4.jpg?1686066216',
  },
  {
    id: 4,
    name: 'MacBook Pro 16"',
    price: 2499,
    image: 'https://helios-i.mashable.com/imagery/articles/04FweyRlAWlHEUe7XZE0PCX/hero-image.fill.size_1248x702.v1730302674.png',
  },
  {
    id: 5,
    name: 'Dell XPS 13',
    price: 1399,
    image: 'https://media.karousell.com/media/photos/products/2024/5/16/dell_laptop_xps_13_9370_i78550_1715839251_1ec34d22',
  },
];

export default function Products() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [cart, setCart] = useState<number[]>([]);
  const [wishlist, setWishlist] = useState<number[]>([]);

  useEffect(() => {
    const newSocket = io('http://localhost:5000', { withCredentials: true });
    setSocket(newSocket);

    // Update cart state when cartUpdated event is received
    newSocket.on('cartUpdated', (productId: number) => {
      setCart((prev) => {
        if (!prev.includes(productId)) {
          return [...prev, productId]; // Add new product to cart
        }
        return prev; // Don't add duplicate items
      });
    });

    // Update wishlist state when wishlistUpdated event is received
    newSocket.on('wishlistUpdated', (data: { productId: number; userId: string }) => {
      setWishlist((prev) => {
        if (!prev.includes(data.productId)) {
          return [...prev, data.productId]; // Add new product to wishlist
        }
        return prev; // Don't add duplicate items
      });
    });

    return () => {
      newSocket.disconnect();
    };
  }, []);

  const handleAddToCart = (productId: number) => {
    socket?.emit('addToCart', productId, (response: { success: boolean; message: string }) => {
      if (response?.success) {
        alert(response.message);
      } else {
        alert(response?.message || 'An unexpected error occurred.');
      }
    });
  };

  const handleAddToWishlist = (productId: number) => {
    socket?.emit('addToWishlist', productId, (response: { success: boolean; message: string }) => {
      if (response?.success) {
        alert(response.message);
      } else {
        alert(response?.message || 'An unexpected error occurred.');
      }
    });
  };

  return (
    <div className="container mx-auto p-4">
      <h2 className="text-xl font-semibold mb-4">Products</h2>

      <div className="mb-4">
        <p>Cart Items: {cart.length}</p>
        <p>Wishlist Items: {wishlist.length}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {randomProducts.map((product) => (
          <div key={product.id} className="p-4 border rounded shadow">
            <img
              src={product.image}
              alt={product.name}
              className="w-full h-48 object-cover mb-4"
            />
            <h3 className="text-lg">{product.name}</h3>
            <p className="mb-4">${product.price}</p>
            <button
              onClick={() => handleAddToCart(product.id)}
              className="bg-blue-500 text-white px-4 py-2 rounded mr-2"
            >
              <FaShoppingCart /> Add to Cart
            </button>
            <button
              onClick={() => handleAddToWishlist(product.id)}
              className="bg-pink-500 text-white px-4 py-2 rounded"
            >
              <FaHeart /> Add to Wishlist
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
