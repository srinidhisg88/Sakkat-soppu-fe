import React from 'react';

type PoliciesSectionProps = {
  id?: string;
  compact?: boolean;
  whatsappNumber?: string; // e.g., "+91 9XXXXXXXXX"
};

export const PoliciesSection: React.FC<PoliciesSectionProps> = ({ id, compact = false, whatsappNumber }) => {
  const whatsApp = whatsappNumber || 'your WhatsApp number';
  const containerClass = compact
    ? 'bg-white rounded-lg border border-green-100 p-4'
    : 'bg-white rounded-2xl shadow-md border border-green-100 p-6';
  const h2Class = compact ? 'text-lg font-bold mb-3' : 'text-2xl font-bold mb-4';
  const h3Class = compact ? 'text-base font-semibold mb-2' : 'text-lg font-semibold mb-2';
  const liClass = 'list-disc ml-5 text-gray-700';

  return (
    <section id={id} className={compact ? '' : 'max-w-6xl mx-auto px-4'}>
      <div className={containerClass}>
        <h2 className={h2Class}>Policies</h2>

        <div className={compact ? 'space-y-3' : 'space-y-4'}>
          <div>
            <h3 className={h3Class}>Return & Refund Policy</h3>
            <ul className="space-y-1">
              <li className={liClass}>
                <span className="font-medium">No Return / Replacement:</span> We do not offer product returns or replacements once an order is delivered.
              </li>
              <li className={liClass}>
                <span className="font-medium">Damaged Products:</span> If your product is delivered in a damaged condition, please share a clear photo of the product on our official WhatsApp number ({whatsApp}) within 24 hours of delivery.
              </li>
              <li className={liClass}>
                <span className="font-medium">Compensation:</span> After verification, we will provide a flat discount equal to the damage value on your next order.
              </li>
              <li className={liClass}>
                <span className="font-medium">Note:</span> Damage claims without photo proof will not be considered.
              </li>
            </ul>
          </div>

          <div>
            <h3 className={h3Class}>Delivery Policy</h3>
            <ul className="space-y-1">
              <li className={liClass}>
                <span className="font-medium">Scheduled Delivery Days:</span> Orders are delivered on Sundays and Mondays.
              </li>
              <li className={liClass}>
                <span className="font-medium">Customer Availability:</span> Customers must ensure someone is available at the delivery address to collect the order.
              </li>
              <li className={liClass}>
                <span className="font-medium">Missed Delivery:</span> If the customer is not present at the time of delivery, a QR code for payment will be sent to their registered mobile number. The full order amount must be paid via the QR code to confirm the order.
              </li>
              <li className={liClass}>
                <span className="font-medium">Order Cancellation:</span> Orders can be cancelled within 24 hours of the order being placed.
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PoliciesSection;
