export interface Review {
  id: string
  reviewerName: string
  rating: number
  comment: string
  date: string
  userId?: string
}

export interface Variant {
  name: string
  stock: number
}

export interface Product {
  id: string
  title: string
  slug: string
  description: string
  price: number
  discountPrice: number
  brand: string
  category: string
  ageGroup: string
  rating: number
  stockStatus: 'In Stock' | 'Low Stock' | 'Out of Stock'
  variants: Variant[]
  reviews: Review[]
  imageColor: string // CSS color class to make the visual boxes beautiful
  image?: string
  images?: { id?: string; r2Key?: string; url: string; position?: number }[]
}

export const CATEGORIES = [
  'Action Figures',
  'Educational',
  'Soft Toys',
  'Outdoor',
  'Building Blocks',
  'Wooden Vehicles'
]

export const BRANDS = [
  'Forest Minds',
  'Oak & Elm',
  'TumbleTree',
  'EcoToys',
  'LittleSprout'
]

export const AGE_GROUPS = [
  '0-1 years',
  '1-3 years',
  '3-5 years',
  '5-7 years',
  '8+ years'
]

export const MOCK_PRODUCTS: Product[] = [
  {
    id: '1',
    title: 'Classic Wooden Train Set',
    slug: 'classic-wooden-train-set',
    description: 'A beautifully crafted, hand-painted wooden train set featuring 3 magnetic train cars and 12 pieces of interlocking track. Made from premium beechwood and painted with non-toxic, water-based finishes. Perfect for developing fine motor skills and spatial awareness.',
    price: 39.99,
    discountPrice: 34.99,
    brand: 'Oak & Elm',
    category: 'Wooden Vehicles',
    ageGroup: '3-5 years',
    rating: 4.8,
    stockStatus: 'In Stock',
    variants: [
      { name: 'Classic Red/Blue', stock: 15 },
      { name: 'Natural Wood', stock: 8 }
    ],
    reviews: [
      { id: 'r1', reviewerName: 'Emily S.', rating: 5, comment: 'High quality wood and very durable! My 3-year-old loves playing with it every day.', date: '2026-05-10' },
      { id: 'r2', reviewerName: 'Marcus T.', rating: 4, comment: 'Very nice set, though I wish there were a few more track pieces included.', date: '2026-05-28' }
    ],
    imageColor: 'bg-accent-blue'
  },
  {
    id: '2',
    title: 'Rainbow Nesting Blocks',
    slug: 'rainbow-nesting-blocks',
    description: 'A versatile stacking and nesting set featuring 7 vibrant rainbow-colored wooden blocks. Helps teach children sizing, sequencing, color recognition, and hand-eye coordination. Smooth edges and child-safe finishes.',
    price: 24.99,
    discountPrice: 19.99,
    brand: 'Forest Minds',
    category: 'Educational',
    ageGroup: '1-3 years',
    rating: 4.9,
    stockStatus: 'In Stock',
    variants: [
      { name: 'Pastel Rainbow', stock: 12 },
      { name: 'Classic Rainbow', stock: 20 }
    ],
    reviews: [
      { id: 'r3', reviewerName: 'Jane D.', rating: 5, comment: 'Beautiful colors and super smooth. Highly recommend for toddlers!', date: '2026-04-15' },
      { id: 'r4', reviewerName: 'Robert L.', rating: 5, comment: 'Simple toy but keeps my daughter occupied for hours. Solid build.', date: '2026-05-01' }
    ],
    imageColor: 'bg-accent-yellow'
  },
  {
    id: '3',
    title: 'Balancing Acrobat Figurines',
    slug: 'balancing-acrobat-figurines',
    description: 'Stack them, balance them, create pyramids! This set of 10 wooden acrobat figurines features grooved hands and feet, enabling endless balancing configurations. Promotes logical thinking and concentration.',
    price: 18.99,
    discountPrice: 14.99,
    brand: 'TumbleTree',
    category: 'Action Figures',
    ageGroup: '5-7 years',
    rating: 4.6,
    stockStatus: 'Low Stock',
    variants: [
      { name: 'Standard Pack', stock: 3 }
    ],
    reviews: [
      { id: 'r5', reviewerName: 'Sarah K.', rating: 4, comment: 'Challenging but fun. The wood smells amazing and feels premium.', date: '2026-03-20' },
      { id: 'r6', reviewerName: 'Kevin P.', rating: 5, comment: 'Excellent dexterity toy. Fun for adults too!', date: '2026-03-22' }
    ],
    imageColor: 'bg-primary'
  },
  {
    id: '4',
    title: 'Wooden Building Logs (100pc)',
    slug: 'wooden-building-logs-100pc',
    description: 'Build your own cabins, castles, and fortresses with this classic 100-piece natural pine log cabin set. Features notch-locking logs that fit together smoothly. Comes with a cotton storage bag.',
    price: 49.99,
    discountPrice: 42.99,
    brand: 'Oak & Elm',
    category: 'Building Blocks',
    ageGroup: '5-7 years',
    rating: 4.7,
    stockStatus: 'In Stock',
    variants: [
      { name: 'Natural Pine', stock: 25 }
    ],
    reviews: [
      { id: 'r7', reviewerName: 'Alice W.', rating: 5, comment: 'Reminds me of my childhood. Great build quality, real wood smell.', date: '2026-06-01' },
      { id: 'r8', reviewerName: 'Dave H.', rating: 4, comment: 'Good value for 100 pieces. Box was slightly damaged on arrival but toys are fine.', date: '2026-06-05' }
    ],
    imageColor: 'bg-primary'
  },
  {
    id: '5',
    title: 'Forest Animals Matching Game',
    slug: 'forest-animals-matching-game',
    description: 'A 24-piece memory matching game featuring cute, hand-illustrated forest animal designs printed directly onto birchwood tiles. Helps develop memory and concentration skills. Includes a storage box.',
    price: 19.99,
    discountPrice: 16.99,
    brand: 'Forest Minds',
    category: 'Educational',
    ageGroup: '1-3 years',
    rating: 4.5,
    stockStatus: 'In Stock',
    variants: [
      { name: 'Standard', stock: 18 }
    ],
    reviews: [
      { id: 'r9', reviewerName: 'Chloe F.', rating: 4, comment: 'Lovely illustrations. Tile edges are rounded and safe.', date: '2026-04-10' },
      { id: 'r10', reviewerName: 'Paul G.', rating: 5, comment: 'Perfect stocking stuffer. High quality print.', date: '2026-04-18' }
    ],
    imageColor: 'bg-accent-teal'
  },
  {
    id: '6',
    title: 'Pull-Along Wooden Duck',
    slug: 'pull-along-wooden-duck',
    description: 'A cute pull-along toddler companion that waddles as it is pulled across the floor. Features rubber-rimmed wheels to protect floors. Handcrafted from durable cherrywood.',
    price: 15.99,
    discountPrice: 12.99,
    brand: 'EcoToys',
    category: 'Wooden Vehicles',
    ageGroup: '0-1 years',
    rating: 4.4,
    stockStatus: 'In Stock',
    variants: [
      { name: 'Yellow Duck', stock: 14 },
      { name: 'Natural Duck', stock: 10 }
    ],
    reviews: [
      { id: 'r11', reviewerName: 'Megan M.', rating: 5, comment: 'So adorable! The waddle motion is hilarious and my baby loves it.', date: '2026-05-15' },
      { id: 'r12', reviewerName: 'Tom L.', rating: 3, comment: 'Nice toy, but string is a bit short for a taller toddler.', date: '2026-05-22' }
    ],
    imageColor: 'bg-accent-yellow'
  },
  {
    id: '7',
    title: 'Garden Vegetable Lacing Toy',
    slug: 'garden-vegetable-lacing-toy',
    description: 'Develop fine motor skills with this wooden board shaped like a garden. Lace the wooden carrots, tomatoes, and broccoli through the holes. Encourages focus and precise motor skills.',
    price: 12.99,
    discountPrice: 9.99,
    brand: 'LittleSprout',
    category: 'Educational',
    ageGroup: '1-3 years',
    rating: 4.7,
    stockStatus: 'In Stock',
    variants: [
      { name: 'Standard Set', stock: 30 }
    ],
    reviews: [
      { id: 'r13', reviewerName: 'Anna B.', rating: 5, comment: 'Very high quality lace and sturdy wooden pieces. Highly educational!', date: '2026-05-30' },
      { id: 'r14', reviewerName: 'Chris B.', rating: 4, comment: 'Cute and effective for motor skill training.', date: '2026-06-02' }
    ],
    imageColor: 'bg-accent-teal'
  },
  {
    id: '8',
    title: 'Wooden Ring Toss Set',
    slug: 'wooden-ring-toss-set',
    description: 'An active, skill-building outdoor game for the whole family. Features a solid pine base, 5 pegs, and 5 hand-woven rope rings. Perfect for backyard gatherings, parks, or indoor play on rainy days.',
    price: 29.99,
    discountPrice: 24.99,
    brand: 'TumbleTree',
    category: 'Outdoor',
    ageGroup: '5-7 years',
    rating: 4.8,
    stockStatus: 'In Stock',
    variants: [
      { name: 'Classic Rope', stock: 10 }
    ],
    reviews: [
      { id: 'r15', reviewerName: 'Danielle K.', rating: 5, comment: 'Perfect for family games night. Sturdy and well-packaged.', date: '2026-06-08' },
      { id: 'r16', reviewerName: 'Steve M.', rating: 4, comment: 'Easy to set up and high quality, but rope rings can shed slightly.', date: '2026-06-10' }
    ],
    imageColor: 'bg-accent-blue'
  },
  {
    id: '9',
    title: 'Geometric Shape Sorter',
    slug: 'geometric-shape-sorter',
    description: 'A classic toddler sorting cube featuring 12 different colorful geometric shapes to drop into corresponding holes. Teaches shapes, colors, and improves hand-eye coordination.',
    price: 22.99,
    discountPrice: 17.99,
    brand: 'Forest Minds',
    category: 'Educational',
    ageGroup: '1-3 years',
    rating: 4.6,
    stockStatus: 'In Stock',
    variants: [
      { name: 'Bright Colors', stock: 22 },
      { name: 'Pastel Colors', stock: 15 }
    ],
    reviews: [
      { id: 'r17', reviewerName: 'Laura H.', rating: 5, comment: 'Very sturdy box, shapes fit perfectly without jamming.', date: '2026-04-20' },
      { id: 'r18', reviewerName: 'Josh W.', rating: 4, comment: 'Great gift. Solid wood.', date: '2026-05-12' }
    ],
    imageColor: 'bg-primary'
  },
  {
    id: '10',
    title: 'Vintage Race Car Racer',
    slug: 'vintage-race-car-racer',
    description: 'A sleek, aerodynamic wooden race car designed for speed and smooth rolling. Features metal axles and rubber wheels. Crafted from single-block walnut wood for premium look and feel.',
    price: 17.99,
    discountPrice: 14.99,
    brand: 'EcoToys',
    category: 'Wooden Vehicles',
    ageGroup: '3-5 years',
    rating: 4.5,
    stockStatus: 'In Stock',
    variants: [
      { name: 'Walnut Dark', stock: 11 },
      { name: 'Maple Light', stock: 15 }
    ],
    reviews: [
      { id: 'r19', reviewerName: 'Ethan P.', rating: 5, comment: 'Absolutely beautiful. Looks great as a decor item when not played with!', date: '2026-03-14' },
      { id: 'r20', reviewerName: 'Nate D.', rating: 4, comment: 'Rolls very smooth and fast. My son loves racing it.', date: '2026-03-25' }
    ],
    imageColor: 'bg-secondary'
  },
  {
    id: '11',
    title: 'Wooden Knight & Castle Figures',
    slug: 'wooden-knight-castle-figures',
    description: 'Set of 6 wooden knights, princesses, and dragons designed for imaginative storytelling and role-play. Sturdy base enables free-standing setup. Non-toxic organic varnish.',
    price: 19.99,
    discountPrice: 15.99,
    brand: 'TumbleTree',
    category: 'Action Figures',
    ageGroup: '3-5 years',
    rating: 4.7,
    stockStatus: 'In Stock',
    variants: [
      { name: 'Standard Figures', stock: 16 }
    ],
    reviews: [
      { id: 'r21', reviewerName: 'Mark U.', rating: 5, comment: 'My kids make up stories all day with these. Safe paint and solid wood.', date: '2026-06-03' },
      { id: 'r22', reviewerName: 'Fiona C.', rating: 4, comment: 'Great detailed drawings, the dragon is very cool.', date: '2026-06-11' }
    ],
    imageColor: 'bg-primary'
  },
  {
    id: '12',
    title: 'Multi-Activity Center Cube',
    slug: 'multi-activity-center-cube',
    description: 'A 5-in-1 sensory exploration box featuring a bead maze, clock pointers, gears, sliding paths, and animal sliders. Stimulates cognitive growth and exploration.',
    price: 59.99,
    discountPrice: 49.99,
    brand: 'Forest Minds',
    category: 'Educational',
    ageGroup: '1-3 years',
    rating: 4.9,
    stockStatus: 'In Stock',
    variants: [
      { name: 'Forest Activity Cube', stock: 8 }
    ],
    reviews: [
      { id: 'r23', reviewerName: 'Gail M.', rating: 5, comment: 'Amazing! Keeps my 18-month-old engaged. Super stable and did not tip over.', date: '2026-05-18' },
      { id: 'r24', reviewerName: 'Rita P.', rating: 5, comment: 'Beautiful construction and so many things for tiny hands to do.', date: '2026-05-24' }
    ],
    imageColor: 'bg-accent-teal'
  },
  {
    id: '13',
    title: 'Wooden Blocks City Set (80pc)',
    slug: 'wooden-blocks-city-set-80pc',
    description: 'Build a bustling miniature metropolis with this 80-piece colored building block set. Includes arches, columns, bridges, and customized blocks with window and door details.',
    price: 34.99,
    discountPrice: 29.99,
    brand: 'Oak & Elm',
    category: 'Building Blocks',
    ageGroup: '3-5 years',
    rating: 4.7,
    stockStatus: 'In Stock',
    variants: [
      { name: 'Pastel City', stock: 14 },
      { name: 'Vibrant City', stock: 12 }
    ],
    reviews: [
      { id: 'r25', reviewerName: 'Liam O.', rating: 4, comment: 'Fabulous building blocks, nice paint coating that does not chip easily.', date: '2026-04-05' },
      { id: 'r26', reviewerName: 'Diana R.', rating: 5, comment: 'My grandson builds the most creative skyscrapers with this set.', date: '2026-04-12' }
    ],
    imageColor: 'bg-accent-blue'
  },
  {
    id: '14',
    title: 'Miniature Wooden Tool Bench',
    slug: 'miniature-wooden-tool-bench',
    description: 'A mini builder toy bench equipped with wooden tools: hammer, screwdriver, wrench, nuts, bolts, and gears. Teaches structural design and basic mechanical coordination.',
    price: 32.99,
    discountPrice: 27.99,
    brand: 'Forest Minds',
    category: 'Educational',
    ageGroup: '3-5 years',
    rating: 4.6,
    stockStatus: 'Low Stock',
    variants: [
      { name: 'Standard Tool Set', stock: 4 }
    ],
    reviews: [
      { id: 'r27', reviewerName: 'Ben J.', rating: 4, comment: 'Perfect toddler scale, screws turn easily and threads are smooth.', date: '2026-05-19' },
      { id: 'r28', reviewerName: 'Lily T.', rating: 5, comment: 'Great tool bench! Wood is smooth and tools look very realistic.', date: '2026-05-27' }
    ],
    imageColor: 'bg-primary'
  },
  {
    id: '15',
    title: 'Wooden Bowling Pins Game',
    slug: 'wooden-bowling-pins-game',
    description: 'Includes 6 friendly wooden animal bowling pins and 2 solid wooden balls. Excellent for developing coordination, aiming skills, and mathematical scoring.',
    price: 27.99,
    discountPrice: 22.99,
    brand: 'TumbleTree',
    category: 'Outdoor',
    ageGroup: '3-5 years',
    rating: 4.5,
    stockStatus: 'In Stock',
    variants: [
      { name: 'Safari Animal Pins', stock: 15 }
    ],
    reviews: [
      { id: 'r29', reviewerName: 'Owen S.', rating: 4, comment: 'Cute safari characters, they stand up nicely on flat lawn and carpet.', date: '2026-05-08' },
      { id: 'r30', reviewerName: 'Hannah G.', rating: 5, comment: 'Very sturdy, survives heavy throws and falls. Safe paint.', date: '2026-05-14' }
    ],
    imageColor: 'bg-accent-yellow'
  },
  {
    id: '16',
    title: 'Classic Wooden Abacus',
    slug: 'classic-wooden-abacus',
    description: 'A traditional calculation board featuring 10 rows of 10 colored wooden beads. Perfect for early arithmetic calculations, addition, subtraction, and multiplication training.',
    price: 14.99,
    discountPrice: 11.99,
    brand: 'LittleSprout',
    category: 'Educational',
    ageGroup: '5-7 years',
    rating: 4.8,
    stockStatus: 'In Stock',
    variants: [
      { name: 'Standard Abacus', stock: 18 }
    ],
    reviews: [
      { id: 'r31', reviewerName: 'Grace A.', rating: 5, comment: 'Great educational visual aid. Sturdy frame and smooth sliding beads.', date: '2026-06-04' },
      { id: 'r32', reviewerName: 'Ryan E.', rating: 4, comment: 'Standard size, good build quality, colors are bright and clean.', date: '2026-06-07' }
    ],
    imageColor: 'bg-accent-blue'
  },
  {
    id: '17',
    title: 'Little Forest Cuddly Rabbit',
    slug: 'little-forest-cuddly-rabbit',
    description: 'A unique hybrid soft toy containing a soft organic cotton plush body with a smooth, handcrafted cherrywood teething ring as ears. Soft and safe for new infants.',
    price: 16.99,
    discountPrice: 13.99,
    brand: 'LittleSprout',
    category: 'Soft Toys',
    ageGroup: '0-1 years',
    rating: 4.9,
    stockStatus: 'In Stock',
    variants: [
      { name: 'Soft Gray', stock: 20 },
      { name: 'Pastel Pink', stock: 14 }
    ],
    reviews: [
      { id: 'r33', reviewerName: 'Kim Y.', rating: 5, comment: 'My teething daughter loves gnawing on the wooden ears, very easy to wash.', date: '2026-05-29' },
      { id: 'r34', reviewerName: 'Oliver D.', rating: 5, comment: 'Incredibly soft and lightweight. Wood ring has no splinters or sharp edges.', date: '2026-06-02' }
    ],
    imageColor: 'bg-accent-yellow'
  },
  {
    id: '18',
    title: 'Tactile Wooden Sound Blocks',
    slug: 'tactile-wooden-sound-blocks',
    description: 'Set of 6 hollow wooden blocks, each containing different hidden materials (beads, bells, sand) that emit unique rattling sounds. Teaches sound differentiation.',
    price: 21.99,
    discountPrice: 18.99,
    brand: 'Forest Minds',
    category: 'Educational',
    ageGroup: '0-1 years',
    rating: 4.6,
    stockStatus: 'In Stock',
    variants: [
      { name: 'Sound Blocks', stock: 15 }
    ],
    reviews: [
      { id: 'r35', reviewerName: 'Zoe R.', rating: 4, comment: 'Very interesting sensory toy. Sturdy seals so contents never leak.', date: '2026-04-15' },
      { id: 'r36', reviewerName: 'Victor M.', rating: 5, comment: 'Each block has different colors and visual patterns too. Great design.', date: '2026-05-02' }
    ],
    imageColor: 'bg-accent-teal'
  },
  {
    id: '19',
    title: 'Wooden Helicopter Transport',
    slug: 'wooden-helicopter-transport',
    description: 'A chunky toy helicopter featuring a rotating main rotor blade and rolling landing wheels. Fits miniature peg pilots. Made from maple and birchwood.',
    price: 19.99,
    discountPrice: 15.99,
    brand: 'EcoToys',
    category: 'Wooden Vehicles',
    ageGroup: '3-5 years',
    rating: 4.4,
    stockStatus: 'In Stock',
    variants: [
      { name: 'Rescue Red', stock: 10 },
      { name: 'Police Blue', stock: 12 }
    ],
    reviews: [
      { id: 'r37', reviewerName: 'Leo V.', rating: 4, comment: 'Rotor blade rotates very easily. Sturdy enough to survive toddler throws.', date: '2026-05-22' },
      { id: 'r38', reviewerName: 'Mona W.', rating: 5, comment: 'Sleek design, fits peg people from other popular sets as well.', date: '2026-06-01' }
    ],
    imageColor: 'bg-accent-blue'
  },
  {
    id: '20',
    title: 'Safari Animals Puzzle',
    slug: 'safari-animals-puzzle',
    description: 'A 3D wooden puzzle containing chunky safari animals that stand upright on their own. Fits together on a solid wood tray. Builds puzzle-solving and story-making skills.',
    price: 18.99,
    discountPrice: 15.99,
    brand: 'LittleSprout',
    category: 'Educational',
    ageGroup: '1-3 years',
    rating: 4.7,
    stockStatus: 'Out of Stock',
    variants: [
      { name: 'Safari Animals', stock: 0 }
    ],
    reviews: [
      { id: 'r39', reviewerName: 'Mia L.', rating: 5, comment: 'Outstanding! The animal pieces are thick enough to play with separately.', date: '2026-06-06' },
      { id: 'r40', reviewerName: 'Garry P.', rating: 4, comment: 'Very high quality, though puzzle slot was tight initially.', date: '2026-06-08' }
    ],
    imageColor: 'bg-accent-teal'
  }
]
