-- CreateTable
CREATE TABLE "SurveyToken" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "teacherName" TEXT NOT NULL,
    "school" TEXT NOT NULL,
    "grade" TEXT NOT NULL,
    "sentTo" TEXT NOT NULL,
    "sentVia" TEXT NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    CONSTRAINT "SurveyToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChildResponse" (
    "id" TEXT NOT NULL,
    "tokenId" TEXT NOT NULL,
    "childIndex" INTEGER NOT NULL,
    "childName" TEXT,
    "gender" TEXT NOT NULL,
    "age" TEXT NOT NULL,
    "answers" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ChildResponse_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SurveyToken_token_key" ON "SurveyToken"("token");

-- AddForeignKey
ALTER TABLE "ChildResponse" ADD CONSTRAINT "ChildResponse_tokenId_fkey" FOREIGN KEY ("tokenId") REFERENCES "SurveyToken"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
