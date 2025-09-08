// prisma/seed.ts
import { PrismaClient, Role } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // --- Categories ---
  const accessories = await prisma.category.upsert({
    where: { slug: 'accessories' },
    update: {},
    create: { name: 'Accessories', slug: 'accessories' },
  });

  const keyboards = await prisma.category.upsert({
    where: { slug: 'keyboards' },
    update: {},
    create: { name: 'Keyboards', slug: 'keyboards' },
  });

  const audio = await prisma.category.upsert({
    where: { slug: 'audio' },
    update: {},
    create: { name: 'Audio', slug: 'audio' },
  });

  const hubs = await prisma.category.upsert({
    where: { slug: 'hubs' },
    update: {},
    create: { name: 'Hubs & Docks', slug: 'hubs' },
  });

  // --- Products ---

  // 1) Wireless Mouse
  await prisma.product.upsert({
    where: { slug: 'wireless-mouse' },
    update: {},
    create: {
      title: 'Wireless Mouse',
      slug: 'wireless-mouse',
      description: 'Responsive, silent clicks, 12-month battery life.',
      brand: 'Acme',
      active: true,
      images: {
        create: [
          { url: 'https://picsum.photos/seed/mouse/800/600', alt: 'Wireless Mouse', sort: 0 },
        ],
      },
      variants: {
        create: [
          {
            sku: 'MOUSE-BLK',
            priceCents: 1999,
            currency: 'usd',
            attributes: { color: 'Black' },
            inventoryOnHand: 25,
          },
          {
            sku: 'MOUSE-WHT',
            priceCents: 1999,
            currency: 'usd',
            attributes: { color: 'White' },
            inventoryOnHand: 18,
          },
        ],
      },
      categories: {
        create: [{ category: { connect: { id: accessories.id } } }],
      },
    },
  });

  // 2) Mechanical Keyboard
  await prisma.product.upsert({
    where: { slug: 'mechanical-keyboard' },
    update: {},
    create: {
      title: 'Mechanical Keyboard',
      slug: 'mechanical-keyboard',
      description: 'Hot-swappable switches, per-key RGB, aluminum case.',
      brand: 'KeyCo',
      active: true,
      images: {
        create: [
          { url: 'https://picsum.photos/seed/keyboard/800/600', alt: 'Mechanical Keyboard', sort: 0 },
        ],
      },
      variants: {
        create: [
          {
            sku: 'KB-BLUE',
            priceCents: 8999,
            currency: 'usd',
            attributes: { switch: 'Blue' },
            inventoryOnHand: 12,
          },
          {
            sku: 'KB-BROWN',
            priceCents: 8999,
            currency: 'usd',
            attributes: { switch: 'Brown' },
            inventoryOnHand: 10,
          },
        ],
      },
      categories: {
        create: [{ category: { connect: { id: keyboards.id } } }],
      },
    },
  });

  // 3) Noise-Canceling Headphones
  await prisma.product.upsert({
    where: { slug: 'noise-canceling-headphones' },
    update: {},
    create: {
      title: 'Noise-Canceling Headphones',
      slug: 'noise-canceling-headphones',
      description: 'ANC, 30-hour battery, USB-C fast charge.',
      brand: 'Sonic',
      active: true,
      images: {
        create: [
          { url: 'https://picsum.photos/seed/headphones/800/600', alt: 'Headphones', sort: 0 },
        ],
      },
      variants: {
        create: [
          {
            sku: 'HP-BLK',
            priceCents: 15999,
            currency: 'usd',
            attributes: { color: 'Black' },
            inventoryOnHand: 8,
          },
          {
            sku: 'HP-SLV',
            priceCents: 15999,
            currency: 'usd',
            attributes: { color: 'Silver' },
            inventoryOnHand: 7,
          },
        ],
      },
      categories: {
        create: [{ category: { connect: { id: audio.id } } }],
      },
    },
  });

  // 4) USB-C Hub
  await prisma.product.upsert({
    where: { slug: 'usb-c-hub' },
    update: {},
    create: {
      title: 'USB-C 7-in-1 Hub',
      slug: 'usb-c-hub',
      description: 'HDMI 4K, 2×USB-A, SD/TF, 100W PD pass-through.',
      brand: 'Connecto',
      active: true,
      images: {
        create: [
          { url: 'https://picsum.photos/seed/hub/800/600', alt: 'USB-C Hub', sort: 0 },
        ],
      },
      variants: {
        create: [
          {
            sku: 'HUB-7IN1',
            priceCents: 4499,
            currency: 'usd',
            attributes: { color: 'Space Gray' },
            inventoryOnHand: 20,
          },
        ],
      },
      categories: {
        create: [{ category: { connect: { id: hubs.id } } }],
      },
    },
  });

  // --- Users (optional, handy for auth later) ---
  await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: { role: Role.ADMIN },
    create: {
      email: 'admin@example.com',
      name: 'Admin',
      role: Role.ADMIN,
      // password can be null if you’ll use OAuth/NextAuth
    },
  });

  await prisma.user.upsert({
    where: { email: 'customer@example.com' },
    update: {},
    create: {
      email: 'customer@example.com',
      name: 'Customer',
      role: Role.CUSTOMER,
    },
  });

  console.log('✅ Seed complete: categories + 4 products + 2 users');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
