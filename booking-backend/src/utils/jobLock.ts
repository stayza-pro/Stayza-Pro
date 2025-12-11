import { prisma } from "@/config/database";
import { logger } from "./logger";
import os from "os";

const INSTANCE_ID = `${os.hostname()}-${process.pid}`;
const LOCK_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Distributed job lock to prevent race conditions across multiple server instances
 */
export class JobLock {
  private jobName: string;
  private lockId: string | null = null;

  constructor(jobName: string) {
    this.jobName = jobName;
  }

  /**
   * Acquire a lock for this job
   * @returns true if lock acquired, false if already locked by another instance
   */
  async acquire(): Promise<boolean> {
    try {
      const expiresAt = new Date(Date.now() + LOCK_TIMEOUT_MS);

      // Try to create a new lock
      const lock = await prisma.jobLock.upsert({
        where: { jobName: this.jobName },
        create: {
          jobName: this.jobName,
          lockedBy: INSTANCE_ID,
          expiresAt,
          bookingIds: [],
        },
        update: {
          lockedBy: INSTANCE_ID,
          lockedAt: new Date(),
          expiresAt,
          bookingIds: [],
        },
      });

      // Check if we got the lock or if it's held by another instance
      if (lock.lockedBy === INSTANCE_ID) {
        this.lockId = lock.id;
        logger.info(`Job lock acquired: ${this.jobName}`, {
          lockId: this.lockId,
          instanceId: INSTANCE_ID,
        });
        return true;
      }

      // Check if the existing lock has expired
      if (new Date() > lock.expiresAt) {
        // Lock expired, try to steal it
        const updatedLock = await prisma.jobLock.updateMany({
          where: {
            jobName: this.jobName,
            expiresAt: { lte: new Date() },
          },
          data: {
            lockedBy: INSTANCE_ID,
            lockedAt: new Date(),
            expiresAt,
            bookingIds: [],
          },
        });

        if (updatedLock.count > 0) {
          const newLock = await prisma.jobLock.findUnique({
            where: { jobName: this.jobName },
          });
          if (newLock) {
            this.lockId = newLock.id;
            logger.info(`Job lock stolen from expired lock: ${this.jobName}`, {
              lockId: this.lockId,
              instanceId: INSTANCE_ID,
            });
            return true;
          }
        }
      }

      logger.warn(
        `Job lock already held by another instance: ${this.jobName}`,
        {
          currentHolder: lock.lockedBy,
          expiresAt: lock.expiresAt,
          instanceId: INSTANCE_ID,
        }
      );
      return false;
    } catch (error: any) {
      logger.error(`Failed to acquire job lock: ${this.jobName}`, {
        error: error.message,
        stack: error.stack,
      });
      return false;
    }
  }

  /**
   * Release the lock
   */
  async release(): Promise<void> {
    if (!this.lockId) {
      return;
    }

    try {
      await prisma.jobLock.deleteMany({
        where: {
          jobName: this.jobName,
          lockedBy: INSTANCE_ID,
        },
      });

      logger.info(`Job lock released: ${this.jobName}`, {
        lockId: this.lockId,
        instanceId: INSTANCE_ID,
      });

      this.lockId = null;
    } catch (error: any) {
      logger.error(`Failed to release job lock: ${this.jobName}`, {
        error: error.message,
        stack: error.stack,
      });
    }
  }

  /**
   * Update the lock with processed booking IDs
   */
  async updateBookingIds(bookingIds: string[]): Promise<void> {
    if (!this.lockId) {
      return;
    }

    try {
      await prisma.jobLock.update({
        where: { id: this.lockId },
        data: { bookingIds },
      });
    } catch (error: any) {
      logger.error(`Failed to update job lock booking IDs: ${this.jobName}`, {
        error: error.message,
      });
    }
  }

  /**
   * Clean up expired locks (should be called periodically)
   */
  static async cleanupExpiredLocks(): Promise<void> {
    try {
      const result = await prisma.jobLock.deleteMany({
        where: {
          expiresAt: { lte: new Date() },
        },
      });

      if (result.count > 0) {
        logger.info(`Cleaned up ${result.count} expired job locks`);
      }
    } catch (error: any) {
      logger.error("Failed to cleanup expired job locks", {
        error: error.message,
      });
    }
  }
}
