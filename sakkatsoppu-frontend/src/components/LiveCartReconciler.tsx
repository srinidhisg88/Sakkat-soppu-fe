import { useCart } from '../context/CartContext';
import { useStockSubscription } from '../hooks/useStockSubscription';
import { useCartAutoReconcile } from '../hooks/useCartAutoReconcile';

// Mount this once at app-level so stock clamping and notifications happen
// even when the user isn't on Cart/Checkout pages.
export default function LiveCartReconciler() {
  const { items } = useCart();
  useStockSubscription(items.map(i => i.product._id));
  useCartAutoReconcile({ enabled: true });
  return null;
}
