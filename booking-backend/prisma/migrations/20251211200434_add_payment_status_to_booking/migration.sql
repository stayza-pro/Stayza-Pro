-- AlterTable
ALTER TABLE "public"."bookings" ADD COLUMN     "paymentStatus" "public"."PaymentStatus" DEFAULT 'INITIATED';
