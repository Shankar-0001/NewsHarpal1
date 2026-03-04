-- =====================================================
-- PROFESSIONAL_SEED_DATA.sql
-- =====================================================
-- High-quality SEO-optimized sample content
-- Run AFTER FINAL_PRODUCTION_SUPABASE_SETUP.sql
-- Run AFTER creating at least one user account
-- =====================================================

-- IMPORTANT: Replace 'YOUR_AUTHOR_ID_HERE' with actual author ID
-- Get author ID: SELECT id, name FROM public.authors;

-- =====================================================
-- STEP 1: INSERT CATEGORIES
-- =====================================================

INSERT INTO public.categories (name, slug, description) VALUES
('Technology', 'technology', 'Latest developments in tech, AI, and innovation'),
('Business', 'business', 'Business strategies, markets, and entrepreneurship'),
('Health', 'health', 'Health, wellness, and medical breakthroughs'),
('Science', 'science', 'Scientific discoveries and research'),
('Sports', 'sports', 'Sports news, analysis, and highlights'),
('Lifestyle', 'lifestyle', 'Lifestyle trends, travel, and culture')
ON CONFLICT (slug) DO NOTHING;

-- =====================================================
-- STEP 2: INSERT TAGS
-- =====================================================

INSERT INTO public.tags (name, slug) VALUES
('AI', 'ai'),
('Machine Learning', 'machine-learning'),
('Blockchain', 'blockchain'),
('Cryptocurrency', 'cryptocurrency'),
('Startup', 'startup'),
('Investment', 'investment'),
('Nutrition', 'nutrition'),
('Mental Health', 'mental-health'),
('Fitness', 'fitness'),
('Climate', 'climate'),
('Space', 'space'),
('Medicine', 'medicine'),
('Football', 'football'),
('Olympics', 'olympics'),
('Innovation', 'innovation'),
('Future Tech', 'future-tech'),
('Sustainability', 'sustainability'),
('Leadership', 'leadership'),
('Productivity', 'productivity'),
('Wellness', 'wellness')
ON CONFLICT (slug) DO NOTHING;

-- =====================================================
-- STEP 3: INSERT 10+ PROFESSIONAL ARTICLES
-- =====================================================

-- Get category and author IDs for use in inserts
-- DO $$ 
-- DECLARE
--   tech_cat_id UUID;
--   business_cat_id UUID;
--   health_cat_id UUID;
--   science_cat_id UUID;
--   sports_cat_id UUID;
--   lifestyle_cat_id UUID;
--   author_id UUID;
-- BEGIN

-- Article 1: AI in Healthcare
INSERT INTO public.articles (
  title,
  slug,
  excerpt,
  content,
  category_id,
  author_id,
  status,
  seo_title,
  seo_description,
  published_at,
  featured_image_url
) VALUES (
  'Artificial Intelligence Transforms Modern Healthcare Diagnostics',
  'ai-transforms-modern-healthcare-diagnostics-2025',
  'Revolutionary AI systems are now detecting diseases with 98% accuracy, transforming how doctors diagnose and treat patients worldwide.',
  '<h2>The Healthcare Revolution Has Arrived</h2><p>In a groundbreaking development, artificial intelligence has achieved unprecedented accuracy in medical diagnostics, marking a pivotal moment in healthcare history. Recent studies from leading medical institutions show AI diagnostic tools now match or exceed human doctor accuracy in detecting various conditions.</p><h3>Key Breakthroughs in AI Medical Diagnosis</h3><p>The latest generation of AI diagnostic systems leverages deep learning algorithms trained on millions of medical images and patient records. These systems can now:</p><ul><li>Detect early-stage cancer with 98% accuracy</li><li>Identify cardiovascular diseases 40% faster than traditional methods</li><li>Predict patient deterioration 48 hours in advance</li><li>Reduce diagnostic errors by 35%</li><li>Process medical imaging 100x faster than human radiologists</li></ul><h3>Real-World Impact and Implementation</h3><p>Major healthcare institutions across North America and Europe have begun implementing these AI systems with remarkable results. Johns Hopkins Hospital reported a 42% reduction in misdiagnosis rates after deploying their AI-assisted diagnostic platform.</p><blockquote>AI is not replacing doctors—it is empowering them to make better decisions, faster, and save more lives.</blockquote><p>Dr. Sarah Chen, Chief Medical AI Officer at Stanford Medical Center, emphasizes that these systems serve as powerful decision-support tools rather than replacements for human expertise.</p><h3>The Technology Behind the Breakthrough</h3><p>Modern medical AI systems utilize several advanced technologies:</p><ul><li><strong>Convolutional Neural Networks (CNNs)</strong> for analyzing medical images</li><li><strong>Natural Language Processing (NLP)</strong> for understanding patient records</li><li><strong>Predictive Analytics</strong> for forecasting patient outcomes</li><li><strong>Transfer Learning</strong> enabling rapid adaptation to new conditions</li></ul><h3>Privacy and Ethical Considerations</h3><p>As AI becomes more prevalent in healthcare, robust privacy measures ensure patient data remains secure. All systems comply with HIPAA regulations and employ advanced encryption methods.</p><h3>The Future of AI in Healthcare</h3><p>Looking ahead, researchers predict AI will expand into:</p><ul><li>Personalized treatment plans based on genetic data</li><li>Real-time health monitoring via wearable devices</li><li>Drug discovery and development acceleration</li><li>Mental health assessment and support</li></ul><p>The integration of AI in healthcare represents one of the most significant technological advances of the 21st century, promising to improve patient outcomes while reducing costs and increasing accessibility to quality care worldwide.</p>',
  (SELECT id FROM public.categories WHERE slug = 'technology'),
  (SELECT id FROM public.authors LIMIT 1),
  'published',
  'AI in Healthcare 2025: Revolutionary Diagnostic Accuracy Achieved',
  'Discover how artificial intelligence is transforming healthcare with 98% diagnostic accuracy. Learn about breakthrough AI systems detecting diseases faster and more accurately than ever.',
  NOW() - INTERVAL '2 days',
  'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=1200&h=630&fit=crop'
);

-- Article 2: Cryptocurrency Market Analysis
INSERT INTO public.articles (
  title,
  slug,
  excerpt,
  content,
  category_id,
  author_id,
  status,
  seo_title,
  seo_description,
  published_at,
  featured_image_url
) VALUES (
  'Cryptocurrency Market Reaches New Heights: What Investors Need to Know',
  'cryptocurrency-market-analysis-investor-guide-2025',
  'As Bitcoin surpasses $75,000 and institutional adoption accelerates, experts analyze what this means for investors in 2025.',
  '<h2>The New Era of Digital Currency</h2><p>The cryptocurrency market has entered a transformative phase in 2025, with Bitcoin reaching unprecedented highs and institutional investors flooding into the space. This comprehensive analysis examines the factors driving this growth and what it means for the future of finance.</p><h3>Market Performance Overview</h3><p>Current cryptocurrency market indicators show:</p><ul><li>Bitcoin: $75,432 (+127% YoY)</li><li>Ethereum: $4,892 (+156% YoY)</li><li>Total market cap: $3.2 trillion</li><li>Daily trading volume: $142 billion</li><li>Number of crypto users globally: 580 million</li></ul><h3>Institutional Adoption Accelerates</h3><p>Major financial institutions have significantly increased their cryptocurrency exposure. Notable developments include:</p><ul><li>BlackRock launching spot Bitcoin ETF with $15B in assets</li><li>JPMorgan integrating crypto trading for clients</li><li>Goldman Sachs expanding digital asset trading desk</li><li>Major pension funds allocating 2-5% to crypto assets</li></ul><h3>Regulatory Clarity Drives Growth</h3><p>The regulatory landscape has matured considerably, providing the clarity institutional investors needed. The SEC has approved multiple spot Bitcoin ETFs, and comprehensive crypto regulation frameworks have been implemented in major markets.</p><blockquote>We are witnessing the maturation of cryptocurrency from a speculative asset to a legitimate asset class in diversified portfolios.</blockquote><h3>Technological Innovations</h3><p>Blockchain technology continues to evolve with significant improvements:</p><ul><li><strong>Layer 2 Solutions</strong>: Ethereum processes 100,000 transactions per second</li><li><strong>Zero-Knowledge Proofs</strong>: Enhanced privacy without compromising security</li><li><strong>Cross-chain Interoperability</strong>: Seamless asset transfers between blockchains</li><li><strong>Energy Efficiency</strong>: 99% reduction in energy consumption since proof-of-stake</li></ul><h3>Investment Strategies for 2025</h3><p>Financial advisors recommend:</p><ul><li>Allocate 3-7% of portfolio to digital assets</li><li>Dollar-cost averaging to manage volatility</li><li>Focus on established cryptocurrencies with strong fundamentals</li><li>Understand tax implications in your jurisdiction</li><li>Use regulated exchanges and secure custody solutions</li></ul><h3>Risks and Considerations</h3><p>Despite positive momentum, investors should be aware of:</p><ul><li>Market volatility remains higher than traditional assets</li><li>Regulatory changes can impact market dynamics</li><li>Security considerations for digital asset storage</li><li>Need for thorough due diligence before investing</li></ul><p>The cryptocurrency market evolution continues to reshape global finance, offering new opportunities while requiring careful consideration of risks and proper portfolio management.</p>',
  (SELECT id FROM public.categories WHERE slug = 'business'),
  (SELECT id FROM public.authors LIMIT 1),
  'published',
  'Cryptocurrency Market 2025: Complete Investor Guide & Analysis',
  'Bitcoin hits $75K as institutional adoption surges. Expert analysis on crypto market trends, investment strategies, and what to expect in 2025.',
  NOW() - INTERVAL '1 day',
  'https://images.unsplash.com/photo-1621761191319-c6fb62004040?w=1200&h=630&fit=crop'
);

-- Article 3: Mental Health & Productivity
INSERT INTO public.articles (
  title,
  slug,
  excerpt,
  content,
  category_id,
  author_id,
  status,
  seo_title,
  seo_description,
  published_at,
  featured_image_url
) VALUES (
  'Mental Health in the Workplace: Evidence-Based Strategies That Work',
  'mental-health-workplace-evidence-based-strategies-2025',
  'New research reveals practical mental health strategies that boost employee wellbeing and productivity by up to 65%.',
  '<h2>The Workplace Mental Health Crisis</h2><p>Mental health challenges in the workplace have reached critical levels, with 78% of employees reporting stress-related issues. However, groundbreaking research now shows effective, evidence-based interventions that dramatically improve both wellbeing and productivity.</p><h3>The Business Case for Mental Health</h3><p>Companies investing in mental health see remarkable returns:</p><ul><li>$4 return for every $1 spent on mental health programs</li><li>41% reduction in absenteeism</li><li>65% improvement in employee engagement</li><li>33% decrease in healthcare costs</li><li>28% increase in overall productivity</li></ul><h3>Evidence-Based Interventions</h3><p>Research-backed strategies showing significant impact:</p><h4>1. Flexible Work Arrangements</h4><p>Studies show flexible schedules reduce stress by 54% while maintaining or improving output. Key elements include:</p><ul><li>Remote work options (2-3 days per week optimal)</li><li>Flexible start/end times</li><li>Compressed work weeks</li><li>Results-based performance metrics</li></ul><h4>2. Regular Mental Health Check-ins</h4><p>Brief weekly check-ins (15 minutes) with managers trained in mental health awareness show:</p><ul><li>Early detection of burnout signs</li><li>73% of employees feel more supported</li><li>Faster resolution of workplace stress issues</li></ul><h4>3. Mindfulness and Stress Management Programs</h4><p>Structured mindfulness programs yield measurable benefits:</p><ul><li>23% reduction in stress hormones (cortisol)</li><li>Improved focus and decision-making</li><li>Better emotional regulation</li><li>Enhanced team collaboration</li></ul><blockquote>Creating a mentally healthy workplace is not just compassionate—it is essential for sustainable business success in the modern economy.</blockquote><h3>Implementing Change: Practical Steps</h3><p>Organizations can start immediately:</p><ol><li><strong>Assess Current State</strong>: Anonymous employee surveys to identify pain points</li><li><strong>Train Leadership</strong>: Mental health awareness training for all managers</li><li><strong>Create Resources</strong>: EAP programs, counseling services, mental health days</li><li><strong>Foster Culture</strong>: Open dialogue, reduce stigma, lead by example</li><li><strong>Measure Impact</strong>: Track metrics like engagement, retention, productivity</li></ol><h3>Warning Signs to Watch</h3><p>Managers should be alert to:</p><ul><li>Decreased productivity or quality of work</li><li>Increased absenteeism or tardiness</li><li>Withdrawal from team activities</li><li>Changes in communication patterns</li><li>Physical symptoms like fatigue or headaches</li></ul><h3>The Role of Technology</h3><p>Digital mental health tools show promise:</p><ul><li>AI-powered stress monitoring via wearables</li><li>On-demand counseling through apps</li><li>Meditation and mindfulness apps</li><li>Anonymous peer support platforms</li></ul><p>Addressing workplace mental health is no longer optional—it is a critical business imperative that determines organizational success in an increasingly complex world.</p>',
  (SELECT id FROM public.categories WHERE slug = 'health'),
  (SELECT id FROM public.authors LIMIT 1),
  'published',
  'Workplace Mental Health 2025: Proven Strategies for Success',
  'Evidence-based mental health strategies boost employee wellbeing by 65%. Learn practical interventions that work for modern workplaces.',
  NOW() - INTERVAL '6 hours',
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=1200&h=630&fit=crop'
);

-- Continue with more articles in next section due to length...

-- Article 4: Climate Technology
INSERT INTO public.articles (
  title,
  slug,
  excerpt,
  content,
  category_id,
  author_id,
  status,
  seo_title,
  seo_description,
  published_at,
  featured_image_url
) VALUES (
  'Climate Tech Startups Raise Record $50 Billion: The Race to Net Zero',
  'climate-tech-startups-funding-net-zero-race-2025',
  'Investment in climate technology reaches historic highs as innovative startups develop breakthrough solutions for carbon capture, renewable energy, and sustainable agriculture.',
  '<h2>The Climate Tech Boom</h2><p>Climate technology has emerged as the fastest-growing sector in venture capital, with startups raising a record-breaking $50 billion in 2024. This unprecedented investment surge reflects growing urgency around climate change and recognition that technological innovation is critical for achieving net-zero emissions.</p><h3>Major Investment Areas</h3><p>Capital is flowing into key climate tech sectors:</p><ul><li><strong>Carbon Capture</strong>: $12 billion</li><li><strong>Renewable Energy Storage</strong>: $15 billion</li><li><strong>Alternative Proteins</strong>: $8 billion</li><li><strong>Sustainable Materials</strong>: $7 billion</li><li><strong>Climate Analytics & Software</strong>: $8 billion</li></ul><h3>Breakthrough Technologies</h3><p>Several technologies have reached commercial viability:</p><ul><li>Direct Air Capture systems removing CO2 at $100/ton</li><li>Solid-state batteries with 1000+ mile range for EVs</li><li>Lab-grown meat at price parity with conventional meat</li><li>Green hydrogen production at competitive costs</li><li>Carbon-negative building materials</li></ul><p>The climate tech revolution is accelerating, with solutions moving from lab to market faster than anticipated, offering realistic paths to meeting 2030 and 2050 climate targets.</p>',
  (SELECT id FROM public.categories WHERE slug = 'science'),
  (SELECT id FROM public.authors LIMIT 1),
  'published',
  'Climate Tech Investment 2025: $50B Funding & Breakthrough Solutions',
  'Climate tech startups raise record $50B as breakthrough carbon capture and renewable energy technologies reach commercial scale.',
  NOW() - INTERVAL '12 hours',
  'https://images.unsplash.com/photo-1569163139394-de4798aa62b6?w=1200&h=630&fit=crop'
);

-- Article 5: Sports Performance Science
INSERT INTO public.articles (
  title,
  slug,
  excerpt,
  content,
  category_id,
  author_id,
  status,
  seo_title,
  seo_description,
  published_at,
  featured_image_url
) VALUES (
  'Olympic Athletes Use AI Training: Performance Improves by 23%',
  'olympic-athletes-ai-training-performance-boost-2025',
  'Cutting-edge AI systems are revolutionizing athletic training, helping Olympic hopefuls achieve unprecedented performance gains ahead of Paris 2025.',
  '<h2>The AI Revolution in Sports Training</h2><p>Elite athletes preparing for major competitions are leveraging artificial intelligence to optimize every aspect of their training, nutrition, and recovery. The results are remarkable—measurable performance improvements of 15-23% across various metrics.</p><h3>AI Training Technologies</h3><p>Modern athletes utilize:</p><ul><li>Computer vision analysis of technique and form</li><li>Predictive analytics for injury prevention</li><li>Personalized nutrition plans based on biometric data</li><li>Sleep optimization through AI-monitored recovery</li><li>Virtual reality training for mental preparation</li></ul><h3>Performance Data</h3><p>Athletes using AI training systems show:</p><ul><li>23% improvement in key performance indicators</li><li>37% reduction in training-related injuries</li><li>18% faster recovery times</li><li>Enhanced consistency in competition performance</li></ul><p>Team USA, British Athletics, and other national programs have made AI training technology central to their Paris 2025 preparation strategies.</p>',
  (SELECT id FROM public.categories WHERE slug = 'sports'),
  (SELECT id FROM public.authors LIMIT 1),
  'published',
  'AI Training for Olympics 2025: 23% Performance Boost Revealed',
  'Olympic athletes achieve 23% performance improvement using AI training systems. Discover the cutting-edge technology behind Paris 2025 preparation.',
  NOW() - INTERVAL '18 hours',
  'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=1200&h=630&fit=crop'
);

-- Articles 6-10: Additional high-quality content
-- (Shortened for space but following same pattern)

INSERT INTO public.articles (title, slug, excerpt, content, category_id, author_id, status, published_at, featured_image_url) VALUES
('Remote Work Productivity: Data-Driven Insights from 10,000 Companies', 'remote-work-productivity-data-insights-2025', 'Analysis of 10,000 companies reveals remote work increases productivity by 13% when implemented correctly.', '<h2>The Remote Work Data Analysis</h2><p>Comprehensive analysis of remote work productivity...</p>', (SELECT id FROM categories WHERE slug = 'business'), (SELECT id FROM authors LIMIT 1), 'published', NOW() - INTERVAL '1 day', 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1200&h=630&fit=crop'),
('Mediterranean Diet Study: 40% Lower Risk of Chronic Disease', 'mediterranean-diet-health-benefits-study-2025', 'Largest-ever study of Mediterranean diet shows dramatic health benefits and longevity improvements.', '<h2>Mediterranean Diet Research</h2><p>Groundbreaking 20-year study reveals...</p>', (SELECT id FROM categories WHERE slug = 'health'), (SELECT id FROM authors LIMIT 1), 'published', NOW() - INTERVAL '2 days', 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=1200&h=630&fit=crop'),
('SpaceX Mars Mission Timeline: First Human Landing Set for 2028', 'spacex-mars-mission-timeline-2028-landing', 'SpaceX announces accelerated timeline for first crewed Mars mission with new Starship capabilities.', '<h2>The Mars Mission Timeline</h2><p>SpaceX has unveiled an ambitious yet achievable timeline...</p>', (SELECT id FROM categories WHERE slug = 'science'), (SELECT id FROM authors LIMIT 1), 'published', NOW() - INTERVAL '3 days', 'https://images.unsplash.com/photo-1614728894747-a83421e2b9c9?w=1200&h=630&fit=crop'),
('Sustainable Fashion Revolution: $300B Market Transformation', 'sustainable-fashion-revolution-market-growth-2025', 'Sustainable fashion market explodes as consumers demand ethical, eco-friendly clothing options.', '<h2>The Fashion Industry Transformation</h2><p>Sustainable fashion has moved from niche to mainstream...</p>', (SELECT id FROM categories WHERE slug = 'lifestyle'), (SELECT id FROM authors LIMIT 1), 'published', NOW() - INTERVAL '4 days', 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1200&h=630&fit=crop'),
('Electric Vehicle Adoption Hits 35% of New Car Sales Globally', 'electric-vehicle-adoption-35-percent-global-2025', 'EV sales surge to record highs as prices fall and charging infrastructure expands worldwide.', '<h2>The EV Market Boom</h2><p>Electric vehicle adoption has reached a tipping point...</p>', (SELECT id FROM categories WHERE slug = 'technology'), (SELECT id FROM authors LIMIT 1), 'published', NOW() - INTERVAL '5 days', 'https://images.unsplash.com/photo-1593941707882-a5bba14938c7?w=1200&h=630&fit=crop');

-- Draft and Pending examples for testing
INSERT INTO public.articles (title, slug, excerpt, content, category_id, author_id, status) VALUES
('DRAFT: Quantum Computing Breakthrough at IBM Research', 'quantum-computing-breakthrough-ibm-research-draft', 'IBM achieves major quantum computing milestone (DRAFT FOR TESTING)', '<p>Draft content for testing purposes...</p>', (SELECT id FROM categories WHERE slug = 'technology'), (SELECT id FROM authors LIMIT 1), 'draft'),
('PENDING: Future of Work in 2030: Expert Predictions', 'future-work-2030-expert-predictions-pending', 'Industry leaders share predictions for workplace evolution (PENDING REVIEW)', '<p>Pending content for testing purposes...</p>', (SELECT id FROM categories WHERE slug = 'business'), (SELECT id FROM authors LIMIT 1), 'pending');

-- =====================================================
-- STEP 4: LINK ARTICLES TO TAGS
-- =====================================================

-- AI Healthcare tags
INSERT INTO public.article_tags (article_id, tag_id) SELECT 
  (SELECT id FROM articles WHERE slug = 'ai-transforms-modern-healthcare-diagnostics-2025'),
  id FROM tags WHERE slug IN ('ai', 'machine-learning', 'medicine', 'innovation');

-- Crypto tags
INSERT INTO public.article_tags (article_id, tag_id) SELECT 
  (SELECT id FROM articles WHERE slug = 'cryptocurrency-market-analysis-investor-guide-2025'),
  id FROM tags WHERE slug IN ('cryptocurrency', 'blockchain', 'investment');

-- Mental Health tags
INSERT INTO public.article_tags (article_id, tag_id) SELECT 
  (SELECT id FROM articles WHERE slug = 'mental-health-workplace-evidence-based-strategies-2025'),
  id FROM tags WHERE slug IN ('mental-health', 'wellness', 'productivity', 'leadership');

-- Climate Tech tags
INSERT INTO public.article_tags (article_id, tag_id) SELECT 
  (SELECT id FROM articles WHERE slug = 'climate-tech-startups-funding-net-zero-race-2025'),
  id FROM tags WHERE slug IN ('climate', 'sustainability', 'innovation', 'startup');

-- Olympics AI tags
INSERT INTO public.article_tags (article_id, tag_id) SELECT 
  (SELECT id FROM articles WHERE slug = 'olympic-athletes-ai-training-performance-boost-2025'),
  id FROM tags WHERE slug IN ('olympics', 'ai', 'fitness');

-- =====================================================
-- VERIFICATION
-- =====================================================

-- Check what was created
SELECT COUNT(*) as total_articles FROM articles;
SELECT status, COUNT(*) as count FROM articles GROUP BY status;
SELECT c.name, COUNT(a.id) as article_count FROM categories c LEFT JOIN articles a ON c.id = a.category_id GROUP BY c.name;

-- =====================================================
-- SETUP COMPLETE
-- =====================================================