#!/bin/bash

# SkillUp Backend Deployment Script
# This script deploys all database migrations to Supabase

echo "🚀 SkillUp Backend Deployment"
echo "================================"
echo ""

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null
then
    echo "⚠️  Supabase CLI not found. Installing..."
    npm install -g supabase
fi

echo "📝 This will deploy 4 migration files to your Supabase database:"
echo "  1. Video validation (2-5 min duration)"
echo "  2. Quiz enforcement (1-3 questions)"
echo "  3. Progress enforcement (quiz required)"
echo "  4. Feature flags + Row Level Security"
echo ""

read -p "Continue? (y/n) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]
then
    echo "❌ Deployment cancelled"
    exit 1
fi

echo ""
echo "🔗 Linking to Supabase project..."
echo "📌 You'll need your project reference ID from:"
echo "   https://supabase.com/dashboard/project/YOUR_PROJECT/settings/general"
echo ""

# Link to Supabase project
supabase link

if [ $? -ne 0 ]; then
    echo "❌ Failed to link to Supabase project"
    exit 1
fi

echo ""
echo "📤 Deploying migrations..."

# Deploy migrations
supabase db push

if [ $? -ne 0 ]; then
    echo "❌ Migration deployment failed"
    exit 1
fi

echo ""
echo "✅ Migrations deployed successfully!"
echo ""
echo "🔍 Verifying deployment..."

# Run verification
supabase db execute --sql "
SELECT 
  'Videos table constraints' as check_type,
  COUNT(*) as count
FROM information_schema.table_constraints 
WHERE table_name = 'videos'
  AND constraint_name IN ('duration_range', 'video_url_format');
"

supabase db execute --sql "
SELECT 
  'Triggers' as check_type,
  COUNT(*) as count
FROM information_schema.triggers 
WHERE event_object_table IN ('videos', 'quiz_questions', 'progress');
"

supabase db execute --sql "
SELECT * FROM feature_flags;
"

echo ""
echo "🎉 Deployment complete!"
echo ""
echo "Next steps:"
echo "1. Review the verification output above"
echo "2. Run 'npm run dev' to start the frontend"
echo "3. Test video upload and quiz submission"
