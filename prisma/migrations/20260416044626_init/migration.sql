-- CreateEnum
CREATE TYPE "Rol" AS ENUM ('ESTUDIANTE', 'DOCENTE', 'MONITOR');

-- CreateEnum
CREATE TYPE "EstadoConvocatoria" AS ENUM ('BORRADOR', 'PUBLICADA', 'CERRADA');

-- CreateEnum
CREATE TYPE "FasePostulacion" AS ENUM ('FASE_1', 'FASE_2');

-- CreateEnum
CREATE TYPE "EstadoPostulacion" AS ENUM ('EN_PROCESO', 'APROBADA_FASE_1', 'APROBADA_FASE_2', 'RECHAZADA', 'ACEPTADO', 'DENEGADO');

-- CreateEnum
CREATE TYPE "TipoCriterio" AS ENUM ('AUTOMATICO_SIS', 'MANUAL');

-- CreateEnum
CREATE TYPE "FuenteDato" AS ENUM ('SISTEMA_ACADEMICO', 'FORMULARIO');

-- CreateEnum
CREATE TYPE "TipoNotificacion" AS ENUM ('PUBLICACION_CONVOCATORIA', 'RECHAZO_FASE_1', 'RESULTADO_SELECCION', 'ALERTA_INCUMPLIMIENTO', 'RECORDATORIO_SEMANAL');

-- CreateEnum
CREATE TYPE "EstadoNotificacion" AS ENUM ('PENDIENTE', 'ENVIADA', 'FALLIDA');

-- CreateEnum
CREATE TYPE "EstadoMonitoria" AS ENUM ('ACTIVA', 'FINALIZADA');

-- CreateEnum
CREATE TYPE "EstadoMonitor" AS ENUM ('ACTIVO', 'INACTIVO');

-- CreateEnum
CREATE TYPE "EstadoRegistroHoras" AS ENUM ('PENDIENTE', 'APROBADO', 'RECHAZADO');

-- CreateEnum
CREATE TYPE "TipoEvidencia" AS ENUM ('FOTO', 'VIDEO', 'DOCUMENTO', 'TALLER', 'MATERIAL_ESTUDIO');

-- CreateTable
CREATE TABLE "usuarios" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "apellido" TEXT NOT NULL,
    "correo" TEXT NOT NULL,
    "rol" "Rol" NOT NULL,
    "avatarUrl" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "estudiantes" (
    "id" TEXT NOT NULL,
    "programa" TEXT NOT NULL,
    "semestre" INTEGER NOT NULL,
    "promedioAcumulado" DOUBLE PRECISION NOT NULL,
    "creditosAprobados" INTEGER NOT NULL,
    "usuarioId" TEXT NOT NULL,

    CONSTRAINT "estudiantes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "docentes" (
    "id" TEXT NOT NULL,
    "departamento" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,

    CONSTRAINT "docentes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cursos" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "programa" TEXT NOT NULL,
    "semestre" TEXT NOT NULL,

    CONSTRAINT "cursos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "convocatorias" (
    "id" TEXT NOT NULL,
    "fechaInicio" TIMESTAMP(3) NOT NULL,
    "fechaFin" TIMESTAMP(3) NOT NULL,
    "estado" "EstadoConvocatoria" NOT NULL DEFAULT 'BORRADOR',
    "preguntasFase1" JSONB NOT NULL,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,
    "cursoId" TEXT NOT NULL,
    "docenteId" TEXT NOT NULL,

    CONSTRAINT "convocatorias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "criterios_validacion" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "tipo" "TipoCriterio" NOT NULL,
    "campo" TEXT NOT NULL,
    "operador" TEXT NOT NULL,
    "valor" TEXT NOT NULL,
    "fuente" "FuenteDato" NOT NULL,
    "convocatoriaId" TEXT NOT NULL,

    CONSTRAINT "criterios_validacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "postulaciones" (
    "id" TEXT NOT NULL,
    "faseActual" "FasePostulacion" NOT NULL DEFAULT 'FASE_1',
    "estado" "EstadoPostulacion" NOT NULL DEFAULT 'EN_PROCESO',
    "respuestasFase1" JSONB,
    "hojaDeVidaUrl" TEXT,
    "puntajeIA" DOUBLE PRECISION,
    "fechaPostulacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,
    "estudianteId" TEXT NOT NULL,
    "convocatoriaId" TEXT NOT NULL,

    CONSTRAINT "postulaciones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notificaciones" (
    "id" TEXT NOT NULL,
    "tipo" "TipoNotificacion" NOT NULL,
    "destinatarioCorreo" TEXT NOT NULL,
    "mensaje" TEXT NOT NULL,
    "estado" "EstadoNotificacion" NOT NULL DEFAULT 'PENDIENTE',
    "fechaEnvio" TIMESTAMP(3),
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "usuarioId" TEXT NOT NULL,

    CONSTRAINT "notificaciones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "monitores" (
    "id" TEXT NOT NULL,
    "fechaAsignacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "estado" "EstadoMonitor" NOT NULL DEFAULT 'ACTIVO',
    "estudianteId" TEXT NOT NULL,

    CONSTRAINT "monitores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "monitorias" (
    "id" TEXT NOT NULL,
    "semestreActivo" TEXT NOT NULL,
    "fechaInicio" TIMESTAMP(3) NOT NULL,
    "fechaFin" TIMESTAMP(3),
    "estado" "EstadoMonitoria" NOT NULL DEFAULT 'ACTIVA',
    "horasTotales" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "monitorId" TEXT NOT NULL,
    "cursoId" TEXT NOT NULL,
    "docenteId" TEXT NOT NULL,
    "postulacionId" TEXT NOT NULL,

    CONSTRAINT "monitorias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "registros_horas" (
    "id" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "horasRegistradas" DOUBLE PRECISION NOT NULL,
    "descripcion" TEXT NOT NULL,
    "estado" "EstadoRegistroHoras" NOT NULL DEFAULT 'PENDIENTE',
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "monitoriaId" TEXT NOT NULL,

    CONSTRAINT "registros_horas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "evidencias" (
    "id" TEXT NOT NULL,
    "tipo" "TipoEvidencia" NOT NULL,
    "archivoUrl" TEXT NOT NULL,
    "fechaSubida" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "descripcion" TEXT,
    "monitoriaId" TEXT NOT NULL,

    CONSTRAINT "evidencias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "informes_seguimiento" (
    "id" TEXT NOT NULL,
    "semana" INTEGER NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "contenido" TEXT NOT NULL,
    "calificacionDesempeno" DOUBLE PRECISION NOT NULL,
    "observaciones" TEXT,
    "monitoriaId" TEXT NOT NULL,
    "docenteId" TEXT NOT NULL,

    CONSTRAINT "informes_seguimiento_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_correo_key" ON "usuarios"("correo");

-- CreateIndex
CREATE UNIQUE INDEX "estudiantes_usuarioId_key" ON "estudiantes"("usuarioId");

-- CreateIndex
CREATE UNIQUE INDEX "docentes_usuarioId_key" ON "docentes"("usuarioId");

-- CreateIndex
CREATE UNIQUE INDEX "cursos_codigo_key" ON "cursos"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "postulaciones_estudianteId_convocatoriaId_key" ON "postulaciones"("estudianteId", "convocatoriaId");

-- CreateIndex
CREATE UNIQUE INDEX "monitores_estudianteId_key" ON "monitores"("estudianteId");

-- CreateIndex
CREATE UNIQUE INDEX "monitorias_postulacionId_key" ON "monitorias"("postulacionId");

-- CreateIndex
CREATE UNIQUE INDEX "informes_seguimiento_monitoriaId_semana_key" ON "informes_seguimiento"("monitoriaId", "semana");

-- AddForeignKey
ALTER TABLE "estudiantes" ADD CONSTRAINT "estudiantes_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "docentes" ADD CONSTRAINT "docentes_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "convocatorias" ADD CONSTRAINT "convocatorias_cursoId_fkey" FOREIGN KEY ("cursoId") REFERENCES "cursos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "convocatorias" ADD CONSTRAINT "convocatorias_docenteId_fkey" FOREIGN KEY ("docenteId") REFERENCES "docentes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "criterios_validacion" ADD CONSTRAINT "criterios_validacion_convocatoriaId_fkey" FOREIGN KEY ("convocatoriaId") REFERENCES "convocatorias"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "postulaciones" ADD CONSTRAINT "postulaciones_estudianteId_fkey" FOREIGN KEY ("estudianteId") REFERENCES "estudiantes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "postulaciones" ADD CONSTRAINT "postulaciones_convocatoriaId_fkey" FOREIGN KEY ("convocatoriaId") REFERENCES "convocatorias"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notificaciones" ADD CONSTRAINT "notificaciones_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "monitores" ADD CONSTRAINT "monitores_estudianteId_fkey" FOREIGN KEY ("estudianteId") REFERENCES "estudiantes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "monitorias" ADD CONSTRAINT "monitorias_monitorId_fkey" FOREIGN KEY ("monitorId") REFERENCES "monitores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "monitorias" ADD CONSTRAINT "monitorias_cursoId_fkey" FOREIGN KEY ("cursoId") REFERENCES "cursos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "monitorias" ADD CONSTRAINT "monitorias_docenteId_fkey" FOREIGN KEY ("docenteId") REFERENCES "docentes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "monitorias" ADD CONSTRAINT "monitorias_postulacionId_fkey" FOREIGN KEY ("postulacionId") REFERENCES "postulaciones"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "registros_horas" ADD CONSTRAINT "registros_horas_monitoriaId_fkey" FOREIGN KEY ("monitoriaId") REFERENCES "monitorias"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evidencias" ADD CONSTRAINT "evidencias_monitoriaId_fkey" FOREIGN KEY ("monitoriaId") REFERENCES "monitorias"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "informes_seguimiento" ADD CONSTRAINT "informes_seguimiento_monitoriaId_fkey" FOREIGN KEY ("monitoriaId") REFERENCES "monitorias"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "informes_seguimiento" ADD CONSTRAINT "informes_seguimiento_docenteId_fkey" FOREIGN KEY ("docenteId") REFERENCES "docentes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
