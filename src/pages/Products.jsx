import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import ProductCard from '../components/products/ProductCard';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, SlidersHorizontal, Package } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

const categories = ['todos', 'eletronicos', 'moda', 'casa', 'beleza', 'esporte', 'games', 'livros', 'outros'];

export default function Products() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('todos');
  const [sortBy, setSortBy] = useState('score');

  const { data: products = [], isLoading: productsLoading } = useQuery({
    queryKey: ['products'],
    queryFn: () => base44.entities.Product.list('-reliability_score', 100),
  });

  const { data: prices = [] } = useQuery({
    queryKey: ['prices'],
    queryFn: () => base44.entities.Price.list('-created_date', 500),
  });

  const pricesByProduct = prices.reduce((acc, price) => {
    if (!acc[price.product_id]) acc[price.product_id] = [];
    acc[price.product_id].push(price);
    return acc;
  }, {});

  const filteredProducts = products
    .filter(p => {
      const matchSearch = !search || p.name?.toLowerCase().includes(search.toLowerCase()) || p.brand?.toLowerCase().includes(search.toLowerCase());
      const matchCategory = category === 'todos' || p.category === category;
      return matchSearch && matchCategory;
    })
    .sort((a, b) => {
      if (sortBy === 'score') return (b.reliability_score || 0) - (a.reliability_score || 0);
      if (sortBy === 'name') return (a.name || '').localeCompare(b.name || '');
      const priceA = pricesByProduct[a.id]?.sort((x, y) => x.price - y.price)[0]?.price || Infinity;
      const priceB = pricesByProduct[b.id]?.sort((x, y) => x.price - y.price)[0]?.price || Infinity;
      return priceA - priceB;
    });

  return (
    <div className="min-h-screen p-4 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight">Produtos</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {products.length} produtos monitorados • Ordenados por confiabilidade
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar produtos ou marcas..."
              className="pl-9 bg-card"
            />
          </div>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="w-full sm:w-40 bg-card">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {categories.map(c => (
                <SelectItem key={c} value={c}>
                  {c === 'todos' ? 'Todas categorias' : c.charAt(0).toUpperCase() + c.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-full sm:w-40 bg-card">
              <SlidersHorizontal className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="score">Confiabilidade</SelectItem>
              <SelectItem value="price">Menor preço</SelectItem>
              <SelectItem value="name">Nome A-Z</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Grid */}
        {productsLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array(8).fill(0).map((_, i) => (
              <div key={i} className="bg-card border border-border rounded-2xl overflow-hidden">
                <Skeleton className="aspect-square" />
                <div className="p-4 space-y-3">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-5 w-full" />
                  <Skeleton className="h-3 w-32" />
                  <Skeleton className="h-6 w-24" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="h-16 w-16 rounded-2xl bg-secondary flex items-center justify-center">
              <Package className="h-8 w-8 text-muted-foreground" />
            </div>
            <div className="text-center">
              <h3 className="font-semibold">Nenhum produto encontrado</h3>
              <p className="text-sm text-muted-foreground mt-1">Tente ajustar os filtros de busca</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredProducts.map(product => (
              <ProductCard
                key={product.id}
                product={product}
                prices={pricesByProduct[product.id] || []}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}