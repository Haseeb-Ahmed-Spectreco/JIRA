-- CreateTable
CREATE TABLE `Project` (
    `id` VARCHAR(191) NOT NULL,
    `key` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `defaultAssignee` VARCHAR(191) NULL,
    `imageUrl` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NULL,
    `deletedAt` DATETIME(3) NULL,

    UNIQUE INDEX `Project_key_key`(`key`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Member` (
    `id` VARCHAR(191) NOT NULL,
    `projectId` VARCHAR(191) NOT NULL,

    INDEX `Member_projectId_idx`(`projectId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Issue` (
    `id` VARCHAR(191) NOT NULL,
    `key` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `details` VARCHAR(191) NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'TODO',
    `type` VARCHAR(191) NOT NULL DEFAULT 'TASK',
    `sprintPosition` DOUBLE NOT NULL,
    `boardPosition` DOUBLE NOT NULL DEFAULT -1,
    `reporterId` VARCHAR(191) NOT NULL DEFAULT '1',
    `assigneeId` VARCHAR(191) NULL,
    `parentId` VARCHAR(191) NULL,
    `sprintId` VARCHAR(191) NULL,
    `isDeleted` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `deletedAt` DATETIME(3) NULL,
    `sprintColor` VARCHAR(191) NULL,
    `creatorId` VARCHAR(191) NOT NULL,

    INDEX `Issue_sprintId_idx`(`sprintId`),
    UNIQUE INDEX `Issue_key_creatorId_key`(`key`, `creatorId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Sprint` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` TEXT NOT NULL,
    `duration` VARCHAR(191) NULL,
    `startDate` DATETIME(3) NULL,
    `endDate` DATETIME(3) NULL,
    `creatorId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NULL,
    `deletedAt` DATETIME(3) NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'PENDING',

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Comment` (
    `id` VARCHAR(191) NOT NULL,
    `content` TEXT NOT NULL,
    `authorId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `deletedAt` DATETIME(3) NULL,
    `isEdited` BOOLEAN NOT NULL DEFAULT false,
    `issueId` VARCHAR(191) NOT NULL,
    `logId` VARCHAR(191) NULL,

    INDEX `Comment_issueId_idx`(`issueId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `DefaultUser` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `avatar` VARCHAR(191) NULL,

    UNIQUE INDEX `DefaultUser_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Member` ADD CONSTRAINT `Member_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `Project`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Issue` ADD CONSTRAINT `Issue_sprintId_fkey` FOREIGN KEY (`sprintId`) REFERENCES `Sprint`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Comment` ADD CONSTRAINT `Comment_issueId_fkey` FOREIGN KEY (`issueId`) REFERENCES `Issue`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
