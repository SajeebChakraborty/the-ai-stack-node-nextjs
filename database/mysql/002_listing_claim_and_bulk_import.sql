-- Run on live MySQL if `npm run db:push` still fails after pulling latest schema.
-- Backup first: mysqldump -u USER -p sql_theaistacks_io > backup.sql

-- Enums (MySQL uses inline ENUM on columns)

CREATE TABLE IF NOT EXISTS `ListingClaimRequest` (
  `id` VARCHAR(191) NOT NULL,
  `toolId` VARCHAR(191) NOT NULL,
  `requesterId` VARCHAR(191) NOT NULL,
  `businessName` VARCHAR(191) NOT NULL,
  `businessStartDate` DATETIME(3) NOT NULL,
  `businessRegistrationDate` DATETIME(3) NOT NULL,
  `businessDocumentUrl` TEXT NOT NULL,
  `additionalNotes` TEXT NULL,
  `attachmentUrls` JSON NULL,
  `status` ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
  `adminNotes` TEXT NULL,
  `reviewedAt` DATETIME(3) NULL,
  `reviewedById` VARCHAR(191) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`),
  INDEX `ListingClaimRequest_status_createdAt_idx` (`status`, `createdAt`),
  INDEX `ListingClaimRequest_requesterId_createdAt_idx` (`requesterId`, `createdAt`),
  INDEX `ListingClaimRequest_toolId_idx` (`toolId`),
  CONSTRAINT `ListingClaimRequest_toolId_fkey` FOREIGN KEY (`toolId`) REFERENCES `Tool`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `ListingClaimRequest_requesterId_fkey` FOREIGN KEY (`requesterId`) REFERENCES `Profile`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `ListingClaimRequest_reviewedById_fkey` FOREIGN KEY (`reviewedById`) REFERENCES `Profile`(`id`) ON DELETE SET NULL ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `BulkClaimImportJob` (
  `id` VARCHAR(191) NOT NULL,
  `adminId` VARCHAR(191) NULL,
  `status` ENUM('queued', 'processing', 'completed', 'failed') NOT NULL DEFAULT 'queued',
  `fileName` VARCHAR(191) NULL,
  `totalRows` INT NOT NULL DEFAULT 0,
  `nextRowIndex` INT NOT NULL DEFAULT 0,
  `processedRows` INT NOT NULL DEFAULT 0,
  `createdCount` INT NOT NULL DEFAULT 0,
  `failedCount` INT NOT NULL DEFAULT 0,
  `rows` JSON NOT NULL,
  `created` JSON NULL,
  `failed` JSON NULL,
  `errorMessage` TEXT NULL,
  `startedAt` DATETIME(3) NULL,
  `completedAt` DATETIME(3) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`),
  INDEX `BulkClaimImportJob_status_createdAt_idx` (`status`, `createdAt`),
  INDEX `BulkClaimImportJob_adminId_createdAt_idx` (`adminId`, `createdAt`),
  CONSTRAINT `BulkClaimImportJob_adminId_fkey` FOREIGN KEY (`adminId`) REFERENCES `Profile`(`id`) ON DELETE SET NULL ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
