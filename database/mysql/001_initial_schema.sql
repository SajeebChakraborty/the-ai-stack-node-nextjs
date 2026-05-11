-- MySQL 8+ schema for TheAiStack.
-- Prisma is the source of truth; this file mirrors the production table model
-- for teams that prefer audited SQL migrations.

create table if not exists Profile (
  id varchar(191) primary key,
  externalAuthId varchar(191) unique,
  email varchar(191) not null unique,
  fullName varchar(191),
  handle varchar(191) unique,
  avatarUrl text,
  role enum('user','creator','founder','moderator','admin') not null default 'user',
  bio text,
  location varchar(191),
  websiteUrl text,
  trustScore int not null default 50,
  reputationScore int not null default 0,
  isVerified boolean not null default false,
  suspendedAt datetime(3),
  createdAt datetime(3) not null default current_timestamp(3),
  updatedAt datetime(3) not null default current_timestamp(3) on update current_timestamp(3),
  index Profile_role_idx (role),
  index Profile_trustScore_idx (trustScore)
);

create table if not exists Category (
  id varchar(191) primary key,
  slug varchar(191) not null unique,
  name varchar(191) not null unique,
  description text not null,
  seoTitle varchar(191) not null,
  seoDescription text not null,
  icon varchar(191),
  sortOrder int not null default 0,
  isFeatured boolean not null default false,
  createdAt datetime(3) not null default current_timestamp(3),
  updatedAt datetime(3) not null default current_timestamp(3) on update current_timestamp(3)
);

create table if not exists Tool (
  id varchar(191) primary key,
  slug varchar(191) not null unique,
  name varchar(191) not null,
  tagline varchar(191) not null,
  description text not null,
  logoUrl text,
  websiteUrl text not null,
  affiliateUrl text,
  pricingModel enum('free','freemium','paid','usage_based','enterprise') not null default 'freemium',
  startingPrice decimal(10,2) not null default 0,
  verified boolean not null default false,
  status enum('draft','published','archived') not null default 'draft',
  founderId varchar(191),
  ratingAvg decimal(3,2) not null default 0,
  reviewCount int not null default 0,
  trustScore int not null default 50,
  trendingScore int not null default 0,
  growthRate decimal(7,2) not null default 0,
  launchedAt datetime(3),
  socialLinks json,
  metadata json,
  createdAt datetime(3) not null default current_timestamp(3),
  updatedAt datetime(3) not null default current_timestamp(3) on update current_timestamp(3),
  constraint Tool_founderId_fkey foreign key (founderId) references Profile(id) on delete set null,
  fulltext Tool_search_idx (name, tagline, description),
  index Tool_status_idx (status),
  index Tool_rating_idx (ratingAvg, reviewCount),
  index Tool_trending_idx (trendingScore, growthRate)
);

create table if not exists ToolCategory (
  toolId varchar(191) not null,
  categoryId varchar(191) not null,
  primary key (toolId, categoryId),
  constraint ToolCategory_toolId_fkey foreign key (toolId) references Tool(id) on delete cascade,
  constraint ToolCategory_categoryId_fkey foreign key (categoryId) references Category(id) on delete cascade
);

create table if not exists Review (
  id varchar(191) primary key,
  toolId varchar(191) not null,
  authorId varchar(191),
  reviewType enum('user','creator','verified_social','editorial') not null default 'user',
  rating int not null,
  title varchar(191) not null,
  body text not null,
  mediaAssetIds json,
  helpfulCount int not null default 0,
  voteScore int not null default 0,
  trustScore int not null default 50,
  aiSummary text,
  fakeReviewScore decimal(5,2) not null default 0,
  isVerifiedReviewer boolean not null default false,
  isPublished boolean not null default true,
  moderationStatus varchar(191) not null default 'approved',
  createdAt datetime(3) not null default current_timestamp(3),
  updatedAt datetime(3) not null default current_timestamp(3) on update current_timestamp(3),
  constraint Review_toolId_fkey foreign key (toolId) references Tool(id) on delete cascade,
  constraint Review_authorId_fkey foreign key (authorId) references Profile(id) on delete set null,
  fulltext Review_search_idx (title, body),
  index Review_tool_idx (toolId, isPublished, createdAt),
  index Review_author_idx (authorId, createdAt)
);

create table if not exists PremiumPlan (
  id varchar(191) primary key,
  name varchar(191) not null,
  description text not null,
  monthlyPrice decimal(10,2) not null default 0,
  yearlyPrice decimal(10,2) not null default 0,
  badge varchar(191),
  features json not null,
  usageLimits json not null,
  stripeProductId varchar(191),
  stripeMonthlyPriceId varchar(191),
  stripeYearlyPriceId varchar(191),
  sortOrder int not null default 0,
  enabled boolean not null default true,
  createdAt datetime(3) not null default current_timestamp(3),
  updatedAt datetime(3) not null default current_timestamp(3) on update current_timestamp(3)
);

create table if not exists Subscription (
  id varchar(191) primary key,
  userId varchar(191) not null,
  planId varchar(191) not null,
  stripeCustomerId varchar(191) not null,
  stripeSubscriptionId varchar(191) not null unique,
  status enum('trialing','active','past_due','canceled','unpaid','incomplete','incomplete_expired','paused') not null,
  cancelAtPeriodEnd boolean not null default false,
  currentPeriodStart datetime(3),
  currentPeriodEnd datetime(3),
  usage json,
  createdAt datetime(3) not null default current_timestamp(3),
  updatedAt datetime(3) not null default current_timestamp(3) on update current_timestamp(3),
  constraint Subscription_userId_fkey foreign key (userId) references Profile(id) on delete cascade,
  constraint Subscription_planId_fkey foreign key (planId) references PremiumPlan(id),
  index Subscription_user_status_idx (userId, status)
);

create table if not exists WebsiteSetting (
  `key` varchar(191) primary key,
  value json not null,
  updatedBy varchar(191),
  updatedAt datetime(3) not null default current_timestamp(3) on update current_timestamp(3)
);

create table if not exists HomepageSection (
  id varchar(191) primary key,
  `key` varchar(191) not null unique,
  title varchar(191) not null,
  config json not null,
  enabled boolean not null default true,
  sortOrder int not null default 0,
  updatedAt datetime(3) not null default current_timestamp(3) on update current_timestamp(3)
);

-- Remaining marketplace tables are generated by Prisma from prisma/schema.prisma:
-- MediaAsset, ReviewVote, Discussion, Comment, Bookmark, AiStack,
-- AiStackTool, CreatorProfile, FounderProfile, Notification,
-- AnalyticsEvent, Ranking, ToolUpdate, SocialAccount, AffiliateLink,
-- CreatorEarning, NewsletterSubscriber, NewsletterCampaign,
-- Advertisement, LaunchCampaign, Payment.
