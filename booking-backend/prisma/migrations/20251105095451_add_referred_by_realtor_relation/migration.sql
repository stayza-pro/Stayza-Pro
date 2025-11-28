-- AddForeignKey
ALTER TABLE "public"."users" ADD CONSTRAINT "users_referredByRealtorId_fkey" FOREIGN KEY ("referredByRealtorId") REFERENCES "public"."realtors"("id") ON DELETE SET NULL ON UPDATE CASCADE;
