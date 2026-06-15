
-- PROFILES
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  phone TEXT,
  address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own profile select" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "own profile insert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "own profile update" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

-- Auto create profile trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''));
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- CATEGORIES
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  image_url TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.categories TO anon, authenticated;
GRANT ALL ON public.categories TO service_role;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "categories public read" ON public.categories FOR SELECT TO anon, authenticated USING (true);

-- MENU ITEMS
CREATE TABLE public.menu_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC(10,2) NOT NULL CHECK (price >= 0),
  image_url TEXT,
  is_available BOOLEAN NOT NULL DEFAULT true,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.menu_items TO anon, authenticated;
GRANT ALL ON public.menu_items TO service_role;
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "menu public read" ON public.menu_items FOR SELECT TO anon, authenticated USING (true);

-- ORDERS
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending',
  total NUMERIC(10,2) NOT NULL CHECK (total >= 0),
  delivery_address TEXT NOT NULL,
  phone TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.orders TO authenticated;
GRANT ALL ON public.orders TO service_role;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own orders read" ON public.orders FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own orders insert" ON public.orders FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- ORDER ITEMS
CREATE TABLE public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  menu_item_id UUID REFERENCES public.menu_items(id) ON DELETE SET NULL,
  item_name TEXT NOT NULL,
  quantity INT NOT NULL CHECK (quantity > 0),
  unit_price NUMERIC(10,2) NOT NULL CHECK (unit_price >= 0)
);
GRANT SELECT, INSERT ON public.order_items TO authenticated;
GRANT ALL ON public.order_items TO service_role;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own order items read" ON public.order_items FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND o.user_id = auth.uid()));
CREATE POLICY "own order items insert" ON public.order_items FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND o.user_id = auth.uid()));

-- Seed categories
INSERT INTO public.categories (name, sort_order, image_url) VALUES
  ('Pizza', 1, 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600'),
  ('Burgers', 2, 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600'),
  ('Biryani', 3, 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=600'),
  ('Desserts', 4, 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=600'),
  ('Drinks', 5, 'https://images.unsplash.com/photo-1437418747212-8d9709afab22?w=600');

-- Seed menu items
INSERT INTO public.menu_items (category_id, name, description, price, image_url, is_featured) VALUES
  ((SELECT id FROM categories WHERE name='Pizza'), 'Margherita Pizza', 'Fresh mozzarella, tomato, basil', 899, 'https://images.unsplash.com/photo-1604068549290-dea0e4a305ca?w=600', true),
  ((SELECT id FROM categories WHERE name='Pizza'), 'Pepperoni Pizza', 'Loaded with pepperoni and cheese', 1099, 'https://images.unsplash.com/photo-1628840042765-356cda07504e?w=600', true),
  ((SELECT id FROM categories WHERE name='Pizza'), 'BBQ Chicken Pizza', 'BBQ sauce, chicken, onions', 1199, 'https://images.unsplash.com/photo-1593560708920-61dd98c46a4e?w=600', false),
  ((SELECT id FROM categories WHERE name='Burgers'), 'Classic Cheese Burger', 'Beef patty, cheese, lettuce', 599, 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600', true),
  ((SELECT id FROM categories WHERE name='Burgers'), 'Zinger Burger', 'Crispy chicken, mayo, lettuce', 549, 'https://images.unsplash.com/photo-1606131731446-5568d87113aa?w=600', false),
  ((SELECT id FROM categories WHERE name='Burgers'), 'Double Beef Burger', 'Two beef patties, double cheese', 799, 'https://images.unsplash.com/photo-1572802419224-296b0aeee0d9?w=600', false),
  ((SELECT id FROM categories WHERE name='Biryani'), 'Chicken Biryani', 'Aromatic basmati rice with chicken', 499, 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=600', true),
  ((SELECT id FROM categories WHERE name='Biryani'), 'Beef Biryani', 'Slow-cooked beef biryani', 599, 'https://images.unsplash.com/photo-1633945274309-2c16c9686a1f?w=600', false),
  ((SELECT id FROM categories WHERE name='Desserts'), 'Chocolate Lava Cake', 'Warm gooey chocolate center', 399, 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=600', true),
  ((SELECT id FROM categories WHERE name='Desserts'), 'Strawberry Cheesecake', 'Creamy cheesecake with strawberry', 449, 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=600', false),
  ((SELECT id FROM categories WHERE name='Drinks'), 'Fresh Lime Soda', 'Refreshing lime soda', 149, 'https://images.unsplash.com/photo-1437418747212-8d9709afab22?w=600', false),
  ((SELECT id FROM categories WHERE name='Drinks'), 'Mango Smoothie', 'Thick mango smoothie', 249, 'https://images.unsplash.com/photo-1546173159-315724a31696?w=600', true);
