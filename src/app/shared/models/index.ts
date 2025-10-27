export interface Product {
  id: number;
  title: string;
  price: number;
  description: string;
  category: string;
  image: string;
  rating?: {
    rate: number;
    count: number;
  };
}

export interface Cart {
  id: number;
  userId: number;
  date: string;
  products: CartItem[];
}

export interface CartItem {
  productId: number;
  quantity: number;
  // يمكنك إضافة اسم المنتج والسعر هنا لتسهيل العرض (أو استخراجها من ProductsState)
}
export interface CartResponse {
  id: number;
  userId: number;
  date: string;
  products: {
    productId: number;
    quantity: number;
  }[];
}

export interface UpdateCartRequest {
  products: {
    productId: number;
    quantity: number;
  }[];
}
