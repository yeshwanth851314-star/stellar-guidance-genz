-- =====================================================
-- KARMA COMPASS — Initial schema + seed data
-- =====================================================

-- ===== PROFILES =====
create table public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  name text,
  email text,
  phone text,
  birth_date date,
  birth_time time,
  birth_place text,
  birth_lat numeric(9,6),
  birth_lng numeric(9,6),
  rasi integer,
  nakshatra integer,
  pada integer,
  lagna integer,
  tithi integer,
  vara integer,
  dosha text check (dosha in ('Vata','Pitta','Kapha')),
  moon_longitude numeric(10,6),
  sun_longitude numeric(10,6),
  yoga_index integer,
  karana_index integer,
  notification_time time default '06:30:00',
  notif_planetary boolean default true,
  notif_spiritual boolean default true,
  notif_wellness boolean default true,
  notif_lunar boolean default false,
  notif_weekly boolean default true,
  notif_muhurta boolean default false,
  sound_enabled boolean default true,
  sound_volume numeric(3,2) default 0.7,
  sound_theme text default 'vedic',
  theme text default 'cosmic_dark',
  fcm_token text,
  onboarded boolean default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Users view own profile" on public.profiles
  for select using (auth.uid() = user_id);
create policy "Users update own profile" on public.profiles
  for update using (auth.uid() = user_id);
create policy "Users insert own profile" on public.profiles
  for insert with check (auth.uid() = user_id);

-- Auto-update updated_at
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

create trigger profiles_touch_updated_at
before update on public.profiles
for each row execute function public.touch_updated_at();

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (user_id, email, name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1))
  )
  on conflict (user_id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- ===== DAILY CONTENT =====
create table public.daily_content (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  vibe_theme text,
  vibe_description text,
  vibe_color text,
  vibe_icon text,
  planetary_insight text,
  spiritual_guidance text,
  practical_tip text,
  ayurvedic_tip text,
  lucky_color text,
  lucky_number integer,
  power_hour_start time,
  power_hour_end time,
  cosmic_energy integer check (cosmic_energy between 0 and 100),
  mantra text,
  deity text,
  created_at timestamptz not null default now(),
  unique(user_id, date)
);

alter table public.daily_content enable row level security;

create policy "Users view own daily content" on public.daily_content
  for select using (auth.uid() = user_id);
create policy "Users insert own daily content" on public.daily_content
  for insert with check (auth.uid() = user_id);
create policy "Users update own daily content" on public.daily_content
  for update using (auth.uid() = user_id);

-- ===== NAKSHATRA LIBRARY =====
create table public.nakshatra_library (
  id serial primary key,
  idx integer unique not null,
  name_english text not null,
  name_telugu text not null,
  name_sanskrit text not null,
  lord text not null,
  symbol text not null,
  element text not null,
  gana text not null,
  trait text not null,
  deity text,
  body_part text,
  quality text,
  star_count integer,
  constellation_stars jsonb
);

alter table public.nakshatra_library enable row level security;
create policy "Nakshatras public read" on public.nakshatra_library
  for select using (true);

-- ===== RASI LIBRARY =====
create table public.rasi_library (
  id serial primary key,
  idx integer unique not null,
  name_telugu text not null,
  name_english text not null,
  name_sanskrit text not null,
  symbol text not null,
  lord text not null,
  element text not null,
  quality text not null,
  color text not null,
  body_part text,
  trait_keywords text[]
);

alter table public.rasi_library enable row level security;
create policy "Rasis public read" on public.rasi_library
  for select using (true);

-- ===== YOGA POSES =====
create table public.yoga_poses (
  id serial primary key,
  name_english text not null,
  name_telugu text not null,
  name_sanskrit text not null,
  dosha text[],
  benefit text,
  duration_minutes integer,
  best_time text,
  emoji text,
  category text
);

alter table public.yoga_poses enable row level security;
create policy "Yoga poses public read" on public.yoga_poses
  for select using (true);

-- ===== HERBS =====
create table public.herbs (
  id serial primary key,
  name_english text not null,
  name_telugu text not null,
  name_sanskrit text not null,
  dosha text[],
  benefit text,
  emoji text,
  traditional_use text
);

alter table public.herbs enable row level security;
create policy "Herbs public read" on public.herbs
  for select using (true);

-- =====================================================
-- SEED DATA
-- =====================================================

-- 12 Rasis
insert into public.rasi_library (idx, name_telugu, name_english, name_sanskrit, symbol, lord, element, quality, color, body_part, trait_keywords) values
(0,  'మేషం', 'Aries', 'Mesha', '♈', 'Mars', 'Fire', 'Cardinal', '#E11D48', 'Head', array['bold','pioneering','energetic']),
(1,  'వృషభం', 'Taurus', 'Vrishabha', '♉', 'Venus', 'Earth', 'Fixed', '#65A30D', 'Neck', array['grounded','sensual','patient']),
(2,  'మిథునం', 'Gemini', 'Mithuna', '♊', 'Mercury', 'Air', 'Mutable', '#FACC15', 'Arms', array['curious','witty','adaptable']),
(3,  'కర్కాటకం', 'Cancer', 'Karka', '♋', 'Moon', 'Water', 'Cardinal', '#C0C0C0', 'Chest', array['nurturing','intuitive','protective']),
(4,  'సింహం', 'Leo', 'Simha', '♌', 'Sun', 'Fire', 'Fixed', '#F59E0B', 'Heart', array['regal','generous','radiant']),
(5,  'కన్య', 'Virgo', 'Kanya', '♍', 'Mercury', 'Earth', 'Mutable', '#84CC16', 'Stomach', array['precise','analytical','helpful']),
(6,  'తుల', 'Libra', 'Tula', '♎', 'Venus', 'Air', 'Cardinal', '#EC4899', 'Lower back', array['balanced','diplomatic','artistic']),
(7,  'వృశ్చికం', 'Scorpio', 'Vrishchika', '♏', 'Mars', 'Water', 'Fixed', '#7C2D12', 'Pelvis', array['intense','transformative','magnetic']),
(8,  'ధనుస్సు', 'Sagittarius', 'Dhanu', '♐', 'Jupiter', 'Fire', 'Mutable', '#8B5CF6', 'Thighs', array['philosophical','adventurous','optimistic']),
(9,  'మకరం', 'Capricorn', 'Makara', '♑', 'Saturn', 'Earth', 'Cardinal', '#1E293B', 'Knees', array['disciplined','ambitious','steady']),
(10, 'కుంభం', 'Aquarius', 'Kumbha', '♒', 'Saturn', 'Air', 'Fixed', '#0EA5E9', 'Ankles', array['visionary','humanitarian','independent']),
(11, 'మీనం', 'Pisces', 'Meena', '♓', 'Jupiter', 'Water', 'Mutable', '#0D9488', 'Feet', array['compassionate','dreamy','mystical']);

-- 27 Nakshatras
insert into public.nakshatra_library (idx, name_english, name_telugu, name_sanskrit, lord, symbol, element, gana, trait, deity, body_part, quality, star_count, constellation_stars) values
(0,  'Ashwini',       'అశ్విని',       'Ashvinī',       'Ketu',    'Horse head',     'Earth',  'Deva',    'Swift, pioneering, healing',          'Ashwini Kumaras', 'Knees',     'Light',    3,  '[{"x":0.3,"y":0.4},{"x":0.5,"y":0.35},{"x":0.7,"y":0.45}]'::jsonb),
(1,  'Bharani',       'భరణి',         'Bharaṇī',       'Venus',   'Yoni',           'Earth',  'Manushya','Disciplined, creative, intense',      'Yama',            'Head',      'Fierce',   3,  '[{"x":0.25,"y":0.5},{"x":0.5,"y":0.35},{"x":0.75,"y":0.5}]'::jsonb),
(2,  'Krittika',      'కృత్తిక',       'Kṛttikā',       'Sun',     'Razor',          'Fire',   'Rakshasa','Sharp, purifying, ambitious',         'Agni',            'Hips',      'Mixed',    6,  '[{"x":0.2,"y":0.3},{"x":0.4,"y":0.4},{"x":0.6,"y":0.35},{"x":0.55,"y":0.55},{"x":0.75,"y":0.5},{"x":0.5,"y":0.65}]'::jsonb),
(3,  'Rohini',        'రోహిణి',        'Rohiṇī',        'Moon',    'Chariot',        'Earth',  'Manushya','Sensual, fertile, charismatic',       'Brahma',          'Forehead',  'Fixed',    5,  '[{"x":0.3,"y":0.3},{"x":0.5,"y":0.25},{"x":0.7,"y":0.4},{"x":0.6,"y":0.6},{"x":0.4,"y":0.55}]'::jsonb),
(4,  'Mrigashira',    'మృగశిర',       'Mṛgaśira',      'Mars',    'Deer head',      'Earth',  'Deva',    'Curious, gentle, seeking',            'Soma',            'Eyes',      'Soft',     3,  '[{"x":0.3,"y":0.35},{"x":0.55,"y":0.5},{"x":0.7,"y":0.4}]'::jsonb),
(5,  'Ardra',         'ఆర్ద్ర',         'Ārdrā',         'Rahu',    'Teardrop',       'Water',  'Manushya','Stormy, transformative, intense',     'Rudra',           'Hair',      'Sharp',    1,  '[{"x":0.5,"y":0.5}]'::jsonb),
(6,  'Punarvasu',     'పునర్వసు',      'Punarvasu',     'Jupiter', 'Quiver',         'Water',  'Deva',    'Renewing, wise, hopeful',             'Aditi',           'Fingers',   'Movable',  5,  '[{"x":0.25,"y":0.45},{"x":0.45,"y":0.35},{"x":0.55,"y":0.55},{"x":0.7,"y":0.4},{"x":0.6,"y":0.65}]'::jsonb),
(7,  'Pushya',        'పుష్యమి',       'Puṣya',         'Saturn',  'Cow udder',      'Water',  'Deva',    'Nourishing, devotional, kind',        'Brihaspati',      'Mouth',     'Light',    3,  '[{"x":0.4,"y":0.4},{"x":0.55,"y":0.5},{"x":0.45,"y":0.6}]'::jsonb),
(8,  'Ashlesha',      'ఆశ్లేష',         'Āśleṣā',        'Mercury', 'Coiled serpent', 'Water',  'Rakshasa','Mystical, magnetic, perceptive',      'Nagas',           'Joints',    'Sharp',    5,  '[{"x":0.25,"y":0.55},{"x":0.4,"y":0.45},{"x":0.55,"y":0.5},{"x":0.65,"y":0.6},{"x":0.5,"y":0.7}]'::jsonb),
(9,  'Magha',         'మఖ',           'Maghā',         'Ketu',    'Throne',         'Water',  'Rakshasa','Regal, ancestral, proud',             'Pitris',          'Nose',      'Fierce',   5,  '[{"x":0.2,"y":0.4},{"x":0.4,"y":0.3},{"x":0.6,"y":0.4},{"x":0.55,"y":0.6},{"x":0.35,"y":0.6}]'::jsonb),
(10, 'Purva Phalguni','పూర్వ ఫల్గుణి', 'Pūrva Phalgunī','Venus',   'Hammock',        'Water',  'Manushya','Playful, sensual, generous',          'Bhaga',           'Lips',      'Fierce',   2,  '[{"x":0.35,"y":0.45},{"x":0.65,"y":0.55}]'::jsonb),
(11, 'Uttara Phalguni','ఉత్తర ఫల్గుణి','Uttara Phalgunī','Sun',    'Bed',            'Fire',   'Manushya','Loyal, helpful, dignified',           'Aryaman',         'Hands',     'Fixed',    2,  '[{"x":0.35,"y":0.4},{"x":0.65,"y":0.6}]'::jsonb),
(12, 'Hasta',         'హస్త',          'Hasta',         'Moon',    'Hand',           'Fire',   'Deva',    'Skillful, dexterous, witty',          'Savitr',          'Hand',      'Light',    5,  '[{"x":0.3,"y":0.4},{"x":0.5,"y":0.3},{"x":0.55,"y":0.55},{"x":0.7,"y":0.5},{"x":0.4,"y":0.65}]'::jsonb),
(13, 'Chitra',        'చిత్త',         'Citrā',         'Mars',    'Bright jewel',   'Fire',   'Rakshasa','Brilliant, artistic, magnetic',       'Vishvakarma',     'Forehead',  'Soft',     1,  '[{"x":0.5,"y":0.5}]'::jsonb),
(14, 'Swati',         'స్వాతి',         'Svātī',         'Rahu',    'Coral',          'Fire',   'Deva',    'Independent, balanced, breezy',       'Vayu',            'Teeth',     'Movable',  1,  '[{"x":0.5,"y":0.5}]'::jsonb),
(15, 'Vishakha',      'విశాఖ',         'Viśākhā',       'Jupiter', 'Triumphal arch', 'Fire',   'Rakshasa','Determined, focused, victorious',     'Indra-Agni',      'Arms',      'Sharp',    4,  '[{"x":0.3,"y":0.35},{"x":0.55,"y":0.5},{"x":0.7,"y":0.4},{"x":0.5,"y":0.65}]'::jsonb),
(16, 'Anuradha',      'అనురాధ',       'Anurādhā',      'Saturn',  'Lotus',          'Fire',   'Deva',    'Devoted, friendly, accomplished',     'Mitra',           'Breasts',   'Soft',     3,  '[{"x":0.35,"y":0.45},{"x":0.55,"y":0.5},{"x":0.65,"y":0.6}]'::jsonb),
(17, 'Jyeshtha',      'జ్యేష్ఠ',         'Jyeṣṭhā',       'Mercury', 'Earring',        'Air',    'Rakshasa','Senior, protective, courageous',      'Indra',           'Neck',      'Sharp',    3,  '[{"x":0.3,"y":0.4},{"x":0.5,"y":0.5},{"x":0.7,"y":0.6}]'::jsonb),
(18, 'Mula',          'మూల',          'Mūla',          'Ketu',    'Bunch of roots', 'Air',    'Rakshasa','Investigative, root-seeking, fierce', 'Nirriti',         'Feet',      'Sharp',    11, '[{"x":0.2,"y":0.45},{"x":0.3,"y":0.55},{"x":0.4,"y":0.5},{"x":0.5,"y":0.6},{"x":0.6,"y":0.5},{"x":0.7,"y":0.55},{"x":0.45,"y":0.4},{"x":0.55,"y":0.7},{"x":0.35,"y":0.35},{"x":0.65,"y":0.4},{"x":0.5,"y":0.5}]'::jsonb),
(19, 'Purva Ashadha', 'పూర్వాషాఢ',    'Pūrvāṣāḍhā',    'Venus',   'Fan',            'Air',    'Manushya','Invincible, persuasive, optimistic',  'Apas',            'Thighs',    'Fierce',   2,  '[{"x":0.4,"y":0.4},{"x":0.6,"y":0.6}]'::jsonb),
(20, 'Uttara Ashadha','ఉత్తరాషాఢ',    'Uttarāṣāḍhā',   'Sun',     'Elephant tusk',  'Air',    'Manushya','Steady, principled, victorious',      'Vishvedevas',     'Waist',     'Fixed',    2,  '[{"x":0.4,"y":0.4},{"x":0.6,"y":0.6}]'::jsonb),
(21, 'Shravana',      'శ్రవణ',         'Śravaṇa',       'Moon',    'Ear',            'Air',    'Deva',    'Listening, learned, connecting',      'Vishnu',          'Ears',      'Movable',  3,  '[{"x":0.3,"y":0.5},{"x":0.5,"y":0.5},{"x":0.7,"y":0.5}]'::jsonb),
(22, 'Dhanishta',     'ధనిష్ఠ',         'Dhaniṣṭhā',     'Mars',    'Drum',           'Ether',  'Rakshasa','Rhythmic, prosperous, energetic',     'Eight Vasus',     'Back',      'Movable',  4,  '[{"x":0.3,"y":0.4},{"x":0.5,"y":0.35},{"x":0.65,"y":0.5},{"x":0.5,"y":0.65}]'::jsonb),
(23, 'Shatabhisha',   'శతభిష',         'Śatabhiṣaj',    'Rahu',    'Empty circle',   'Ether',  'Rakshasa','Healing, secretive, mystical',        'Varuna',          'Jaw',       'Movable',  100,'[{"x":0.5,"y":0.5},{"x":0.3,"y":0.3},{"x":0.7,"y":0.3},{"x":0.3,"y":0.7},{"x":0.7,"y":0.7}]'::jsonb),
(24, 'Purva Bhadrapada','పూర్వ భాద్ర','Pūrva Bhādrapadā','Jupiter','Sword',          'Ether',  'Manushya','Passionate, sacrificial, intense',    'Aja Ekapada',     'Sides',     'Fierce',   2,  '[{"x":0.4,"y":0.4},{"x":0.6,"y":0.6}]'::jsonb),
(25, 'Uttara Bhadrapada','ఉత్తర భాద్ర','Uttara Bhādrapadā','Saturn','Twin men',     'Ether',  'Manushya','Wise, deep, content',                 'Ahirbudhnya',     'Shins',     'Fixed',    2,  '[{"x":0.4,"y":0.4},{"x":0.6,"y":0.6}]'::jsonb),
(26, 'Revati',        'రేవతి',         'Revatī',        'Mercury', 'Fish',           'Ether',  'Deva',    'Nurturing, prosperous, journey-loving','Pushan',         'Feet',      'Soft',     32, '[{"x":0.25,"y":0.5},{"x":0.4,"y":0.45},{"x":0.55,"y":0.55},{"x":0.7,"y":0.5},{"x":0.5,"y":0.65}]'::jsonb);

-- Yoga poses
insert into public.yoga_poses (name_english, name_telugu, name_sanskrit, dosha, benefit, duration_minutes, best_time, emoji, category) values
('Mountain Pose',     'పర్వత ఆసనం',   'Tadasana',          array['Vata','Pitta','Kapha'], 'Grounds and aligns the body',        5,  'Sunrise',  '🧘', 'Standing'),
('Tree Pose',         'వృక్షాసనం',     'Vrikshasana',       array['Vata'],                  'Builds balance and focus',           3,  'Morning',  '🌳', 'Standing'),
('Warrior I',         'వీరభద్రాసనం 1','Virabhadrasana I',  array['Kapha'],                 'Energizes and strengthens',          4,  'Morning',  '⚔️', 'Standing'),
('Child Pose',        'శిశు ఆసనం',   'Balasana',          array['Vata','Pitta'],          'Calms the nervous system',           5,  'Evening',  '🧎', 'Restorative'),
('Cobra Pose',        'భుజంగాసనం',   'Bhujangasana',      array['Kapha'],                 'Opens chest, energizes spine',       3,  'Morning',  '🐍', 'Backbend'),
('Seated Forward',    'పశ్చిమోత్తానాసనం','Paschimottanasana',array['Pitta'],               'Calms mind, cools body',             5,  'Evening',  '🪷', 'Forward fold'),
('Bridge Pose',       'సేతుబంధాసనం',  'Setu Bandhasana',   array['Kapha'],                 'Opens heart, strengthens back',      4,  'Morning',  '🌉', 'Backbend'),
('Corpse Pose',       'శవాసనం',      'Savasana',          array['Vata','Pitta'],          'Deep rest, integration',             10, 'Anytime',  '😌', 'Restorative'),
('Sun Salutation',    'సూర్య నమస్కారం','Surya Namaskara',  array['Kapha'],                 'Full-body energizer',                10, 'Sunrise',  '☀️', 'Sequence'),
('Cat-Cow',           'మార్జరి భంగిమ', 'Marjaryasana',     array['Vata','Kapha'],          'Mobilizes spine',                    3,  'Morning',  '🐈', 'Flow'),
('Triangle Pose',     'త్రికోణాసనం',   'Trikonasana',       array['Kapha'],                 'Stretches sides, strengthens legs',  4,  'Morning',  '📐', 'Standing'),
('Lotus Meditation',  'పద్మాసన ధ్యానం','Padmasana Dhyana', array['Vata','Pitta','Kapha'], 'Calms mind, prepares for meditation',15, 'Sunrise',  '🪷', 'Seated');

-- Herbs
insert into public.herbs (name_english, name_telugu, name_sanskrit, dosha, benefit, emoji, traditional_use) values
('Ashwagandha',  'అశ్వగంధ',     'Ashvagandhā',  array['Vata','Kapha'],          'Calms nerves, builds strength',     '🌿', 'Rasayana adaptogen for vitality'),
('Tulsi',        'తులసి',       'Tulasī',       array['Vata','Kapha'],          'Boosts immunity, opens lungs',      '🌱', 'Sacred basil for daily tea'),
('Turmeric',     'పసుపు',       'Haridrā',      array['Vata','Pitta','Kapha'], 'Anti-inflammatory, purifying',      '🟡', 'Daily golden milk'),
('Ginger',       'అల్లం',       'Ārdraka',      array['Vata','Kapha'],          'Kindles digestive fire',            '🫚', 'Fresh tea before meals'),
('Cardamom',     'ఏలకులు',      'Elā',          array['Vata','Kapha'],          'Soothes digestion, freshens breath','🌰', 'After-meal chew'),
('Triphala',     'త్రిఫల',       'Triphalā',     array['Vata','Pitta','Kapha'], 'Gentle daily detox',                '🍂', 'Evening bowel tonic'),
('Brahmi',       'బ్రహ్మి',      'Brāhmī',       array['Pitta','Vata'],          'Sharpens memory, calms mind',       '🍃', 'Daily nootropic'),
('Neem',         'వేప',         'Nimba',        array['Pitta','Kapha'],         'Purifies blood, clears skin',       '🌳', 'Skin and blood cleanser'),
('Amla',         'ఉసిరి',       'Āmalakī',      array['Vata','Pitta','Kapha'], 'Vitamin C powerhouse',              '🍏', 'Daily rasayana'),
('Cinnamon',     'దాల్చిన',      'Tvak',         array['Vata','Kapha'],          'Warms, regulates blood sugar',      '🌰', 'Spice in morning tea'),
('Fennel',       'సొంపు',       'Śatapuṣpā',    array['Pitta','Vata'],          'Cools, supports digestion',         '🌿', 'After-meal seed chew'),
('Licorice',     'అతిమధురం',     'Yaṣṭimadhu',   array['Vata','Pitta'],          'Soothes throat, harmonizer',        '🌾', 'Sweetener in herbal blends');
