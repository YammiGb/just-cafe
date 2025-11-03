import React, { useState } from 'react';
import { ArrowLeft, Clock, AlertCircle } from 'lucide-react';
import { CartItem, PaymentMethod, ServiceType } from '../types';
import { usePaymentMethods } from '../hooks/usePaymentMethods';

interface CheckoutProps {
  cartItems: CartItem[];
  totalPrice: number;
  onBack: () => void;
}

const MINIMUM_DELIVERY_AMOUNT = 150;

const Checkout: React.FC<CheckoutProps> = ({ cartItems, totalPrice, onBack }) => {
  const { paymentMethods } = usePaymentMethods();
  const [step, setStep] = useState<'details' | 'payment'>('details');
  const [customerName, setCustomerName] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [serviceType, setServiceType] = useState<ServiceType>('dine-in');
  const [address, setAddress] = useState('');
  const [landmark, setLandmark] = useState('');
  const [pickupTime, setPickupTime] = useState('5-10');
  const [customTime, setCustomTime] = useState('');
  // Dine-in specific state
  const [partySize, setPartySize] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('gcash');
  const [notes, setNotes] = useState('');

  React.useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [step]);

  // Build effective payment methods list including Cash (Onsite)
  const cashMethod = {
    id: 'cash',
    name: 'Cash (Onsite)',
    account_number: '',
    account_name: '',
    qr_code_url: '',
    active: true,
    sort_order: 999,
    created_at: '',
    updated_at: ''
  } as any;
  const effectivePaymentMethods = [...paymentMethods, cashMethod];

  // Set default payment method when payment methods are loaded
  React.useEffect(() => {
    if (effectivePaymentMethods.length > 0 && !paymentMethod) {
      setPaymentMethod((effectivePaymentMethods[0].id as PaymentMethod) || 'cash');
    }
  }, [effectivePaymentMethods, paymentMethod]);

  const selectedPaymentMethod = effectivePaymentMethods.find(method => method.id === paymentMethod);

  const handleProceedToPayment = () => {
    setStep('payment');
  };

  const handlePlaceOrder = () => {
    const timeInfo = serviceType === 'pickup' 
      ? (pickupTime === 'custom' ? customTime : `${pickupTime} minutes`)
      : '';
    
    const dineInInfo = serviceType === 'dine-in' 
      ? `👥 Party Size: ${partySize} person${partySize !== 1 ? 's' : ''}`
      : '';
    
    const orderDetails = `
🛒 Just Cafè ORDER

👤 Customer: ${customerName}
📞 Contact: ${contactNumber}
📍 Service: ${serviceType.charAt(0).toUpperCase() + serviceType.slice(1)}
${serviceType === 'delivery' ? `🏠 Address: ${address}${landmark ? `\n🗺️ Landmark: ${landmark}` : ''}` : ''}
${serviceType === 'pickup' ? `⏰ Pickup Time: ${timeInfo}` : ''}
${serviceType === 'dine-in' ? dineInInfo : ''}


📋 ORDER DETAILS:
${cartItems.map(item => {
  let itemDetails = `• ${item.name}`;
  if (item.selectedVariation) {
    itemDetails += ` (${item.selectedVariation.name})`;
  }
  if (item.selectedAddOns && item.selectedAddOns.length > 0) {
    itemDetails += ` + ${item.selectedAddOns.map(addOn => 
      addOn.quantity && addOn.quantity > 1 
        ? `${addOn.name} x${addOn.quantity}`
        : addOn.name
    ).join(', ')}`;
  }
  itemDetails += ` x${item.quantity} - ₱${item.totalPrice * item.quantity}`;
  return itemDetails;
}).join('\n')}

💰 TOTAL: ₱${totalPrice}
${serviceType === 'delivery' ? `🛵 DELIVERY FEE:` : ''}

💳 Payment: ${selectedPaymentMethod?.name || paymentMethod}
${paymentMethod === 'cash' ? '' : '📸 Payment Screenshot: Please attach your payment receipt screenshot'}

${notes ? `📝 Notes: ${notes}` : ''}

Please confirm this order to proceed. Thank you for choosing Just Cafè! ☕
    `.trim();

    const encodedMessage = encodeURIComponent(orderDetails);
    const messengerUrl = `https://m.me/justcafebatanes?text=${encodedMessage}`;
    
    window.open(messengerUrl, '_blank');
    
  };

  const isDeliveryMinimumMet = serviceType !== 'delivery' || totalPrice >= MINIMUM_DELIVERY_AMOUNT;
  
  const isDetailsValid = customerName && contactNumber && 
    (serviceType !== 'delivery' || address) && 
    (serviceType !== 'pickup' || (pickupTime !== 'custom' || customTime)) &&
    (serviceType !== 'dine-in' || (partySize > 0)) &&
    isDeliveryMinimumMet;

  if (step === 'details') {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center mb-8">
          <button
            onClick={onBack}
            className="flex items-center space-x-2 text-gray-600 hover:text-black transition-colors duration-200"
          >
            <ArrowLeft className="h-5 w-5" />
            <span>Back to Cart</span>
          </button>
          <h1 className="text-3xl font-playfair font-semibold text-cafe-dark ml-8">Order Details</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Order Summary */}
          <div className="bg-cafe-light rounded-xl shadow-sm p-6 border border-cafe-latte">
            <h2 className="text-2xl font-playfair font-medium text-cafe-dark mb-6">Order Summary</h2>
            
            <div className="space-y-4 mb-6">
              {cartItems.map((item) => (
                <div key={item.id} className="flex items-center justify-between py-2 border-b border-cafe-latte">
                  <div>
                    <h4 className="font-medium text-cafe-dark">{item.name}</h4>
                    {item.selectedVariation && (
                      <p className="text-sm text-gray-600">Size: {item.selectedVariation.name}</p>
                    )}
                    {item.selectedAddOns && item.selectedAddOns.length > 0 && (
                      <p className="text-sm text-gray-600">
                        Add-ons: {item.selectedAddOns.map(addOn => addOn.name).join(', ')}
                      </p>
                    )}
                    <p className="text-sm text-gray-600">₱{item.totalPrice} x {item.quantity}</p>
                  </div>
                  <span className="font-semibold text-cafe-dark">₱{item.totalPrice * item.quantity}</span>
                </div>
              ))}
            </div>
            
            <div className="border-t border-cafe-latte pt-4">
              <div className="flex items-center justify-between text-2xl font-playfair font-semibold text-cafe-dark">
                <span>Total:</span>
                <span className="text-cafe-accent">₱{totalPrice}</span>
              </div>
            </div>
            
            {/* Delivery Minimum Order Warning */}
            {serviceType === 'delivery' && totalPrice < MINIMUM_DELIVERY_AMOUNT && (
              <div className="mt-4 bg-red-50 border-2 border-red-300 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-semibold text-red-800 mb-1">Minimum Order Not Met</h4>
                    <p className="text-sm text-red-700">
                      Delivery orders require a minimum of <span className="font-bold">₱{MINIMUM_DELIVERY_AMOUNT}</span>. 
                      Please add <span className="font-bold">₱{MINIMUM_DELIVERY_AMOUNT - totalPrice}</span> more to proceed.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Customer Details Form */}
          <div className="bg-cafe-light rounded-xl shadow-sm p-6 border border-cafe-latte">
            <h2 className="text-2xl font-playfair font-medium text-cafe-dark mb-6">Customer Information</h2>
            
            <form className="space-y-6">
              {/* Customer Information */}
              <div>
                <label className="block text-sm font-medium text-cafe-dark mb-2">Full Name *</label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full px-4 py-3 border border-cafe-latte rounded-lg focus:ring-2 focus:ring-cafe-accent focus:border-cafe-accent transition-all duration-200 bg-cafe-cream"
                  placeholder="Enter your full name"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-cafe-dark mb-2">Contact Number *</label>
                <input
                  type="tel"
                  value={contactNumber}
                  onChange={(e) => setContactNumber(e.target.value)}
                  className="w-full px-4 py-3 border border-cafe-latte rounded-lg focus:ring-2 focus:ring-cafe-accent focus:border-cafe-accent transition-all duration-200 bg-cafe-cream"
                  placeholder="09XX XXX XXXX"
                  required
                />
              </div>

              {/* Service Type */}
              <div>
                <label className="block text-sm font-medium text-cafe-dark mb-3">Service Type *</label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { value: 'dine-in', label: 'Dine In', icon: '🪑' },
                    { value: 'pickup', label: 'Pickup', icon: '🚶' },
                    { value: 'delivery', label: 'Delivery', icon: '🛵' }
                  ].map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setServiceType(option.value as ServiceType)}
                      className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                        serviceType === option.value
                          ? 'border-cafe-accent bg-cafe-accent text-white'
                          : 'border-cafe-latte bg-cafe-cream text-gray-700 hover:border-cafe-accent'
                      }`}
                    >
                      <div className="text-2xl mb-1">{option.icon}</div>
                      <div className="text-sm font-medium">{option.label}</div>
                    </button>
                  ))}
                </div>
                
                {/* Delivery minimum order info */}
                <div className="mt-3 bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-xs text-blue-800">
                    <span className="font-medium">📍 Note:</span> Delivery orders require a minimum purchase of ₱{MINIMUM_DELIVERY_AMOUNT}
                  </p>
                </div>
              </div>

              {/* Dine-in Details */}
              {serviceType === 'dine-in' && (
                <div>
                  <label className="block text-sm font-medium text-cafe-dark mb-2">Party Size *</label>
                  <div className="flex items-center space-x-4">
                    <button
                      type="button"
                      onClick={() => setPartySize(Math.max(1, partySize - 1))}
                      className="w-10 h-10 rounded-lg border-2 border-cafe-latte flex items-center justify-center text-cafe-accent hover:border-cafe-accent hover:bg-cafe-beige transition-all duration-200"
                    >
                      -
                    </button>
                    <span className="text-2xl font-semibold text-cafe-dark min-w-[3rem] text-center">{partySize}</span>
                    <button
                      type="button"
                      onClick={() => setPartySize(Math.min(20, partySize + 1))}
                      className="w-10 h-10 rounded-lg border-2 border-cafe-latte flex items-center justify-center text-cafe-accent hover:border-cafe-accent hover:bg-cafe-beige transition-all duration-200"
                    >
                      +
                    </button>
                    <span className="text-sm text-gray-600 ml-2">person{partySize !== 1 ? 's' : ''}</span>
                  </div>
                </div>
              )}

              {/* Pickup Time Selection */}
              {serviceType === 'pickup' && (
                <div>
                  <label className="block text-sm font-medium text-black mb-3">Pickup Time *</label>
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { value: '5-10', label: '5-10 minutes' },
                        { value: '15-20', label: '15-20 minutes' },
                        { value: '25-30', label: '25-30 minutes' },
                        { value: 'custom', label: 'Custom Time' }
                      ].map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => setPickupTime(option.value)}
                          className={`p-3 rounded-lg border-2 transition-all duration-200 text-sm ${
                            pickupTime === option.value
                              ? 'border-cafe-accent bg-cafe-accent text-white'
                              : 'border-cafe-latte bg-cafe-cream text-gray-700 hover:border-cafe-accent'
                          }`}
                        >
                          <Clock className="h-4 w-4 mx-auto mb-1" />
                          {option.label}
                        </button>
                      ))}
                    </div>
                    
                    {pickupTime === 'custom' && (
                      <input
                        type="text"
                        value={customTime}
                        onChange={(e) => setCustomTime(e.target.value)}
                        className="w-full px-4 py-3 border border-cafe-latte rounded-lg focus:ring-2 focus:ring-cafe-accent focus:border-cafe-accent transition-all duration-200 bg-cafe-cream"
                        placeholder="e.g., 45 minutes, 1 hour, 2:30 PM"
                        required
                      />
                    )}
                  </div>
                </div>
              )}

              {/* Delivery Address */}
              {serviceType === 'delivery' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-cafe-dark mb-2">Delivery Address *</label>
                    <textarea
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="w-full px-4 py-3 border border-cafe-latte rounded-lg focus:ring-2 focus:ring-cafe-accent focus:border-cafe-accent transition-all duration-200 bg-cafe-cream"
                      placeholder="Enter your complete delivery address"
                      rows={3}
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-cafe-dark mb-2">Landmark</label>
                    <input
                      type="text"
                      value={landmark}
                      onChange={(e) => setLandmark(e.target.value)}
                      className="w-full px-4 py-3 border border-cafe-latte rounded-lg focus:ring-2 focus:ring-cafe-accent focus:border-cafe-accent transition-all duration-200 bg-cafe-cream"
                      placeholder="e.g., Near McDonald's, Beside 7-Eleven, In front of school"
                    />
                  </div>
                </>
              )}

              {/* Special Notes */}
              <div>
                <label className="block text-sm font-medium text-cafe-dark mb-2">Special Instructions</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-4 py-3 border border-cafe-latte rounded-lg focus:ring-2 focus:ring-cafe-accent focus:border-cafe-accent transition-all duration-200 bg-cafe-cream"
                  placeholder="Any special requests or notes..."
                  rows={3}
                />
              </div>

              <button
                onClick={handleProceedToPayment}
                disabled={!isDetailsValid}
                className={`w-full py-4 rounded-xl font-medium text-lg transition-all duration-200 transform ${
                  isDetailsValid
                    ? 'bg-cafe-accent text-white hover:bg-cafe-espresso hover:scale-[1.02]'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                Proceed to Payment
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // Payment Step
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center mb-8">
        <button
          onClick={() => setStep('details')}
          className="flex items-center space-x-2 text-gray-600 hover:text-black transition-colors duration-200"
        >
          <ArrowLeft className="h-5 w-5" />
          <span>Back to Details</span>
        </button>
        <h1 className="text-3xl font-playfair font-semibold text-cafe-dark ml-8">Payment</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Payment Method Selection */}
        <div className="bg-cafe-light rounded-xl shadow-sm p-6 border border-cafe-latte">
          <h2 className="text-2xl font-playfair font-medium text-cafe-dark mb-6">Choose Payment Method</h2>
          
          <div className="grid grid-cols-1 gap-4 mb-6">
            {effectivePaymentMethods.map((method) => (
              <button
                key={method.id}
                type="button"
                onClick={() => setPaymentMethod(method.id as PaymentMethod)}
                className={`p-4 rounded-lg border-2 transition-all duration-200 flex items-center space-x-3 ${
                  paymentMethod === method.id
                    ? 'border-cafe-accent bg-cafe-accent text-white'
                    : 'border-cafe-latte bg-cafe-cream text-gray-700 hover:border-cafe-accent'
                }`}
              >
                <span className="text-2xl">{method.id === 'cash' ? '💵' : '💳'}</span>
                <span className="font-medium">{method.name}</span>
              </button>
            ))}
          </div>

          {/* Payment Details with QR Code (hide for cash) */}
          {selectedPaymentMethod && paymentMethod !== 'cash' && (
            <div className="bg-cafe-beige rounded-lg p-6 mb-6 border border-cafe-latte">
              <h3 className="font-medium text-cafe-dark mb-4">Payment Details</h3>
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex-1">
                  <p className="text-sm text-gray-600 mb-1">{selectedPaymentMethod.name}</p>
                  <p className="font-mono text-cafe-dark font-medium">{selectedPaymentMethod.account_number}</p>
                  <p className="text-sm text-gray-600 mb-3">Account Name: {selectedPaymentMethod.account_name}</p>
                  <p className="text-xl font-semibold text-cafe-accent">Amount: ₱{totalPrice}</p>
                </div>
                <div className="flex-shrink-0">
                  <img 
                    src={selectedPaymentMethod.qr_code_url} 
                    alt={`${selectedPaymentMethod.name} QR Code`}
                    className="w-32 h-32 rounded-lg border-2 border-cafe-latte shadow-sm"
                    onError={(e) => {
                      e.currentTarget.src = 'https://images.pexels.com/photos/8867482/pexels-photo-8867482.jpeg?auto=compress&cs=tinysrgb&w=300&h=300&fit=crop';
                    }}
                  />
                  <p className="text-xs text-gray-500 text-center mt-2">Scan to pay</p>
                </div>
              </div>
            </div>
          )}

          {/* Payment instructions: show proof section only for non-cash */}
          {paymentMethod !== 'cash' ? (
            <div className="bg-cafe-cream border border-cafe-latte rounded-lg p-4">
              <h4 className="font-medium text-cafe-dark mb-2">📸 Payment Proof Required</h4>
              <p className="text-sm text-gray-700">
                After making your payment, please take a screenshot of your payment receipt and attach it when you send your order via Messenger. This helps us verify and process your order quickly.
              </p>
            </div>
          ) : (
            <div className="bg-cafe-cream border border-cafe-latte rounded-lg p-4">
              <h4 className="font-medium text-cafe-dark mb-2">💵 Pay with Cash Onsite</h4>
              <p className="text-sm text-gray-700">
                Please proceed to the counter and pay in cash when you arrive. No payment screenshot needed.
              </p>
            </div>
          )}
        </div>

        {/* Order Summary */}
        <div className="bg-cafe-light rounded-xl shadow-sm p-6 border border-cafe-latte">
          <h2 className="text-2xl font-playfair font-medium text-cafe-dark mb-6">Final Order Summary</h2>
          
          <div className="space-y-4 mb-6">
            <div className="bg-cafe-beige rounded-lg p-4 border border-cafe-latte">
              <h4 className="font-medium text-cafe-dark mb-2">Customer Details</h4>
              <p className="text-sm text-gray-600">Name: {customerName}</p>
              <p className="text-sm text-gray-600">Contact: {contactNumber}</p>
              <p className="text-sm text-gray-600">Service: {serviceType.charAt(0).toUpperCase() + serviceType.slice(1)}</p>
              {serviceType === 'delivery' && (
                <>
                  <p className="text-sm text-gray-600">Address: {address}</p>
                  {landmark && <p className="text-sm text-gray-600">Landmark: {landmark}</p>}
                </>
              )}
              {serviceType === 'pickup' && (
                <p className="text-sm text-gray-600">
                  Pickup Time: {pickupTime === 'custom' ? customTime : `${pickupTime} minutes`}
                </p>
              )}
              {serviceType === 'dine-in' && (
                <p className="text-sm text-gray-600">
                  Party Size: {partySize} person{partySize !== 1 ? 's' : ''}
                </p>
              )}
            </div>

            {cartItems.map((item) => (
              <div key={item.id} className="flex items-center justify-between py-2 border-b border-cafe-latte">
                <div>
                  <h4 className="font-medium text-cafe-dark">{item.name}</h4>
                  {item.selectedVariation && (
                    <p className="text-sm text-gray-600">Size: {item.selectedVariation.name}</p>
                  )}
                  {item.selectedAddOns && item.selectedAddOns.length > 0 && (
                    <p className="text-sm text-gray-600">
                      Add-ons: {item.selectedAddOns.map(addOn => 
                        addOn.quantity && addOn.quantity > 1 
                          ? `${addOn.name} x${addOn.quantity}`
                          : addOn.name
                      ).join(', ')}
                    </p>
                  )}
                  <p className="text-sm text-gray-600">₱{item.totalPrice} x {item.quantity}</p>
                </div>
                <span className="font-semibold text-cafe-dark">₱{item.totalPrice * item.quantity}</span>
              </div>
            ))}
          </div>
          
          <div className="border-t border-cafe-latte pt-4 mb-6">
            <div className="flex items-center justify-between text-2xl font-playfair font-semibold text-cafe-dark">
              <span>Total:</span>
              <span className="text-cafe-accent">₱{totalPrice}</span>
            </div>
          </div>

          <button
            onClick={handlePlaceOrder}
            className="w-full py-4 rounded-xl font-medium text-lg transition-all duration-200 transform bg-cafe-accent text-white hover:bg-cafe-espresso hover:scale-[1.02]"
          >
            Place Order via Messenger
          </button>
          
          <p className="text-xs text-gray-500 text-center mt-3">
            You'll be redirected to Facebook Messenger to confirm your order. Don't forget to attach your payment screenshot!
          </p>
        </div>
      </div>
    </div>
  );
};

export default Checkout;