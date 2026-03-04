-- =====================================================
-- INSERT SAMPLE ARTICLES
-- Run this AFTER creating your account via /signup
-- =====================================================

-- Get your author ID (replace with actual after signup)
-- To find your author ID, run: SELECT id, name FROM public.authors;

DO $$
DECLARE
  author_uuid UUID;
  tech_cat UUID;
  business_cat UUID;
  health_cat UUID;
  science_cat UUID;
BEGIN
  -- Get the first author (your account)
  SELECT id INTO author_uuid FROM public.authors LIMIT 1;
  
  -- Get category IDs
  SELECT id INTO tech_cat FROM public.categories WHERE slug = 'technology';
  SELECT id INTO business_cat FROM public.categories WHERE slug = 'business';
  SELECT id INTO health_cat FROM public.categories WHERE slug = 'health';
  SELECT id INTO science_cat FROM public.categories WHERE slug = 'science';

  -- Only insert if we have an author
  IF author_uuid IS NOT NULL THEN
    
    INSERT INTO public.articles (title, slug, excerpt, content, category_id, author_id, status, published_at, featured_image_url) VALUES
    (
      'Artificial Intelligence Revolutionizes Healthcare Diagnostics',
      'ai-revolutionizes-healthcare-2025',
      'AI systems are detecting diseases with 98% accuracy, transforming modern medicine.',
      '<h2>The Future of Medicine</h2><p>Artificial intelligence is transforming healthcare with unprecedented diagnostic accuracy. Recent studies show AI tools can detect diseases with 98% accuracy, matching or exceeding human doctors in some cases.</p><h3>Key Benefits</h3><ul><li>98% diagnostic accuracy</li><li>40% faster diagnosis</li><li>35% fewer errors</li><li>Accessible healthcare</li></ul><p>Major hospitals worldwide are implementing AI diagnostic systems with remarkable results.</p>',
      tech_cat, author_uuid, 'published', NOW() - INTERVAL '1 day',
      'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=1200'
    ),
    (
      'Bitcoin Surpasses $75,000 as Institutions Invest Heavily',
      'bitcoin-surpasses-75000-2025',
      'Cryptocurrency reaches new highs driven by institutional adoption.',
      '<h2>Crypto Market Surge</h2><p>Bitcoin has broken through the $75,000 barrier, driven by massive institutional investment.</p><h3>Market Data</h3><ul><li>Bitcoin: $75,432 (+127% YoY)</li><li>Market cap: $3.2 trillion</li><li>Daily volume: $142 billion</li></ul>',
      business_cat, author_uuid, 'published', NOW() - INTERVAL '2 days',
      'https://images.unsplash.com/photo-1621761191319-c6fb62004040?w=1200'
    ),
    (
      'New Study: Daily Walks Reduce Heart Disease Risk by 23%',
      'daily-walks-reduce-heart-disease-2025',
      'Just 15 minutes of walking per day has major health benefits.',
      '<h2>Simple Exercise, Big Results</h2><p>A 10-year study shows 15 minutes of daily walking reduces cardiovascular disease risk significantly.</p><h3>Key Findings</h3><ul><li>23% lower heart disease risk</li><li>18% lower depression rates</li><li>Better sleep quality</li></ul>',
      health_cat, author_uuid, 'published', NOW() - INTERVAL '3 days',
      'https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?w=1200'
    ),
    (
      'Climate Tech Startups Raise Record $50 Billion',
      'climate-tech-funding-50-billion-2024',
      'Investment in climate technology reaches unprecedented levels.',
      '<h2>Climate Tech Boom</h2><p>Climate startups raised $50 billion in 2024.</p><h3>Investment Areas</h3><ul><li>Carbon capture: $12B</li><li>Renewable storage: $15B</li><li>Alternative proteins: $8B</li></ul>',
      science_cat, author_uuid, 'published', NOW() - INTERVAL '4 days',
      'https://images.unsplash.com/photo-1569163139394-de4798aa62b6?w=1200'
    ),
    (
      'Remote Work Productivity Increases 13% With Right Strategy',
      'remote-work-productivity-increase-2025',
      'Analysis reveals the secrets of successful remote work.',
      '<h2>Remote Work Success</h2><p>Remote work boosts productivity by 13% when done correctly.</p><h3>Success Factors</h3><ul><li>Clear communication</li><li>Flexible schedules</li><li>Results-focused metrics</li></ul>',
      business_cat, author_uuid, 'published', NOW() - INTERVAL '5 days',
      'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1200'
    ),
    (
      'Mediterranean Diet Linked to 40% Lower Disease Risk',
      'mediterranean-diet-health-benefits-2025',
      'Largest nutrition study reveals dramatic health benefits.',
      '<h2>Diet and Health</h2><p>20-year study shows Mediterranean diet reduces chronic disease by 40%.</p><h3>Benefits</h3><ul><li>40% lower heart disease</li><li>30% lower diabetes</li><li>Improved longevity</li></ul>',
      health_cat, author_uuid, 'published', NOW() - INTERVAL '6 days',
      'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=1200'
    ),
    (
      'SpaceX Announces Mars Mission Timeline for 2028',
      'spacex-mars-mission-2028-timeline',
      'First crewed Mars mission moves closer with new capabilities.',
      '<h2>Journey to Mars</h2><p>SpaceX unveils timeline for 2028 Mars landing.</p><h3>Mission Plan</h3><ul><li>2026: Cargo missions</li><li>2028: First crew landing</li><li>Sustainable presence by 2030</li></ul>',
      science_cat, author_uuid, 'published', NOW() - INTERVAL '7 days',
      'https://images.unsplash.com/photo-1614728894747-a83421e2b9c9?w=1200'
    ),
    (
      'Electric Vehicle Sales Hit 35% of Global Market',
      'electric-vehicle-sales-35-percent-2025',
      'EV adoption reaches tipping point with falling prices.',
      '<h2>EV Market Boom</h2><p>Electric vehicles now represent 35% of all new car sales.</p><h3>Market Trends</h3><ul><li>500+ mile range</li><li>Price parity achieved</li><li>300K fast chargers worldwide</li></ul>',
      tech_cat, author_uuid, 'published', NOW() - INTERVAL '8 days',
      'https://images.unsplash.com/photo-1593941707882-a5bba14938c7?w=1200'
    ),
    (
      'Sustainable Fashion Industry Reaches $300 Billion',
      'sustainable-fashion-300-billion-2025',
      'Eco-friendly clothing moves from niche to mainstream.',
      '<h2>Fashion Revolution</h2><p>Sustainable fashion market grows to $300 billion.</p><h3>Growth Drivers</h3><ul><li>Consumer awareness up 200%</li><li>Major brands pivot</li><li>Circular fashion models</li></ul>',
      tech_cat, author_uuid, 'published', NOW() - INTERVAL '9 days',
      'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1200'
    ),
    (
      'Olympic Athletes Achieve 23% Performance Boost Using AI',
      'olympic-ai-training-performance-boost-2025',
      'AI systems revolutionize athletic training and preparation.',
      '<h2>AI in Sports</h2><p>Elite athletes using AI achieve 15-23% performance improvements.</p><h3>AI Technologies</h3><ul><li>Computer vision analysis</li><li>Injury prevention</li><li>Personalized nutrition</li></ul>',
      tech_cat, author_uuid, 'published', NOW() - INTERVAL '10 days',
      'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=1200'
    );

    RAISE NOTICE 'Successfully inserted 10 articles!';
  ELSE
    RAISE NOTICE 'No author found! Please create an account first at /signup';
  END IF;

END $$;

-- Verify
SELECT 'Articles created!' as status;
SELECT status, COUNT(*) as count FROM public.articles GROUP BY status;
