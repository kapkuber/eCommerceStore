// prisma/seed.js (ESM)
import { PrismaClient, Role } from '@prisma/client';
import { scrypt as _scrypt, randomBytes } from 'node:crypto';
import { promisify } from 'node:util';

const prisma = new PrismaClient();
const scrypt = promisify(_scrypt);

async function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  const buf = await scrypt(password, salt, 64);
  return `scrypt:${salt}:${buf.toString('hex')}`;
}

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
  await prisma.product.upsert({
    where: { slug: 'wireless-mouse' },
    update: {},
    create: {
      title: 'Wireless Mouse',
      slug: 'wireless-mouse',
      description: 'Responsive, silent clicks, 12-month battery life.',
      brand: 'Acme',
      active: true,
      images: { create: [{ url: 'https://picsum.photos/seed/mouse/800/600', alt: 'Wireless Mouse', sort: 0 }] },
      variants: {
        create: [
          { sku: 'MOUSE-BLK', priceCents: 1999, currency: 'usd', attributes: { color: 'Black' }, inventoryOnHand: 25 },
          { sku: 'MOUSE-WHT', priceCents: 1999, currency: 'usd', attributes: { color: 'White' }, inventoryOnHand: 18 },
        ],
      },
      categories: { create: [{ category: { connect: { id: accessories.id } } }] },
    },
  });

  await prisma.product.upsert({
    where: { slug: 'mechanical-keyboard' },
    update: {},
    create: {
      title: 'Mechanical Keyboard',
      slug: 'mechanical-keyboard',
      description: 'Hot-swappable switches, per-key RGB, aluminum case.',
      brand: 'KeyCo',
      active: true,
      images: { create: [{ url: 'https://picsum.photos/seed/keyboard/800/600', alt: 'Mechanical Keyboard', sort: 0 }] },
      variants: {
        create: [
          { sku: 'KB-BLUE', priceCents: 8999, currency: 'usd', attributes: { switch: 'Blue' }, inventoryOnHand: 12 },
          { sku: 'KB-BROWN', priceCents: 8999, currency: 'usd', attributes: { switch: 'Brown' }, inventoryOnHand: 10 },
        ],
      },
      categories: { create: [{ category: { connect: { id: keyboards.id } } }] },
    },
  });

  await prisma.product.upsert({
    where: { slug: 'noise-canceling-headphones' },
    update: {},
    create: {
      title: 'Noise-Canceling Headphones',
      slug: 'noise-canceling-headphones',
      description: 'ANC, 30-hour battery, USB-C fast charge.',
      brand: 'Sonic',
      active: true,
      images: { create: [{ url: 'https://picsum.photos/seed/headphones/800/600', alt: 'Headphones', sort: 0 }] },
      variants: {
        create: [
          { sku: 'HP-BLK', priceCents: 15999, currency: 'usd', attributes: { color: 'Black' }, inventoryOnHand: 8 },
          { sku: 'HP-SLV', priceCents: 15999, currency: 'usd', attributes: { color: 'Silver' }, inventoryOnHand: 7 },
        ],
      },
      categories: { create: [{ category: { connect: { id: audio.id } } }] },
    },
  });

  await prisma.product.upsert({
    where: { slug: 'usb-c-hub' },
    update: {},
    create: {
      title: 'USB-C 7-in-1 Hub',
      slug: 'usb-c-hub',
      description: 'HDMI 4K, 2A-USB-A, SD/TF, 100W PD pass-through.',
      brand: 'Connecto',
      active: true,
      images: { create: [{ url: 'https://picsum.photos/seed/hub/800/600', alt: 'USB-C Hub', sort: 0 }] },
      variants: { create: [{ sku: 'HUB-7IN1', priceCents: 4499, currency: 'usd', attributes: { color: 'Space Gray' }, inventoryOnHand: 20 }] },
      categories: { create: [{ category: { connect: { id: hubs.id } } }] },
    },
  });

  // --- Users with passwords ---
  const adminPassword = await hashPassword('admin123');
  await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: { role: Role.ADMIN, password: adminPassword },
    create: { email: 'admin@example.com', name: 'Admin', role: Role.ADMIN, password: adminPassword },
  });

  const customerPassword = await hashPassword('customer123');
  await prisma.user.upsert({
    where: { email: 'customer@example.com' },
    update: { password: customerPassword },
    create: { email: 'customer@example.com', name: 'Customer', role: Role.CUSTOMER, password: customerPassword },
  });

  console.log('Seed complete: categories + 4 products + 2 users (with passwords)');
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

