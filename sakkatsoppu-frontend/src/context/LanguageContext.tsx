import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Language = 'en' | 'hi' | 'kn';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const translations = {
  en: {
    // Navbar
    'nav.home': 'Home',
    'nav.products': 'Products',
    'nav.aboutUs': 'About Us',
    'nav.cart': 'Cart',
    'nav.orders': 'Orders',
    'nav.profile': 'Profile',
    'nav.login': 'Login',
    'nav.logout': 'Logout',
    'nav.signup': 'Sign Up',

    // Profile
    'profile.title': 'Profile',
    'profile.accountOverview': 'Account Overview',
    'profile.myProfile': 'My Profile',
    'profile.myOrders': 'My Orders',
    'profile.changeLanguage': 'Change Language',
    'profile.editProfile': 'Edit Profile',
    'profile.fullName': 'Full Name',
    'profile.phoneNumber': 'Phone Number',
    'profile.address': 'Address',
    'profile.saveChanges': 'Save Changes',
    'profile.cancel': 'Cancel',
    'profile.updateSuccess': 'Profile updated successfully',
    'profile.updateError': 'Failed to update profile',
    'profile.editAddress': 'Edit Address',
    'profile.noAddressSet': 'No address set',

    // Language Settings
    'language.title': 'Select Language',
    'language.english': 'English',
    'language.hindi': 'हिंदी (Hindi)',
    'language.kannada': 'ಕನ್ನಡ (Kannada)',
    'language.selectLanguage': 'Select your preferred language',

    // Common
    'common.loading': 'Loading...',
    'common.save': 'Save',
    'common.close': 'Close',
    'common.confirm': 'Confirm',
    'common.apply': 'Apply',

    // Checkout
    'checkout.title': 'Checkout',
    'checkout.deliveryDetails': 'Delivery Details',
    'checkout.orderSummary': 'Order Summary',
    'checkout.placeOrder': 'Place Order',
    'checkout.editAddress': 'Edit Address',
    'checkout.applyCoupon': 'Apply Coupon',
    'checkout.paymentMethod': 'Payment Method',
    'checkout.cod': 'Cash on Delivery / UPI on Delivery',
    'checkout.subtotal': 'Subtotal',
    'checkout.delivery': 'Delivery',
    'checkout.total': 'Total',
    'checkout.free': 'Free',
    'checkout.phoneNumber': 'Phone Number',
    'checkout.deliveryAddress': 'Delivery Address',
    'checkout.locationConfirmed': 'Location confirmed',
    'checkout.placingOrder': 'Placing Order...',
    'checkout.freeDeliveryOver': 'Free delivery over',
    'checkout.addMoreForMin': 'Add ₹{amount} more to reach minimum order value',
    'checkout.totalPayable': 'Total Payable',
    'checkout.appliedCoupon': 'Applied {code}. You save ₹{amount}',
    'checkout.stockIssues': 'Stock issues',
    'checkout.itemsAffected': '{count} item(s) affected',
    'checkout.payment': 'Payment',
    'checkout.qty': 'Qty',
    'checkout.each': 'Each',
    'checkout.total2': 'Total',
    'checkout.pcs': 'pcs',
    'checkout.removedDueToStock': 'Removed due to stock',
    'checkout.cart': 'Cart',
    'checkout.noAddressSet': 'No address set',
    'checkout.completeAddress': 'Complete Your Address',
    'checkout.enterPhoneNumber': 'Enter 10-digit mobile number',
    'checkout.phoneNumberLabel': '10-digit mobile number',

    // Cart
    'cart.title': 'Shopping Cart',
    'cart.empty': 'Your cart is empty',
    'cart.continueShopping': 'Continue Shopping',
    'cart.checkout': 'Proceed to Checkout',
    'cart.quantity': 'Qty',
    'cart.remove': 'Remove',
    'cart.total': 'Total',
    'cart.items': 'items',
    'cart.item': 'item',

    // Orders
    'orders.title': 'My Orders',
    'orders.noOrders': 'No orders yet',
    'orders.startShopping': 'Start Shopping',
    'orders.orderPlaced': 'Order Placed',
    'orders.status': 'Status',
    'orders.total': 'Total',
    'orders.viewDetails': 'View Details',
    'orders.pending': 'Pending',
    'orders.confirmed': 'Confirmed',
    'orders.processing': 'Processing',
    'orders.shipped': 'Shipped',
    'orders.delivered': 'Delivered',
    'orders.cancelled': 'Cancelled',

    // Products
    'products.addToCart': 'Add to Cart',
    'products.outOfStock': 'Out of Stock',
    'products.lowStock': 'Low Stock',
    'products.inStock': 'In Stock',
    'products.viewDetails': 'View Details',
    'products.price': 'Price',
    'products.quantity': 'Quantity',
    'products.search': 'Search products...',
    'products.noProducts': 'No products found',
    'products.categories': 'Categories',
    'products.allProducts': 'All Products',
  },
  hi: {
    // Navbar
    'nav.home': 'होम',
    'nav.products': 'उत्पाद',
    'nav.aboutUs': 'हमारे बारे में',
    'nav.cart': 'कार्ट',
    'nav.orders': 'ऑर्डर',
    'nav.profile': 'प्रोफ़ाइल',
    'nav.login': 'लॉगिन',
    'nav.logout': 'लॉगआउट',
    'nav.signup': 'साइन अप',

    // Profile
    'profile.title': 'प्रोफ़ाइल',
    'profile.accountOverview': 'खाता अवलोकन',
    'profile.myProfile': 'मेरी प्रोफ़ाइल',
    'profile.myOrders': 'मेरे ऑर्डर',
    'profile.changeLanguage': 'भाषा बदलें',
    'profile.editProfile': 'प्रोफ़ाइल संपादित करें',
    'profile.fullName': 'पूरा नाम',
    'profile.phoneNumber': 'फ़ोन नंबर',
    'profile.address': 'पता',
    'profile.saveChanges': 'परिवर्तन सहेजें',
    'profile.cancel': 'रद्द करें',
    'profile.updateSuccess': 'प्रोफ़ाइल सफलतापूर्वक अपडेट किया गया',
    'profile.updateError': 'प्रोफ़ाइल अपडेट करने में विफल',
    'profile.editAddress': 'पता संपादित करें',
    'profile.noAddressSet': 'कोई पता सेट नहीं है',

    // Language Settings
    'language.title': 'भाषा चुनें',
    'language.english': 'English (अंग्रेज़ी)',
    'language.hindi': 'हिंदी',
    'language.kannada': 'ಕನ್ನಡ (कन्नड़)',
    'language.selectLanguage': 'अपनी पसंदीदा भाषा चुनें',

    // Common
    'common.loading': 'लोड हो रहा है...',
    'common.save': 'सहेजें',
    'common.close': 'बंद करें',
    'common.confirm': 'पुष्टि करें',
    'common.apply': 'लागू करें',

    // Checkout
    'checkout.title': 'चेकआउट',
    'checkout.deliveryDetails': 'डिलीवरी विवरण',
    'checkout.orderSummary': 'ऑर्डर सारांश',
    'checkout.placeOrder': 'ऑर्डर करें',
    'checkout.editAddress': 'पता संपादित करें',
    'checkout.applyCoupon': 'कूपन लागू करें',
    'checkout.paymentMethod': 'भुगतान का तरीका',
    'checkout.cod': 'कैश ऑन डिलीवरी / यूपीआई ऑन डिलीवरी',
    'checkout.subtotal': 'उपयोग',
    'checkout.delivery': 'डिलीवरी',
    'checkout.total': 'कुल',
    'checkout.free': 'मुफ़्त',
    'checkout.phoneNumber': 'फ़ोन नंबर',
    'checkout.deliveryAddress': 'डिलीवरी पता',
    'checkout.locationConfirmed': 'स्थान पुष्टि की गई',
    'checkout.placingOrder': 'ऑर्डर किया जा रहा है...',
    'checkout.freeDeliveryOver': 'मुफ़्त डिलीवरी',
    'checkout.addMoreForMin': 'न्यूनतम ऑर्डर मूल्य के लिए ₹{amount} और जोड़ें',
    'checkout.totalPayable': 'कुल देय',
    'checkout.appliedCoupon': '{code} लागू किया गया। आप ₹{amount} बचाते हैं',
    'checkout.stockIssues': 'स्टॉक समस्याएं',
    'checkout.itemsAffected': '{count} आइटम प्रभावित',
    'checkout.payment': 'भुगतान',
    'checkout.qty': 'मात्रा',
    'checkout.each': 'प्रत्येक',
    'checkout.total2': 'कुल',
    'checkout.pcs': 'पीसी',
    'checkout.removedDueToStock': 'स्टॉक के कारण हटाया गया',
    'checkout.cart': 'कार्ट',
    'checkout.noAddressSet': 'कोई पता सेट नहीं है',
    'checkout.completeAddress': 'अपना पता पूरा करें',
    'checkout.enterPhoneNumber': '10 अंकों का मोबाइल नंबर दर्ज करें',
    'checkout.phoneNumberLabel': '10 अंकों का मोबाइल नंबर',

    // Cart
    'cart.title': 'शॉपिंग कार्ट',
    'cart.empty': 'आपकी कार्ट खाली है',
    'cart.continueShopping': 'खरीदारी जारी रखें',
    'cart.checkout': 'चेकआउट पर जाएं',
    'cart.quantity': 'मात्रा',
    'cart.remove': 'हटाएं',
    'cart.total': 'कुल',
    'cart.items': 'आइटम',
    'cart.item': 'आइटम',

    // Orders
    'orders.title': 'मेरे ऑर्डर',
    'orders.noOrders': 'अभी तक कोई ऑर्डर नहीं',
    'orders.startShopping': 'खरीदारी शुरू करें',
    'orders.orderPlaced': 'ऑर्डर दिया गया',
    'orders.status': 'स्थिति',
    'orders.total': 'कुल',
    'orders.viewDetails': 'विवरण देखें',
    'orders.pending': 'लंबित',
    'orders.confirmed': 'पुष्टि की गई',
    'orders.processing': 'प्रसंस्करण',
    'orders.shipped': 'भेज दिया गया',
    'orders.delivered': 'वितरित',
    'orders.cancelled': 'रद्द',

    // Products
    'products.addToCart': 'कार्ट में जोड़ें',
    'products.outOfStock': 'स्टॉक में नहीं',
    'products.lowStock': 'कम स्टॉक',
    'products.inStock': 'स्टॉक में',
    'products.viewDetails': 'विवरण देखें',
    'products.price': 'कीमत',
    'products.quantity': 'मात्रा',
    'products.search': 'उत्पाद खोजें...',
    'products.noProducts': 'कोई उत्पाद नहीं मिला',
    'products.categories': 'श्रेणियाँ',
    'products.allProducts': 'सभी उत्पाद',
  },
  kn: {
    // Navbar
    'nav.home': 'ಮನೆ',
    'nav.products': 'ಉತ್ಪನ್ನಗಳು',
    'nav.aboutUs': 'ನಮ್ಮ ಬಗ್ಗೆ',
    'nav.cart': 'ಕಾರ್ಟ್',
    'nav.orders': 'ಆರ್ಡರ್‌ಗಳು',
    'nav.profile': 'ಪ್ರೊಫೈಲ್',
    'nav.login': 'ಲಾಗಿನ್',
    'nav.logout': 'ಲಾಗೌಟ್',
    'nav.signup': 'ಸೈನ್ ಅಪ್',

    // Profile
    'profile.title': 'ಪ್ರೊಫೈಲ್',
    'profile.accountOverview': 'ಖಾತೆ ಅವಲೋಕನ',
    'profile.myProfile': 'ನನ್ನ ಪ್ರೊಫೈಲ್',
    'profile.myOrders': 'ನನ್ನ ಆರ್ಡರ್‌ಗಳು',
    'profile.changeLanguage': 'ಭಾಷೆ ಬದಲಿಸಿ',
    'profile.editProfile': 'ಪ್ರೊಫೈಲ್ ಸಂಪಾದಿಸಿ',
    'profile.fullName': 'ಪೂರ್ಣ ಹೆಸರು',
    'profile.phoneNumber': 'ಫೋನ್ ಸಂಖ್ಯೆ',
    'profile.address': 'ವಿಳಾಸ',
    'profile.saveChanges': 'ಬದಲಾವಣೆಗಳನ್ನು ಉಳಿಸಿ',
    'profile.cancel': 'ರದ್ದುಮಾಡಿ',
    'profile.updateSuccess': 'ಪ್ರೊಫೈಲ್ ಯಶಸ್ವಿಯಾಗಿ ನವೀಕರಿಸಲಾಗಿದೆ',
    'profile.updateError': 'ಪ್ರೊಫೈಲ್ ನವೀಕರಿಸಲು ವಿಫಲವಾಗಿದೆ',
    'profile.editAddress': 'ವಿಳಾಸ ಸಂಪಾದಿಸಿ',
    'profile.noAddressSet': 'ಯಾವುದೇ ವಿಳಾಸ ಹೊಂದಿಸಲಾಗಿಲ್ಲ',

    // Language Settings
    'language.title': 'ಭಾಷೆ ಆಯ್ಕೆಮಾಡಿ',
    'language.english': 'English (ಇಂಗ್ಲಿಷ್)',
    'language.hindi': 'हिंदी (ಹಿಂದಿ)',
    'language.kannada': 'ಕನ್ನಡ',
    'language.selectLanguage': 'ನಿಮ್ಮ ಆದ್ಯತೆಯ ಭಾಷೆಯನ್ನು ಆಯ್ಕೆಮಾಡಿ',

    // Common
    'common.loading': 'ಲೋಡ್ ಆಗುತ್ತಿದೆ...',
    'common.save': 'ಉಳಿಸಿ',
    'common.close': 'ಮುಚ್ಚಿ',
    'common.confirm': 'ದೃಢೀಕರಿಸಿ',
    'common.apply': 'ಅನ್ವಯಿಸಿ',

    // Checkout
    'checkout.title': 'ಚೆಕ್‌ಔಟ್',
    'checkout.deliveryDetails': 'ವಿತರಣಾ ವಿವರಗಳು',
    'checkout.orderSummary': 'ಆರ್ಡರ್ ಸಾರಾಂಶ',
    'checkout.placeOrder': 'ಆರ್ಡರ್ ಮಾಡಿ',
    'checkout.editAddress': 'ವಿಳಾಸ ಸಂಪಾದಿಸಿ',
    'checkout.applyCoupon': 'ಕೂಪನ್ ಅನ್ವಯಿಸಿ',
    'checkout.paymentMethod': 'ಪಾವತಿ ವಿಧಾನ',
    'checkout.cod': 'ಕ್ಯಾಶ್ ಆನ್ ಡೆಲಿವರಿ / ಯುಪಿಐ ಆನ್ ಡೆಲಿವರಿ',
    'checkout.subtotal': 'ಉಪಮೊತ್ತ',
    'checkout.delivery': 'ವಿತರಣೆ',
    'checkout.total': 'ಒಟ್ಟು',
    'checkout.free': 'ಉಚಿತ',
    'checkout.phoneNumber': 'ಫೋನ್ ಸಂಖ್ಯೆ',
    'checkout.deliveryAddress': 'ವಿತರಣಾ ವಿಳಾಸ',
    'checkout.locationConfirmed': 'ಸ್ಥಳ ದೃಢೀಕರಿಸಲಾಗಿದೆ',
    'checkout.placingOrder': 'ಆರ್ಡರ್ ಮಾಡಲಾಗುತ್ತಿದೆ...',
    'checkout.freeDeliveryOver': 'ಉಚಿತ ವಿತರಣೆ',
    'checkout.addMoreForMin': 'ಕನಿಷ್ಠ ಆರ್ಡರ್ ಮೌಲ್ಯಕ್ಕೆ ₹{amount} ಇನ್ನಷ್ಟು ಸೇರಿಸಿ',
    'checkout.totalPayable': 'ಒಟ್ಟು ಪಾವತಿಸಬೇಕಾದ',
    'checkout.appliedCoupon': '{code} ಅನ್ವಯಿಸಲಾಗಿದೆ। ನೀವು ₹{amount} ಉಳಿಸುತ್ತೀರಿ',
    'checkout.stockIssues': 'ಸ್ಟಾಕ್ ಸಮಸ್ಯೆಗಳು',
    'checkout.itemsAffected': '{count} ಐಟಂಗಳು ಪ್ರಭಾವಿತವಾಗಿವೆ',
    'checkout.payment': 'ಪಾವತಿ',
    'checkout.qty': 'ಪ್ರಮಾಣ',
    'checkout.each': 'ಪ್ರತಿ',
    'checkout.total2': 'ಒಟ್ಟು',
    'checkout.pcs': 'ಪೀಸಿ',
    'checkout.removedDueToStock': 'ಸ್ಟಾಕ್ ಕಾರಣ ತೆಗೆದುಹಾಕಲಾಗಿದೆ',
    'checkout.cart': 'ಕಾರ್ಟ್',
    'checkout.noAddressSet': 'ಯಾವುದೇ ವಿಳಾಸ ಹೊಂದಿಸಲಾಗಿಲ್ಲ',
    'checkout.completeAddress': 'ನಿಮ್ಮ ವಿಳಾಸವನ್ನು ಪೂರ್ಣಗೊಳಿಸಿ',
    'checkout.enterPhoneNumber': '10 ಅಂಕಿಯ ಮೊಬೈಲ್ ಸಂಖ್ಯೆಯನ್ನು ನಮೂದಿಸಿ',
    'checkout.phoneNumberLabel': '10 ಅಂಕಿಯ ಮೊಬೈಲ್ ಸಂಖ್ಯೆ',

    // Cart
    'cart.title': 'ಶಾಪಿಂಗ್ ಕಾರ್ಟ್',
    'cart.empty': 'ನಿಮ್ಮ ಕಾರ್ಟ್ ಖಾಲಿಯಾಗಿದೆ',
    'cart.continueShopping': 'ಶಾಪಿಂಗ್ ಮುಂದುವರಿಸಿ',
    'cart.checkout': 'ಚೆಕ್‌ಔಟ್‌ಗೆ ಮುಂದುವರಿಯಿರಿ',
    'cart.quantity': 'ಪ್ರಮಾಣ',
    'cart.remove': 'ತೆಗೆದುಹಾಕಿ',
    'cart.total': 'ಒಟ್ಟು',
    'cart.items': 'ಐಟಂಗಳು',
    'cart.item': 'ಐಟಂ',

    // Orders
    'orders.title': 'ನನ್ನ ಆರ್ಡರ್‌ಗಳು',
    'orders.noOrders': 'ಇನ್ನೂ ಆರ್ಡರ್‌ಗಳಿಲ್ಲ',
    'orders.startShopping': 'ಶಾಪಿಂಗ್ ಪ್ರಾರಂಭಿಸಿ',
    'orders.orderPlaced': 'ಆರ್ಡರ್ ನೀಡಲಾಗಿದೆ',
    'orders.status': 'ಸ್ಥಿತಿ',
    'orders.total': 'ಒಟ್ಟು',
    'orders.viewDetails': 'ವಿವರಗಳನ್ನು ವೀಕ್ಷಿಸಿ',
    'orders.pending': 'ಬಾಕಿ ಉಳಿದಿದೆ',
    'orders.confirmed': 'ದೃಢೀಕರಿಸಲಾಗಿದೆ',
    'orders.processing': 'ಪ್ರಕ್ರಿಯೆಗೊಳಿಸಲಾಗುತ್ತಿದೆ',
    'orders.shipped': 'ರವಾನಿಸಲಾಗಿದೆ',
    'orders.delivered': 'ವಿತರಿಸಲಾಗಿದೆ',
    'orders.cancelled': 'ರದ್ದುಗೊಳಿಸಲಾಗಿದೆ',

    // Products
    'products.addToCart': 'ಕಾರ್ಟ್‌ಗೆ ಸೇರಿಸಿ',
    'products.outOfStock': 'ಸ್ಟಾಕ್‌ನಲ್ಲಿ ಇಲ್ಲ',
    'products.lowStock': 'ಕಡಿಮೆ ಸ್ಟಾಕ್',
    'products.inStock': 'ಸ್ಟಾಕ್‌ನಲ್ಲಿದೆ',
    'products.viewDetails': 'ವಿವರಗಳನ್ನು ವೀಕ್ಷಿಸಿ',
    'products.price': 'ಬೆಲೆ',
    'products.quantity': 'ಪ್ರಮಾಣ',
    'products.search': 'ಉತ್ಪನ್ನಗಳನ್ನು ಹುಡುಕಿ...',
    'products.noProducts': 'ಯಾವುದೇ ಉತ್ಪನ್ನಗಳು ಸಿಗಲಿಲ್ಲ',
    'products.categories': 'ವರ್ಗಗಳು',
    'products.allProducts': 'ಎಲ್ಲಾ ಉತ್ಪನ್ನಗಳು',
  },
};

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('language');
    return (saved as Language) || 'en';
  });

  useEffect(() => {
    localStorage.setItem('language', language);
  }, [language]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
  };

  const t = (key: string, params?: Record<string, string | number>): string => {
    let translation = translations[language][key as keyof typeof translations['en']] || key;

    // Replace placeholders like {amount}, {code}, {count}
    if (params) {
      Object.keys(params).forEach((paramKey) => {
        translation = translation.replace(`{${paramKey}}`, String(params[paramKey]));
      });
    }

    return translation;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
