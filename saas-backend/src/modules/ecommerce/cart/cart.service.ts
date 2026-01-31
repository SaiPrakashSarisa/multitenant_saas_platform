import prisma from '../../../config/database';

export class EcommerceCartService {
  static async getCart(tenantId: string, customerId?: string, sessionId?: string) {
    const where = customerId
      ? { tenantId, customerId, status: 'active' }
      : { tenantId, sessionId, status: 'active' };

    let cart = await prisma.ecommerceCart.findFirst({
      where,
      include: {
        items: {
          include: {
            product: {
              include: {
                images: { where: { isPrimary: true }, take: 1 },
              },
            },
            variant: true,
          },
        },
      },
    });

    // Create cart if not exists
    if (!cart) {
      cart = await prisma.ecommerceCart.create({
        data: {
          tenantId,
          customerId,
          sessionId: customerId ? undefined : sessionId,
          status: 'active',
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        },
        include: {
          items: {
            include: {
              product: {
                include: {
                  images: { where: { isPrimary: true }, take: 1 },
                },
              },
              variant: true,
            },
          },
        },
      });
    }

    return cart;
  }

  static async addItem(
    cartId: string,
    productId: string,
    quantity: number,
    variantId?: string
  ) {
    // Get product/variant price
    const product = await prisma.ecommerceProduct.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw new Error('Product not found');
    }

    let unitPrice = product.price;

    if (variantId) {
      const variant = await prisma.ecommerceProductVariant.findUnique({
        where: { id: variantId },
      });
      if (variant?.price) {
        unitPrice = variant.price;
      }
    }

    // Check if item already exists in cart
    const existingItem = await prisma.ecommerceCartItem.findFirst({
      where: {
        cartId,
        productId,
        variantId: variantId || null,
      },
    });

    if (existingItem) {
      // Update quantity
      return prisma.ecommerceCartItem.update({
        where: { id: existingItem.id },
        data: { quantity: existingItem.quantity + quantity },
        include: {
          product: true,
          variant: true,
        },
      });
    }

    // Create new item
    return prisma.ecommerceCartItem.create({
      data: {
        cartId,
        productId,
        variantId,
        quantity,
        unitPrice,
      },
      include: {
        product: true,
        variant: true,
      },
    });
  }

  static async updateItemQuantity(itemId: string, quantity: number) {
    if (quantity <= 0) {
      return this.removeItem(itemId);
    }

    return prisma.ecommerceCartItem.update({
      where: { id: itemId },
      data: { quantity },
      include: {
        product: true,
        variant: true,
      },
    });
  }

  static async removeItem(itemId: string) {
    return prisma.ecommerceCartItem.delete({
      where: { id: itemId },
    });
  }

  static async clearCart(cartId: string) {
    return prisma.ecommerceCartItem.deleteMany({
      where: { cartId },
    });
  }

  static async getCartTotal(cartId: string) {
    const items = await prisma.ecommerceCartItem.findMany({
      where: { cartId },
    });

    const subtotal = items.reduce(
      (sum, item) => sum + Number(item.unitPrice) * item.quantity,
      0
    );

    return {
      subtotal,
      itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
    };
  }

  static async mergeGuestCart(guestCartId: string, userCartId: string) {
    // Get items from guest cart
    const guestItems = await prisma.ecommerceCartItem.findMany({
      where: { cartId: guestCartId },
    });

    // Move items to user cart (or merge quantities)
    for (const item of guestItems) {
      const existingItem = await prisma.ecommerceCartItem.findFirst({
        where: {
          cartId: userCartId,
          productId: item.productId,
          variantId: item.variantId,
        },
      });

      if (existingItem) {
        await prisma.ecommerceCartItem.update({
          where: { id: existingItem.id },
          data: { quantity: existingItem.quantity + item.quantity },
        });
      } else {
        await prisma.ecommerceCartItem.create({
          data: {
            cartId: userCartId,
            productId: item.productId,
            variantId: item.variantId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
          },
        });
      }
    }

    // Mark guest cart as abandoned
    await prisma.ecommerceCart.update({
      where: { id: guestCartId },
      data: { status: 'abandoned' },
    });
  }
}
