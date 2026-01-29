-- CreateTable
CREATE TABLE "assinaturas" (
    "id" TEXT NOT NULL,
    "usuario_id" TEXT NOT NULL,
    "plano_id" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "tipo_vigencia" TEXT NOT NULL,
    "inicio_vigencia" TIMESTAMP(3) NOT NULL,
    "proxima_cobranca" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "assinaturas_pkey" PRIMARY KEY ("id")
);
