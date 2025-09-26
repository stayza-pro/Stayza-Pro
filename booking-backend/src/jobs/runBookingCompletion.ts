import { runCompletionJob } from "@/services/bookingCompletion";

// Executable script (ts-node) to be invoked by an OS-level scheduler / cron.
// Example (Windows Task Scheduler or pm2 cron):
//   npx ts-node src/jobs/runBookingCompletion.ts

(async () => {
  try {
    await runCompletionJob();
    process.exit(0);
  } catch (e) {
    console.error("Booking completion job failed", e);
    process.exit(1);
  }
})();
