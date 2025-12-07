const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
);

const DEMO_USER_ID = '550e8400-e29b-41d4-a716-446655440000';
const DEMO_USER_2_ID = '550e8400-e29b-41d4-a716-446655440001';

const demoUsers = [
  {
    id: DEMO_USER_ID,
    email: 'alice@redstringtheory.com',
    display_name: 'Alice'
  },
  {
    id: DEMO_USER_2_ID,
    email: 'bob@redstringtheory.com',
    display_name: 'Bob'
  }
];

const demoGarments = [
  {
    owner_id: DEMO_USER_ID,
    name: 'Vintage Denim Jacket',
    category: 'Outerwear',
    size: 'M',
    condition: 0.8,
    rarity: 0.7,
    style_tags: ['vintage', 'casual', 'streetwear'],
    personality: ['bold', 'relaxed'],
    vibe: 'rebellious',
    image_url: 'https://images.pexels.com/photos/1124468/pexels-photo-1124468.jpeg',
    patience: 0.6,
    min_acceptable_score: 0.65,
    active: true
  },
  {
    owner_id: DEMO_USER_ID,
    name: 'Silk Floral Dress',
    category: 'Dress',
    size: 'S',
    condition: 0.9,
    rarity: 0.8,
    style_tags: ['cottagecore', 'romantic', 'vintage'],
    personality: ['refined', 'understated'],
    vibe: 'elegant',
    image_url: 'https://images.pexels.com/photos/985635/pexels-photo-985635.jpeg',
    patience: 0.7,
    min_acceptable_score: 0.70,
    active: true
  },
  {
    owner_id: DEMO_USER_ID,
    name: 'Black Leather Boots',
    category: 'Shoes',
    size: 'M',
    condition: 0.75,
    rarity: 0.6,
    style_tags: ['minimal', 'urban', 'edgy'],
    personality: ['bold', 'chaotic'],
    vibe: 'rebellious',
    image_url: 'https://images.pexels.com/photos/336372/pexels-photo-336372.jpeg',
    patience: 0.4,
    min_acceptable_score: 0.60,
    active: true
  },
  {
    owner_id: DEMO_USER_2_ID,
    name: 'Oversized Black Hoodie',
    category: 'Tops',
    size: 'L',
    condition: 0.7,
    rarity: 0.5,
    style_tags: ['streetwear', 'minimal', 'urban'],
    personality: ['relaxed', 'understated'],
    vibe: 'casual',
    image_url: 'https://images.pexels.com/photos/2043590/pexels-photo-2043590.jpeg',
    patience: 0.5,
    min_acceptable_score: 0.65,
    active: true
  },
  {
    owner_id: DEMO_USER_2_ID,
    name: 'Vintage Band T-Shirt',
    category: 'Tops',
    size: 'M',
    condition: 0.6,
    rarity: 0.9,
    style_tags: ['vintage', 'casual', 'grunge'],
    personality: ['chaotic', 'bold'],
    vibe: 'rebellious',
    image_url: 'https://images.pexels.com/photos/2294342/pexels-photo-2294342.jpeg',
    patience: 0.3,
    min_acceptable_score: 0.55,
    active: true
  },
  {
    owner_id: DEMO_USER_2_ID,
    name: 'Beige Trench Coat',
    category: 'Outerwear',
    size: 'M',
    condition: 0.85,
    rarity: 0.75,
    style_tags: ['minimal', 'classic', 'elegant'],
    personality: ['refined', 'understated'],
    vibe: 'sophisticated',
    image_url: 'https://images.pexels.com/photos/1926769/pexels-photo-1926769.jpeg',
    patience: 0.8,
    min_acceptable_score: 0.75,
    active: true
  },
  {
    owner_id: DEMO_USER_ID,
    name: 'Knit Cardigan',
    category: 'Tops',
    size: 'S',
    condition: 0.9,
    rarity: 0.6,
    style_tags: ['cottagecore', 'cozy', 'vintage'],
    personality: ['relaxed', 'understated'],
    vibe: 'calm',
    image_url: 'https://images.pexels.com/photos/1566412/pexels-photo-1566412.jpeg',
    patience: 0.6,
    min_acceptable_score: 0.65,
    active: true
  },
  {
    owner_id: DEMO_USER_2_ID,
    name: 'White Minimalist Sneakers',
    category: 'Shoes',
    size: 'M',
    condition: 0.95,
    rarity: 0.5,
    style_tags: ['minimal', 'streetwear', 'clean'],
    personality: ['understated', 'refined'],
    vibe: 'modern',
    image_url: 'https://images.pexels.com/photos/1598505/pexels-photo-1598505.jpeg',
    patience: 0.5,
    min_acceptable_score: 0.70,
    active: true
  }
];

async function seed() {
  console.log('Starting seed...');

  console.log('\nCreating users...');
  for (const user of demoUsers) {
    const { data, error } = await supabase
      .from('users')
      .upsert(user, { onConflict: 'id' })
      .select();

    if (error) {
      console.error(`Error creating user ${user.display_name}:`, error.message);
    } else {
      console.log(` Created user: ${user.display_name}`);
    }
  }

  console.log('\nCreating garments...');
  for (const garment of demoGarments) {
    const { data, error } = await supabase
      .from('garments')
      .insert(garment)
      .select();

    if (error) {
      console.error(`Error creating garment ${garment.name}:`, error.message);
    } else {
      console.log(` Created garment: ${garment.name} (Owner: ${garment.owner_id === DEMO_USER_ID ? 'Alice' : 'Bob'})`);
    }
  }

  console.log('\n Seed complete!');
  console.log('\nDemo user IDs:');
  console.log(`Alice: ${DEMO_USER_ID}`);
  console.log(`Bob: ${DEMO_USER_2_ID}`);
}

seed().catch(console.error);
