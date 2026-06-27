import { PrismaClient, Role, ProductStatus, CouponType } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Clearing database...')
  // Delete in reverse order of dependency
  await prisma.activityLog.deleteMany({})
  await prisma.review.deleteMany({})
  await prisma.ticketMessage.deleteMany({})
  await prisma.supportTicket.deleteMany({})
  await prisma.returnItem.deleteMany({})
  await prisma.return.deleteMany({})
  await prisma.orderStatusHistory.deleteMany({})
  await prisma.orderItem.deleteMany({})
  await prisma.payment.deleteMany({})
  await prisma.shipment.deleteMany({})
  await prisma.order.deleteMany({})
  await prisma.couponUsage.deleteMany({})
  await prisma.coupon.deleteMany({})
  await prisma.cartItem.deleteMany({})
  await prisma.cart.deleteMany({})
  await prisma.wishlistItem.deleteMany({})
  await prisma.wishlist.deleteMany({})
  await prisma.productImage.deleteMany({})
  await prisma.productVariant.deleteMany({})
  await prisma.product.deleteMany({})
  await prisma.brand.deleteMany({})
  await prisma.category.deleteMany({})
  await prisma.address.deleteMany({})
  await prisma.adminPermission.deleteMany({})
  await prisma.notificationPreference.deleteMany({})
  await prisma.notification.deleteMany({})
  await prisma.user.deleteMany({})
  await prisma.staticPage.deleteMany({})
  await prisma.campaign.deleteMany({})
  await prisma.banner.deleteMany({})
  await prisma.settings.deleteMany({})

  console.log('Seeding administrative users...')
  const superOwnerHash = '$2b$10$YjRo9iSWC9hwKffyOP4U9eY.yVDw5/CrbVo0Ayqp3BxsMQPuh23qC'

  const superOwner = await prisma.user.create({
    data: {
      name: 'Super Owner',
      email: 'toynjoy.online@gmail.com',
      passwordHash: superOwnerHash,
      role: Role.super_owner,
      emailVerified: true,
      adminPermissions: {
        createMany: {
          data: [
            { permission: 'manage_catalog' },
            { permission: 'manage_orders' },
            { permission: 'manage_customers' },
            { permission: 'manage_returns' },
            { permission: 'manage_support' },
            { permission: 'manage_cms' }
          ]
        }
      }
    }
  })

  const subAdmin = await prisma.user.create({
    data: {
      name: 'Sub Admin',
      email: 'admin@toynjoy.online',
      passwordHash,
      role: Role.sub_admin,
      emailVerified: true,
      adminPermissions: {
        createMany: {
          data: [
            { permission: 'manage_catalog' },
            { permission: 'manage_orders' },
            { permission: 'manage_returns' },
            { permission: 'manage_support' }
          ]
        }
      }
    }
  })

  // Create a customer user to map reviews to
  const customerUser = await prisma.user.create({
    data: {
      name: 'Emily Smith',
      email: 'emily@example.com',
      passwordHash,
      role: Role.customer,
      emailVerified: true,
      addresses: {
        create: {
          line1: '123 Forest Lane',
          line2: 'Near Oak Tree',
          city: 'Toytown',
          state: 'Oregon',
          pincode: '97401',
          phone: '1234567890',
          isDefault: true
        }
      }
    }
  })

  console.log('Seeding categories...')
  const categoriesData = [
    { name: 'Action Figures', slug: 'action-figures' },
    { name: 'Educational', slug: 'educational' },
    { name: 'Soft Toys', slug: 'soft-toys' },
    { name: 'Outdoor', slug: 'outdoor' },
    { name: 'Building Blocks', slug: 'building-blocks' },
    { name: 'Wooden Vehicles', slug: 'wooden-vehicles' }
  ]
  const categoriesMap: Record<string, string> = {}
  for (const cat of categoriesData) {
    const created = await prisma.category.create({ data: cat })
    categoriesMap[cat.name] = created.id
  }

  console.log('Seeding brands...')
  const brandsData = [
    { name: 'Forest Minds', slug: 'forest-minds' },
    { name: 'Oak & Elm', slug: 'oak-and-elm' },
    { name: 'TumbleTree', slug: 'tumbletree' },
    { name: 'EcoToys', slug: 'ecotoys' },
    { name: 'LittleSprout', slug: 'littlesprout' }
  ]
  const brandsMap: Record<string, string> = {}
  for (const b of brandsData) {
    const created = await prisma.brand.create({ data: b })
    brandsMap[b.name] = created.id
  }

  console.log('Seeding coupons...')
  await prisma.coupon.createMany({
    data: [
      {
        code: 'WELCOME10',
        type: CouponType.percent,
        value: 10, // 10%
        minOrder: 1500, // 15.00 paise/cents min order
        expiry: new Date('2027-12-31T23:59:59Z'),
        usageLimit: 100,
        usedCount: 0,
        isActive: true
      },
      {
        code: 'WOODTOY50',
        type: CouponType.flat,
        value: 500, // $5.00 / 500 paise/cents
        minOrder: 2500, // $25.00 min order
        expiry: new Date('2027-12-31T23:59:59Z'),
        usageLimit: 50,
        usedCount: 0,
        isActive: true
      }
    ]
  })

  console.log('Seeding static pages for CMS...')
  await prisma.staticPage.createMany({
    data: [
      {
        title: 'About Us',
        slug: 'about',
        content: '# About Toy-n-Joy\n\nWelcome to Toy-n-Joy, where we handcraft organic, durable, and organic wooden toys designed to inspire imagination and joy across generations.',
        isActive: true
      },
      {
        title: 'Contact Us',
        slug: 'contact',
        content: '# Contact Us\n\nHave questions or custom orders? Reach out to us at support@toynjoy.online or call us at 1-800-TOY-CABIN.',
        isActive: true
      },
      {
        title: 'Shipping Policy',
        slug: 'shipping-policy',
        content: '# Shipping Policy\n\nWe offer free shipping on all orders over $50. For orders below $50, a flat shipping fee of $5 applies. Shipments are packed and dispatched via Shiprocket within 24-48 hours.',
        isActive: true
      },
      {
        title: 'Return Policy',
        slug: 'return-policy',
        content: '# Return Policy\n\nWe offer a warm-hearted 7-day return policy on all our handcrafted wooden toys. Toys must be in their original packaging and unused. Returns can be initiated from your order history panel.',
        isActive: true
      },
      {
        title: 'Frequently Asked Questions',
        slug: 'faq',
        content: '# FAQ\n\n**Q: Are your toys safe?**\nYes! All toys are crafted from organic hardwoods and finished with non-toxic, child-safe oils and water-based paints.\n\n**Q: How do I track my order?**\nOnce shipped, you can track your order live from your Orders page.',
        isActive: true
      },
      {
        title: 'Terms of Service',
        slug: 'terms-of-service',
        content: '# Terms of Service\n\nBy using the Toy-n-Joy store, you agree to comply with our terms of service, payment terms, and delivery policies.',
        isActive: true
      },
      {
        title: 'Privacy Policy',
        slug: 'privacy-policy',
        content: '# Privacy Policy\n\nThis Privacy Policy explains how Toy-n-Joy collects, uses, and protects your personal data when you visit our website or complete purchases.',
        isActive: true
      }
    ]
  })

  console.log('Seeding products, variants, and reviews...')
  const mockProducts = [
    {
      title: 'Classic Wooden Train Set',
      slug: 'classic-wooden-train-set',
      description: 'A beautifully crafted, hand-painted wooden train set featuring 3 magnetic train cars and 12 pieces of interlocking track. Made from premium beechwood and painted with non-toxic, water-based finishes. Perfect for developing fine motor skills and spatial awareness.',
      price: 39.99,
      discountPrice: 34.99,
      brand: 'Oak & Elm',
      category: 'Wooden Vehicles',
      ageGroup: '3-5 years',
      status: ProductStatus.active,
      variants: [
        { name: 'Classic Red/Blue', stock: 15, sku: 'TOY-TRAIN-RED' },
        { name: 'Natural Wood', stock: 8, sku: 'TOY-TRAIN-NAT' }
      ],
      reviews: [
        { reviewerName: 'Emily S.', rating: 5, comment: 'High quality wood and very durable! My 3-year-old loves playing with it every day.', date: '2026-05-10' },
        { reviewerName: 'Marcus T.', rating: 4, comment: 'Very nice set, though I wish there were a few more track pieces included.', date: '2026-05-28' }
      ],
      imageR2Key: 'products/1/main.webp'
    },
    {
      title: 'Rainbow Nesting Blocks',
      slug: 'rainbow-nesting-blocks',
      description: 'A versatile stacking and nesting set featuring 7 vibrant rainbow-colored wooden blocks. Helps teach children sizing, sequencing, color recognition, and hand-eye coordination. Smooth edges and child-safe finishes.',
      price: 24.99,
      discountPrice: 19.99,
      brand: 'Forest Minds',
      category: 'Educational',
      ageGroup: '1-3 years',
      status: ProductStatus.active,
      variants: [
        { name: 'Pastel Rainbow', stock: 12, sku: 'TOY-RAIN-PAS' },
        { name: 'Classic Rainbow', stock: 20, sku: 'TOY-RAIN-CLA' }
      ],
      reviews: [
        { reviewerName: 'Jane D.', rating: 5, comment: 'Beautiful colors and super smooth. Highly recommend for toddlers!', date: '2026-04-15' },
        { reviewerName: 'Robert L.', rating: 5, comment: 'Simple toy but keeps my daughter occupied for hours. Solid build.', date: '2026-05-01' }
      ],
      imageR2Key: 'products/2/main.webp'
    },
    {
      title: 'Balancing Acrobat Figurines',
      slug: 'balancing-acrobat-figurines',
      description: 'Stack them, balance them, create pyramids! This set of 10 wooden acrobat figurines features grooved hands and feet, enabling endless balancing configurations. Promotes logical thinking and concentration.',
      price: 18.99,
      discountPrice: 14.99,
      brand: 'TumbleTree',
      category: 'Action Figures',
      ageGroup: '5-7 years',
      status: ProductStatus.active,
      variants: [
        { name: 'Standard Pack', stock: 3, sku: 'TOY-ACRO-STD' }
      ],
      reviews: [
        { reviewerName: 'Sarah K.', rating: 4, comment: 'Challenging but fun. The wood smells amazing and feels premium.', date: '2026-03-20' },
        { reviewerName: 'Kevin P.', rating: 5, comment: 'Excellent dexterity toy. Fun for adults too!', date: '2026-03-22' }
      ],
      imageR2Key: 'products/3/main.webp'
    },
    {
      title: 'Wooden Building Logs (100pc)',
      slug: 'wooden-building-logs-100pc',
      description: 'Build your own cabins, castles, and fortresses with this classic 100-piece natural pine log cabin set. Features notch-locking logs that fit together smoothly. Comes with a cotton storage bag.',
      price: 49.99,
      discountPrice: 42.99,
      brand: 'Oak & Elm',
      category: 'Building Blocks',
      ageGroup: '5-7 years',
      status: ProductStatus.active,
      variants: [
        { name: 'Natural Pine', stock: 25, sku: 'TOY-LOGS-100' }
      ],
      reviews: [
        { reviewerName: 'Alice W.', rating: 5, comment: 'Reminds me of my childhood. Great build quality, real wood smell.', date: '2026-06-01' },
        { reviewerName: 'Dave H.', rating: 4, comment: 'Good value for 100 pieces. Box was slightly damaged on arrival but toys are fine.', date: '2026-06-05' }
      ],
      imageR2Key: 'products/4/main.webp'
    },
    {
      title: 'Forest Animals Matching Game',
      slug: 'forest-animals-matching-game',
      description: 'A 24-piece memory matching game featuring cute, hand-illustrated forest animal designs printed directly onto birchwood tiles. Helps develop memory and concentration skills. Includes a storage box.',
      price: 19.99,
      discountPrice: 16.99,
      brand: 'Forest Minds',
      category: 'Educational',
      ageGroup: '1-3 years',
      status: ProductStatus.active,
      variants: [
        { name: 'Standard', stock: 18, sku: 'TOY-MATCH-STD' }
      ],
      reviews: [
        { reviewerName: 'Chloe F.', rating: 4, comment: 'Lovely illustrations. Tile edges are rounded and safe.', date: '2026-04-10' },
        { reviewerName: 'Paul G.', rating: 5, comment: 'Perfect stocking stuffer. High quality print.', date: '2026-04-18' }
      ],
      imageR2Key: 'products/5/main.webp'
    },
    {
      title: 'Pull-Along Wooden Duck',
      slug: 'pull-along-wooden-duck',
      description: 'A cute pull-along toddler companion that waddles as it is pulled across the floor. Features rubber-rimmed wheels to protect floors. Handcrafted from durable cherrywood.',
      price: 15.99,
      discountPrice: 12.99,
      brand: 'EcoToys',
      category: 'Wooden Vehicles',
      ageGroup: '0-1 years',
      status: ProductStatus.active,
      variants: [
        { name: 'Yellow Duck', stock: 14, sku: 'TOY-DUCK-YEL' },
        { name: 'Natural Duck', stock: 10, sku: 'TOY-DUCK-NAT' }
      ],
      reviews: [
        { reviewerName: 'Megan M.', rating: 5, comment: 'So adorable! The waddle motion is hilarious and my baby loves it.', date: '2026-05-15' },
        { reviewerName: 'Tom L.', rating: 3, comment: 'Nice toy, but string is a bit short for a taller toddler.', date: '2026-05-22' }
      ],
      imageR2Key: 'products/6/main.webp'
    },
    {
      title: 'Garden Vegetable Lacing Toy',
      slug: 'garden-vegetable-lacing-toy',
      description: 'Develop fine motor skills with this wooden board shaped like a garden. Lace the wooden carrots, tomatoes, and broccoli through the holes. Encourages focus and precise motor skills.',
      price: 12.99,
      discountPrice: 9.99,
      brand: 'LittleSprout',
      category: 'Educational',
      ageGroup: '1-3 years',
      status: ProductStatus.active,
      variants: [
        { name: 'Standard Set', stock: 30, sku: 'TOY-LACE-VEG' }
      ],
      reviews: [
        { reviewerName: 'Anna B.', rating: 5, comment: 'Very high quality lace and sturdy wooden pieces. Highly educational!', date: '2026-05-30' },
        { reviewerName: 'Chris B.', rating: 4, comment: 'Cute and effective for motor skill training.', date: '2026-06-02' }
      ],
      imageR2Key: 'products/7/main.webp'
    },
    {
      title: 'Wooden Ring Toss Set',
      slug: 'wooden-ring-toss-set',
      description: 'An active, skill-building outdoor game for the whole family. Features a solid pine base, 5 pegs, and 5 hand-woven rope rings. Perfect for backyard gatherings, parks, or indoor play on rainy days.',
      price: 29.99,
      discountPrice: 24.99,
      brand: 'TumbleTree',
      category: 'Outdoor',
      ageGroup: '5-7 years',
      status: ProductStatus.active,
      variants: [
        { name: 'Classic Rope', stock: 10, sku: 'TOY-TOSS-ROP' }
      ],
      reviews: [
        { reviewerName: 'Danielle K.', rating: 5, comment: 'Perfect for family games night. Sturdy and well-packaged.', date: '2026-06-08' },
        { reviewerName: 'Steve M.', rating: 4, comment: 'Easy to set up and high quality, but rope rings can shed slightly.', date: '2026-06-10' }
      ],
      imageR2Key: 'products/8/main.webp'
    },
    {
      title: 'Geometric Shape Sorter',
      slug: 'geometric-shape-sorter',
      description: 'A classic toddler sorting cube featuring 12 different colorful geometric shapes to drop into corresponding holes. Teaches shapes, colors, and improves hand-eye coordination.',
      price: 22.99,
      discountPrice: 17.99,
      brand: 'Forest Minds',
      category: 'Educational',
      ageGroup: '1-3 years',
      status: ProductStatus.active,
      variants: [
        { name: 'Bright Colors', stock: 22, sku: 'TOY-SHAPE-BRT' },
        { name: 'Pastel Colors', stock: 15, sku: 'TOY-SHAPE-PAS' }
      ],
      reviews: [
        { reviewerName: 'Laura H.', rating: 5, comment: 'Very sturdy box, shapes fit perfectly without jamming.', date: '2026-04-20' },
        { reviewerName: 'Josh W.', rating: 4, comment: 'Great gift. Solid wood.', date: '2026-05-12' }
      ],
      imageR2Key: 'products/9/main.webp'
    },
    {
      title: 'Vintage Race Car Racer',
      slug: 'vintage-race-car-racer',
      description: 'A sleek, aerodynamic wooden race car designed for speed and smooth rolling. Features metal axles and rubber wheels. Crafted from single-block walnut wood for premium look and feel.',
      price: 17.99,
      discountPrice: 14.99,
      brand: 'EcoToys',
      category: 'Wooden Vehicles',
      ageGroup: '3-5 years',
      status: ProductStatus.active,
      variants: [
        { name: 'Walnut Dark', stock: 11, sku: 'TOY-RACE-WLN' },
        { name: 'Maple Light', stock: 15, sku: 'TOY-RACE-MAP' }
      ],
      reviews: [
        { reviewerName: 'Ethan P.', rating: 5, comment: 'Absolutely beautiful. Looks great as a decor item when not played with!', date: '2026-03-14' },
        { reviewerName: 'Nate D.', rating: 4, comment: 'Rolls very smooth and fast. My son loves racing it.', date: '2026-03-25' }
      ],
      imageR2Key: 'products/10/main.webp'
    },
    {
      title: 'Wooden Knight & Castle Figures',
      slug: 'wooden-knight-castle-figures',
      description: 'Set of 6 wooden knights, princesses, and dragons designed for imaginative storytelling and role-play. Sturdy base enables free-standing setup. Non-toxic organic varnish.',
      price: 19.99,
      discountPrice: 15.99,
      brand: 'TumbleTree',
      category: 'Action Figures',
      ageGroup: '3-5 years',
      status: ProductStatus.active,
      variants: [
        { name: 'Standard Figures', stock: 16, sku: 'TOY-FIG-KNI' }
      ],
      reviews: [
        { reviewerName: 'Mark U.', rating: 5, comment: 'My kids make up stories all day with these. Safe paint and solid wood.', date: '2026-06-03' },
        { reviewerName: 'Fiona C.', rating: 4, comment: 'Great detailed drawings, the dragon is very cool.', date: '2026-06-11' }
      ],
      imageR2Key: 'products/11/main.webp'
    },
    {
      title: 'Multi-Activity Center Cube',
      slug: 'multi-activity-center-cube',
      description: 'A 5-in-1 sensory exploration box featuring a bead maze, clock pointers, gears, sliding paths, and animal sliders. Stimulates cognitive growth and exploration.',
      price: 59.99,
      discountPrice: 49.99,
      brand: 'Forest Minds',
      category: 'Educational',
      ageGroup: '1-3 years',
      status: ProductStatus.active,
      variants: [
        { name: 'Forest Activity Cube', stock: 8, sku: 'TOY-CUBE-ACT' }
      ],
      reviews: [
        { reviewerName: 'Gail M.', rating: 5, comment: 'Amazing! Keeps my 18-month-old engaged. Super stable and did not tip over.', date: '2026-05-18' },
        { reviewerName: 'Rita P.', rating: 5, comment: 'Beautiful construction and so many things for tiny hands to do.', date: '2026-05-24' }
      ],
      imageR2Key: 'products/12/main.webp'
    },
    {
      title: 'Wooden Blocks City Set (80pc)',
      slug: 'wooden-blocks-city-set-80pc',
      description: 'Build a bustling miniature metropolis with this 80-piece colored building block set. Includes arches, columns, bridges, and customized blocks with window and door details.',
      price: 34.99,
      discountPrice: 29.99,
      brand: 'Oak & Elm',
      category: 'Building Blocks',
      ageGroup: '3-5 years',
      status: ProductStatus.active,
      variants: [
        { name: 'Pastel City', stock: 14, sku: 'TOY-CITY-PAS' },
        { name: 'Vibrant City', stock: 12, sku: 'TOY-CITY-VIB' }
      ],
      reviews: [
        { reviewerName: 'Liam O.', rating: 4, comment: 'Fabulous building blocks, nice paint coating that does not chip easily.', date: '2026-04-05' },
        { reviewerName: 'Diana R.', rating: 5, comment: 'My grandson builds the most creative skyscrapers with this set.', date: '2026-04-12' }
      ],
      imageR2Key: 'products/13/main.webp'
    },
    {
      title: 'Miniature Wooden Tool Bench',
      slug: 'miniature-wooden-tool-bench',
      description: 'A mini builder toy bench equipped with wooden tools: hammer, screwdriver, wrench, nuts, bolts, and gears. Teaches structural design and basic mechanical coordination.',
      price: 32.99,
      discountPrice: 27.99,
      brand: 'Forest Minds',
      category: 'Educational',
      ageGroup: '3-5 years',
      status: ProductStatus.active,
      variants: [
        { name: 'Standard Tool Set', stock: 4, sku: 'TOY-BENCH-STD' }
      ],
      reviews: [
        { reviewerName: 'Ben J.', rating: 4, comment: 'Perfect toddler scale, screws turn easily and threads are smooth.', date: '2026-05-19' },
        { reviewerName: 'Lily T.', rating: 5, comment: 'Great tool bench! Wood is smooth and tools look very realistic.', date: '2026-05-27' }
      ],
      imageR2Key: 'products/14/main.webp'
    },
    {
      title: 'Wooden Bowling Pins Game',
      slug: 'wooden-bowling-pins-game',
      description: 'Includes 6 friendly wooden animal bowling pins and 2 solid wooden balls. Excellent for developing coordination, aiming skills, and mathematical scoring.',
      price: 27.99,
      discountPrice: 22.99,
      brand: 'TumbleTree',
      category: 'Outdoor',
      ageGroup: '3-5 years',
      status: ProductStatus.active,
      variants: [
        { name: 'Safari Animal Pins', stock: 15, sku: 'TOY-BOWL-SAF' }
      ],
      reviews: [
        { reviewerName: 'Owen S.', rating: 4, comment: 'Cute safari characters, they stand up nicely on flat lawn and carpet.', date: '2026-05-08' },
        { reviewerName: 'Hannah G.', rating: 5, comment: 'Very sturdy, survives heavy throws and falls. Safe paint.', date: '2026-05-14' }
      ],
      imageR2Key: 'products/15/main.webp'
    },
    {
      title: 'Classic Wooden Abacus',
      slug: 'classic-wooden-abacus',
      description: 'A traditional calculation board featuring 10 rows of 10 colored wooden beads. Perfect for early arithmetic calculations, addition, subtraction, and multiplication training.',
      price: 14.99,
      discountPrice: 11.99,
      brand: 'LittleSprout',
      category: 'Educational',
      ageGroup: '5-7 years',
      status: ProductStatus.active,
      variants: [
        { name: 'Standard Abacus', stock: 18, sku: 'TOY-ABAC-STD' }
      ],
      reviews: [
        { reviewerName: 'Grace A.', rating: 5, comment: 'Great educational visual aid. Sturdy frame and smooth sliding beads.', date: '2026-06-04' },
        { reviewerName: 'Ryan E.', rating: 4, comment: 'Standard size, good build quality, colors are bright and clean.', date: '2026-06-07' }
      ],
      imageR2Key: 'products/16/main.webp'
    },
    {
      title: 'Little Forest Cuddly Rabbit',
      slug: 'little-forest-cuddly-rabbit',
      description: 'A unique hybrid soft toy containing a soft organic cotton plush body with a smooth, handcrafted cherrywood teething ring as ears. Soft and safe for new infants.',
      price: 16.99,
      discountPrice: 13.99,
      brand: 'LittleSprout',
      category: 'Soft Toys',
      ageGroup: '0-1 years',
      status: ProductStatus.active,
      variants: [
        { name: 'Soft Gray', stock: 20, sku: 'TOY-RAB-GRY' },
        { name: 'Pastel Pink', stock: 14, sku: 'TOY-RAB-PNK' }
      ],
      reviews: [
        { reviewerName: 'Kim Y.', rating: 5, comment: 'My teething daughter loves gnawing on the wooden ears, very easy to wash.', date: '2026-05-29' },
        { reviewerName: 'Oliver D.', rating: 5, comment: 'Incredibly soft and lightweight. Wood ring has no splinters or sharp edges.', date: '2026-06-02' }
      ],
      imageR2Key: 'products/17/main.webp'
    },
    {
      title: 'Tactile Wooden Sound Blocks',
      slug: 'tactile-wooden-sound-blocks',
      description: 'Set of 6 hollow wooden blocks, each containing different hidden materials (beads, bells, sand) that emit unique rattling sounds. Teaches sound differentiation.',
      price: 21.99,
      discountPrice: 18.99,
      brand: 'Forest Minds',
      category: 'Educational',
      ageGroup: '0-1 years',
      status: ProductStatus.active,
      variants: [
        { name: 'Sound Blocks', stock: 15, sku: 'TOY-SND-BLKS' }
      ],
      reviews: [
        { reviewerName: 'Zoe R.', rating: 4, comment: 'Very interesting sensory toy. Sturdy seals so contents never leak.', date: '2026-04-15' },
        { reviewerName: 'Victor M.', rating: 5, comment: 'Each block has different colors and visual patterns too. Great design.', date: '2026-05-02' }
      ],
      imageR2Key: 'products/18/main.webp'
    },
    {
      title: 'Wooden Helicopter Transport',
      slug: 'wooden-helicopter-transport',
      description: 'A chunky toy helicopter featuring a rotating main rotor blade and rolling landing wheels. Fits miniature peg pilots. Made from maple and birchwood.',
      price: 19.99,
      discountPrice: 15.99,
      brand: 'EcoToys',
      category: 'Wooden Vehicles',
      ageGroup: '3-5 years',
      status: ProductStatus.active,
      variants: [
        { name: 'Rescue Red', stock: 10, sku: 'TOY-HELI-RED' },
        { name: 'Police Blue', stock: 12, sku: 'TOY-HELI-BLU' }
      ],
      reviews: [
        { reviewerName: 'Leo V.', rating: 4, comment: 'Rotor blade rotates very easily. Sturdy enough to survive toddler throws.', date: '2026-05-22' },
        { reviewerName: 'Mona W.', rating: 5, comment: 'Sleek design, fits peg people from other popular sets as well.', date: '2026-06-01' }
      ],
      imageR2Key: 'products/19/main.webp'
    },
    {
      title: 'Safari Animals Puzzle',
      slug: 'safari-animals-puzzle',
      description: 'A 3D wooden puzzle containing chunky safari animals that stand upright on their own. Fits together on a solid wood tray. Builds puzzle-solving and story-making skills.',
      price: 18.99,
      discountPrice: 15.99,
      brand: 'LittleSprout',
      category: 'Educational',
      ageGroup: '1-3 years',
      status: ProductStatus.active,
      variants: [
        { name: 'Safari Animals', stock: 0, sku: 'TOY-PZL-SAF' }
      ],
      reviews: [
        { reviewerName: 'Mia L.', rating: 5, comment: 'Outstanding! The animal pieces are thick enough to play with separately.', date: '2026-06-06' },
        { reviewerName: 'Garry P.', rating: 4, comment: 'Very high quality, though puzzle slot was tight initially.', date: '2026-06-08' }
      ],
      imageR2Key: 'products/20/main.webp'
    }
  ]

  for (const prod of mockProducts) {
    const categoryId = categoriesMap[prod.category]
    const brandId = brandsMap[prod.brand]

    if (!categoryId || !brandId) {
      console.warn(`Skipping product ${prod.title} due to missing brand/category mappings.`)
      continue
    }

    const averageRating = prod.reviews.length > 0
      ? prod.reviews.reduce((sum, r) => sum + r.rating, 0) / prod.reviews.length
      : 0.0
    const reviewCount = prod.reviews.length

    const createdProd = await prisma.product.create({
      data: {
        title: prod.title,
        slug: prod.slug,
        description: prod.description,
        categoryId,
        brandId,
        ageGroup: prod.ageGroup,
        basePrice: Math.round(prod.price * 100), // convert to paise/cents
        discountPrice: prod.discountPrice ? Math.round(prod.discountPrice * 100) : null,
        status: prod.status,
        createdBy: superOwner.id,
        rating: averageRating,
        reviewCount,
        images: {
          create: {
            r2Key: prod.imageR2Key,
            url: `https://media.nilkanthtoys.com/${prod.imageR2Key}`,
            position: 0
          }
        }
      }
    })

    // Create Variants
    for (const v of prod.variants) {
      await prisma.productVariant.create({
        data: {
          productId: createdProd.id,
          attributes: { name: v.name },
          sku: v.sku,
          stock: v.stock
        }
      })
    }

    // Create Reviews
    for (const r of prod.reviews) {
      const reviewerEmail = `${r.reviewerName.toLowerCase().replace(/[^a-z0-9]/g, '')}@example.com`
      let reviewerUser = await prisma.user.findUnique({
        where: { email: reviewerEmail }
      })
      if (!reviewerUser) {
        reviewerUser = await prisma.user.create({
          data: {
            name: r.reviewerName,
            email: reviewerEmail,
            passwordHash,
            role: Role.customer,
            emailVerified: true
          }
        })
      }

      await prisma.review.create({
        data: {
          productId: createdProd.id,
          userId: reviewerUser.id,
          rating: r.rating,
          text: r.comment,
          createdAt: new Date(r.date)
        }
      })
    }
  }

  console.log('Seeding global settings...')
  await prisma.settings.create({
    data: {
      id: 'global',
      storeName: 'Toy-n-Joy',
      supportContact: 'support@toynjoy.online',
      currency: 'INR',
      lowStockThreshold: 10,
      codToggle: true,
      onlineToggle: true
    }
  })

  console.log('Seeding banners...')
  await prisma.banner.createMany({
    data: [
      {
        r2Key: 'banners/hero_train.jpg',
        url: 'https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?q=80&w=1200&auto=format&fit=crop',
        link: '/products?category=wooden-vehicles',
        position: 0,
        isActive: true
      },
      {
        r2Key: 'banners/hero_rainbow.jpg',
        url: 'https://images.unsplash.com/photo-1537655780520-1e392edd816a?q=80&w=1200&auto=format&fit=crop',
        link: '/products?category=educational',
        position: 1,
        isActive: true
      }
    ]
  })

  console.log('Seeding completed successfully!')
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
