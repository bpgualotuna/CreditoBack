import { existsSync } from 'node:fs';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcrypt';

if (existsSync('.env')) {
  process.loadEnvFile('.env');
}

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL no está definida en .env');
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Iniciando seed de datos iniciales en Neon PostgreSQL...');

  const passwordHash = await bcrypt.hash('CrediFlow2026!', 12);

  // 1. Crear Empresa Demo Principal (emp-001)
  const empresaCrediExito = await prisma.empresa.upsert({
    where: { codigoSlug: 'emp-001' },
    update: {},
    create: {
      codigoSlug: 'emp-001',
      nombre: 'Financiera CrediÉxito S.A.',
      pais: 'CO',
      moneda: 'COP',
      simboloMoneda: '$',
      colorPrimario: '#1E40AF',
      estadoSuscripcion: 'activa',
      plan: 'pro',
      mrrMensualUsd: 199.0,
      maxCobradores: 20,
    },
  });
  console.log(`✓ Empresa creada/verificada: ${empresaCrediExito.nombre} (${empresaCrediExito.id})`);

  // 2. Crear Sucursal Principal
  const sucursalPrincipal = await prisma.sucursal.upsert({
    where: { id: '00000000-0000-0000-0000-000000000001' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000001',
      empresaId: empresaCrediExito.id,
      nombre: 'Sede Principal Bogotá',
      ciudad: 'Bogotá D.C.',
      direccion: 'Carrera 7 # 72-10',
      telefono: '+57 300 123 4567',
      efectivoEnBoveda: 15000000.0,
    },
  });
  console.log(`✓ Sucursal creada/verificada: ${sucursalPrincipal.nombre}`);

  // 3. Crear Usuarios Iniciales
  const usuarios = [
    {
      email: 'admin@crediflow.com',
      nombreCompleto: 'Admin CrediFlow',
      rol: 'admin' as const,
      empresaId: empresaCrediExito.id,
      sucursalId: sucursalPrincipal.id,
    },
    {
      email: 'superadmin@crediflow.com',
      nombreCompleto: 'SuperAdmin SaaS',
      rol: 'superadmin' as const,
      empresaId: null, // superadmin es global
      sucursalId: null,
    },
    {
      email: 'supervisor@crediflow.com',
      nombreCompleto: 'Supervisor de Caja',
      rol: 'supervisor' as const,
      empresaId: empresaCrediExito.id,
      sucursalId: sucursalPrincipal.id,
    },
    {
      email: 'cobrador@crediflow.com',
      nombreCompleto: 'Carlos Mendoza (Cobrador)',
      rol: 'cobrador' as const,
      empresaId: empresaCrediExito.id,
      sucursalId: sucursalPrincipal.id,
    },
    {
      email: 'cliente@crediflow.com',
      nombreCompleto: 'Carlos Andrés Restrepo',
      rol: 'cliente' as const,
      empresaId: empresaCrediExito.id,
      sucursalId: sucursalPrincipal.id,
    },
  ];

  for (const u of usuarios) {
    const user = await prisma.usuario.upsert({
      where: { email: u.email },
      update: {
        passwordHash,
        empresaId: u.empresaId,
        sucursalId: u.sucursalId,
      },
      create: {
        email: u.email,
        passwordHash,
        nombreCompleto: u.nombreCompleto,
        rol: u.rol,
        empresaId: u.empresaId,
        sucursalId: u.sucursalId,
        estaActivo: true,
      },
    });
    console.log(`✓ Usuario demo listo: ${user.email} (Rol: ${user.rol})`);
  }

  // 4. Crear un Cliente Demo para pruebas inmediatas
  const clienteDemo = await prisma.cliente.upsert({
    where: {
      empresaId_numeroDocumento: {
        empresaId: empresaCrediExito.id,
        numeroDocumento: '1020304050',
      },
    },
    update: {},
    create: {
      empresaId: empresaCrediExito.id,
      sucursalId: sucursalPrincipal.id,
      numeroDocumento: '1020304050',
      tipoDocumento: 'CC',
      nombres: 'Carlos Andrés',
      apellidos: 'Restrepo Gómez',
      telefono: '3104567890',
      whatsapp: '3104567890',
      email: 'cliente@crediflow.com',
      direccion: 'Calle 45 # 13-24',
      barrioZona: 'Chapinero',
      latitudDomicilio: 4.6321,
      longitudDomicilio: -74.0654,
      kycEstado: 'verificado',
      scoreCrediticio: 780,
      calificacionEstrellas: 4.5,
    },
  });
  console.log(`✓ Cliente demo creado: ${clienteDemo.nombres} ${clienteDemo.apellidos}`);

  console.log('\n🎉 Seed completado exitosamente.');
  console.log('👉 Credenciales para probar el Login en CreditoWeb:');
  console.log('   Email: admin@crediflow.com');
  console.log('   Password: CrediFlow2026!\n');
}

main()
  .catch((e) => {
    console.error('❌ Error en el seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
