import Order from '../models/Order';
import Customer from '../models/Customer';

/**
 * Activate the customer's permanent OTP on the specific order document.
 * When a delivery boy requests OTP, this copies the customer's permanent OTP
 * into the order's deliveryOtp field so the frontend can display it.
 */
export async function generateDeliveryOtp(orderId: string): Promise<{ success: boolean; message: string }> {
  try {
    // Fetch the order first
    const order = await Order.findById(orderId);
    if (!order) {
      throw new Error('Order not found');
    }

    if (order.status === 'Delivered') {
      throw new Error('Order is already delivered');
    }

    // Fetch customer to get their permanent OTP
    const customer = await Customer.findById(order.customer);
    if (!customer || !customer.deliveryOtp) {
      throw new Error('Customer delivery OTP not found');
    }

    // Copy the customer's permanent OTP onto this order so the customer UI can display it
    order.deliveryOtp = customer.deliveryOtp;
    await order.save();

    console.log(`[Delivery OTP] Activated OTP for order ${orderId}`);

    return {
      success: true,
      message: 'Delivery OTP has been sent to the customer.',
    };
  } catch (error: any) {
    console.error('Error in generateDeliveryOtp:', error);
    throw new Error(error.message || 'Failed to process delivery OTP request');
  }
}

/**
 * Verify delivery OTP using customer's permanent OTP
 */
export async function verifyDeliveryOtp(orderId: string, otp: string): Promise<{ success: boolean; message: string }> {
  try {
    const order = await Order.findById(orderId).populate('customer');

    if (!order) {
      throw new Error('Order not found');
    }

    if (order.status === 'Delivered') {
      throw new Error('Order is already delivered');
    }

    // Get customer's permanent delivery OTP
    let customerOtp: string | undefined;

    if (order.customer && typeof order.customer === 'object' && 'deliveryOtp' in order.customer) {
      customerOtp = (order.customer as any).deliveryOtp;
    } else if (order.customer) {
      // If not populated, fetch customer
      const customer = await Customer.findById(order.customer);
      customerOtp = customer?.deliveryOtp;
    }

    if (!customerOtp) {
      throw new Error('Customer delivery OTP not found. Please contact support.');
    }

    // Developer bypass for testing
    if ((process.env.NODE_ENV !== 'production' || process.env.USE_MOCK_OTP === 'true') && otp === '9999') {
      order.deliveryOtpVerified = true;
      order.status = 'Delivered';
      order.deliveredAt = new Date();
      order.invoiceEnabled = true;
      await order.save();

      return {
        success: true,
        message: 'OTP verified successfully. Order marked as delivered.',
      };
    }

    // Verify OTP against customer's permanent OTP
    if (customerOtp !== otp) {
      throw new Error('Invalid OTP. Please check and try again.');
    }

    // Mark order as delivered
    order.deliveryOtpVerified = true;
    order.status = 'Delivered';
    order.deliveredAt = new Date();
    order.invoiceEnabled = true;
    await order.save();

    return {
      success: true,
      message: 'OTP verified successfully. Order marked as delivered.',
    };
  } catch (error: any) {
    console.error('Error verifying delivery OTP:', error);
    throw new Error(error.message || 'Failed to verify delivery OTP');
  }
}
