import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Sembrando datos de prueba...\n");

  // ── Limpiar datos existentes ──
  await prisma.notificacion.deleteMany();
  await prisma.postulacion.deleteMany();
  await prisma.criterioValidacion.deleteMany();
  await prisma.convocatoria.deleteMany();
  await prisma.curso.deleteMany();
  await prisma.estudiante.deleteMany();
  await prisma.docente.deleteMany();
  await prisma.usuario.deleteMany();

  // ── Docente ──
  const docenteUser = await prisma.usuario.create({
    data: {
      nombre: "Esteban",
      apellido: "Castaño",
      correo: "docente@udem.edu.co",
      rol: "DOCENTE",
      docente: {
        create: { departamento: "Ingeniería de Sistemas" },
      },
    },
    include: { docente: true },
  });
  console.log("✅ Docente:", docenteUser.correo);

  // ── Estudiantes ──
  await prisma.usuario.create({
    data: {
      nombre: "Laura",
      apellido: "Gómez",
      correo: "estudiante@udem.edu.co",
      rol: "ESTUDIANTE",
      estudiante: {
        create: {
          programa: "Ingeniería de Sistemas",
          semestre: 5,
          promedioAcumulado: 4.3,
          creditosAprobados: 85,
        },
      },
    },
  });

  await prisma.usuario.create({
    data: {
      nombre: "Carlos",
      apellido: "Martínez",
      correo: "carlos@udem.edu.co",
      rol: "ESTUDIANTE",
      estudiante: {
        create: {
          programa: "Ingeniería de Sistemas",
          semestre: 6,
          promedioAcumulado: 4.1,
          creditosAprobados: 102,
        },
      },
    },
  });

  await prisma.usuario.create({
    data: {
      nombre: "María",
      apellido: "Rivera",
      correo: "maria@udem.edu.co",
      rol: "ESTUDIANTE",
      estudiante: {
        create: {
          programa: "Ingeniería de Sistemas",
          semestre: 3,
          promedioAcumulado: 3.7,
          creditosAprobados: 45,
        },
      },
    },
  });

  console.log("✅ Estudiantes: 3 creados");

  // ── Cursos ──
  const cursos = await Promise.all([
    prisma.curso.create({
      data: {
        nombre: "Estructuras de Datos",
        codigo: "IS301",
        programa: "Ingeniería de Sistemas",
        semestre: "2026-1",
      },
    }),
    prisma.curso.create({
      data: {
        nombre: "Programación Avanzada",
        codigo: "IS402",
        programa: "Ingeniería de Sistemas",
        semestre: "2026-1",
      },
    }),
    prisma.curso.create({
      data: {
        nombre: "Cálculo Diferencial",
        codigo: "CB101",
        programa: "Ingeniería de Sistemas",
        semestre: "2026-1",
      },
    }),
  ]);
  console.log("✅ Cursos: 3 creados");

  // ── Convocatoria publicada con criterios ──
  await prisma.convocatoria.create({
    data: {
      cursoId: cursos[0].id,
      docenteId: docenteUser.docente!.id,
      fechaInicio: new Date("2026-03-01"),
      fechaFin: new Date("2026-04-28"),
      estado: "PUBLICADA",
      preguntasFase1: [
        { pregunta: "¿Has cursado esta materia previamente?", tipo: "si_no" },
        { pregunta: "¿Cuántas horas semanales puedes dedicar?", tipo: "numerico" },
        { pregunta: "¿Por qué deseas ser monitor?", tipo: "texto" },
      ],
      criterios: {
        create: [
          {
            nombre: "Promedio Acumulado Mínimo",
            tipo: "AUTOMATICO_SIS",
            campo: "promedioAcumulado",
            operador: ">=",
            valor: "4.0",
            fuente: "SISTEMA_ACADEMICO",
          },
          {
            nombre: "Semestre Mínimo",
            tipo: "AUTOMATICO_SIS",
            campo: "semestre",
            operador: ">=",
            valor: "4",
            fuente: "SISTEMA_ACADEMICO",
          },
        ],
      },
    },
  });
  console.log("✅ Convocatoria publicada: Estructuras de Datos");

  // ── Convocatoria en borrador ──
  await prisma.convocatoria.create({
    data: {
      cursoId: cursos[1].id,
      docenteId: docenteUser.docente!.id,
      fechaInicio: new Date("2026-04-01"),
      fechaFin: new Date("2026-05-15"),
      estado: "BORRADOR",
      preguntasFase1: [],
    },
  });
  console.log("✅ Convocatoria borrador: Programación Avanzada");

  console.log("\n🎉 Seed completado!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());