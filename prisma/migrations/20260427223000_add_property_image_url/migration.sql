ALTER TABLE "Property"
ADD COLUMN IF NOT EXISTS "imageUrl" TEXT NOT NULL DEFAULT 'https://images.pexels.com/photos/323780/pexels-photo-323780.jpeg?auto=compress&cs=tinysrgb&w=1600';

ALTER TABLE "Property"
ALTER COLUMN "imageUrl" DROP DEFAULT;
