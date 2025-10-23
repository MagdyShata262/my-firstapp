export interface Product {
  id: number;
  title: string;
  price: number;
  description: string;
  category: string;
  image: string;
  rating?: {
    // إضافة اختيارية بناءً على API الحقيقي
    rate: number;
    count: number;
  };
}
