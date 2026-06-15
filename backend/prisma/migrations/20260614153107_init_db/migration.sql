-- CreateEnum
CREATE TYPE "Role" AS ENUM ('STUDENT', 'ADMIN');

-- CreateEnum
CREATE TYPE "PartType" AS ENUM ('listening', 'reading');

-- CreateEnum
CREATE TYPE "AttemptStatus" AS ENUM ('IN_PROGRESS', 'COMPLETED', 'ABANDONED');

-- CreateEnum
CREATE TYPE "VocabStatus" AS ENUM ('KNOWN', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "WordType" AS ENUM ('noun', 'verb', 'adj', 'adv', 'phrase', 'other');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "password_hash" VARCHAR(255),
    "name" VARCHAR(100) NOT NULL,
    "avatar_url" TEXT,
    "bio" TEXT,
    "role" "Role" NOT NULL DEFAULT 'STUDENT',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "token" TEXT NOT NULL,
    "expires_at" TIMESTAMPTZ NOT NULL,
    "revoked" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exams" (
    "id" UUID NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "exams_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "parts" (
    "id" UUID NOT NULL,
    "exam_id" UUID NOT NULL,
    "source_id" INTEGER NOT NULL,
    "part_number" INTEGER NOT NULL,
    "part_type" "PartType" NOT NULL,
    "description" TEXT,
    "audio_url" TEXT,

    CONSTRAINT "parts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "questions" (
    "id" UUID NOT NULL,
    "source_id" INTEGER NOT NULL,
    "part_id" UUID NOT NULL,
    "is_grouped" BOOLEAN NOT NULL DEFAULT false,
    "question_order" INTEGER NOT NULL,
    "image_url" TEXT,
    "audio_url" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sub_questions" (
    "id" UUID NOT NULL,
    "source_id" INTEGER NOT NULL,
    "question_id" UUID NOT NULL,
    "sub_order" INTEGER NOT NULL,
    "question_text" TEXT NOT NULL,
    "option_a" TEXT NOT NULL,
    "option_b" TEXT NOT NULL,
    "option_c" TEXT NOT NULL,
    "option_d" TEXT,
    "correct_answer" CHAR(1) NOT NULL,
    "explanation" TEXT,

    CONSTRAINT "sub_questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exam_attempts" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "exam_id" UUID NOT NULL,
    "selected_parts" INTEGER[],
    "status" "AttemptStatus" NOT NULL DEFAULT 'IN_PROGRESS',
    "started_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "submitted_at" TIMESTAMPTZ,
    "time_limit_sec" INTEGER,
    "time_spent_sec" INTEGER,
    "listening_score" INTEGER NOT NULL DEFAULT 0,
    "reading_score" INTEGER NOT NULL DEFAULT 0,
    "total_score" INTEGER NOT NULL DEFAULT 0,
    "correct_count" INTEGER NOT NULL DEFAULT 0,
    "total_count" INTEGER NOT NULL DEFAULT 0,
    "analysis_id" UUID,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "exam_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_answers" (
    "id" UUID NOT NULL,
    "attempt_id" UUID NOT NULL,
    "sub_question_id" UUID NOT NULL,
    "part_number" INTEGER NOT NULL,
    "chosen_answer" CHAR(1),
    "is_correct" BOOLEAN,
    "is_flagged" BOOLEAN NOT NULL DEFAULT false,
    "answered_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_answers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_chats" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "sub_question_id" UUID NOT NULL,
    "attempt_id" UUID NOT NULL,
    "messages" JSONB NOT NULL DEFAULT '[]',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "ai_chats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "post_exam_analyses" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'pending',
    "analysis_json" JSONB NOT NULL DEFAULT '{}',
    "generated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "post_exam_analyses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vocab_sets" (
    "id" UUID NOT NULL,
    "title" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "icon" VARCHAR(10),
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" UUID,

    CONSTRAINT "vocab_sets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vocabs" (
    "id" UUID NOT NULL,
    "set_id" UUID NOT NULL,
    "word" VARCHAR(100) NOT NULL,
    "ipa" VARCHAR(100),
    "meaning" TEXT NOT NULL,
    "example_en" TEXT,
    "example_vi" TEXT,
    "word_type" "WordType",
    "audio_url" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vocabs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_vocab_progress" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "vocab_id" UUID NOT NULL,
    "status" "VocabStatus" NOT NULL DEFAULT 'UNKNOWN',
    "reviewed_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_vocab_progress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_vocabs" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "word" VARCHAR(100) NOT NULL,
    "ipa" VARCHAR(100),
    "meaning" TEXT NOT NULL,
    "example_en" TEXT,
    "example_vi" TEXT,
    "word_type" "WordType",
    "note" TEXT,
    "status" "VocabStatus" NOT NULL DEFAULT 'UNKNOWN',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_vocabs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "theory_lessons" (
    "id" UUID NOT NULL,
    "part_number" INTEGER NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "content_md" TEXT NOT NULL,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "theory_lessons_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_token_key" ON "refresh_tokens"("token");

-- CreateIndex
CREATE INDEX "refresh_tokens_user_id_idx" ON "refresh_tokens"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "parts_source_id_key" ON "parts"("source_id");

-- CreateIndex
CREATE UNIQUE INDEX "parts_exam_id_part_number_key" ON "parts"("exam_id", "part_number");

-- CreateIndex
CREATE UNIQUE INDEX "questions_source_id_key" ON "questions"("source_id");

-- CreateIndex
CREATE INDEX "questions_part_id_idx" ON "questions"("part_id");

-- CreateIndex
CREATE UNIQUE INDEX "sub_questions_source_id_key" ON "sub_questions"("source_id");

-- CreateIndex
CREATE INDEX "sub_questions_question_id_idx" ON "sub_questions"("question_id");

-- CreateIndex
CREATE INDEX "exam_attempts_user_id_created_at_idx" ON "exam_attempts"("user_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "user_answers_attempt_id_idx" ON "user_answers"("attempt_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_answers_attempt_id_sub_question_id_key" ON "user_answers"("attempt_id", "sub_question_id");

-- CreateIndex
CREATE INDEX "ai_chats_user_id_attempt_id_idx" ON "ai_chats"("user_id", "attempt_id");

-- CreateIndex
CREATE UNIQUE INDEX "ai_chats_user_id_sub_question_id_attempt_id_key" ON "ai_chats"("user_id", "sub_question_id", "attempt_id");

-- CreateIndex
CREATE INDEX "post_exam_analyses_user_id_idx" ON "post_exam_analyses"("user_id");

-- CreateIndex
CREATE INDEX "vocabs_set_id_idx" ON "vocabs"("set_id");

-- CreateIndex
CREATE INDEX "user_vocab_progress_user_id_status_idx" ON "user_vocab_progress"("user_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "user_vocab_progress_user_id_vocab_id_key" ON "user_vocab_progress"("user_id", "vocab_id");

-- CreateIndex
CREATE INDEX "user_vocabs_user_id_created_at_idx" ON "user_vocabs"("user_id", "created_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "theory_lessons_part_number_key" ON "theory_lessons"("part_number");

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parts" ADD CONSTRAINT "parts_exam_id_fkey" FOREIGN KEY ("exam_id") REFERENCES "exams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "questions" ADD CONSTRAINT "questions_part_id_fkey" FOREIGN KEY ("part_id") REFERENCES "parts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sub_questions" ADD CONSTRAINT "sub_questions_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exam_attempts" ADD CONSTRAINT "exam_attempts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exam_attempts" ADD CONSTRAINT "exam_attempts_exam_id_fkey" FOREIGN KEY ("exam_id") REFERENCES "exams"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exam_attempts" ADD CONSTRAINT "exam_attempts_analysis_id_fkey" FOREIGN KEY ("analysis_id") REFERENCES "post_exam_analyses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_answers" ADD CONSTRAINT "user_answers_attempt_id_fkey" FOREIGN KEY ("attempt_id") REFERENCES "exam_attempts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_answers" ADD CONSTRAINT "user_answers_sub_question_id_fkey" FOREIGN KEY ("sub_question_id") REFERENCES "sub_questions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_chats" ADD CONSTRAINT "ai_chats_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_chats" ADD CONSTRAINT "ai_chats_sub_question_id_fkey" FOREIGN KEY ("sub_question_id") REFERENCES "sub_questions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "post_exam_analyses" ADD CONSTRAINT "post_exam_analyses_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vocab_sets" ADD CONSTRAINT "vocab_sets_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vocabs" ADD CONSTRAINT "vocabs_set_id_fkey" FOREIGN KEY ("set_id") REFERENCES "vocab_sets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_vocab_progress" ADD CONSTRAINT "user_vocab_progress_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_vocab_progress" ADD CONSTRAINT "user_vocab_progress_vocab_id_fkey" FOREIGN KEY ("vocab_id") REFERENCES "vocabs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_vocabs" ADD CONSTRAINT "user_vocabs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
