# Plantilla de Arranque y Estándares — Backend CrediFlow (NestJS 11 + Prisma 7 + PostgreSQL / Supabase)

## 1. Stack Tecnológico y Versiones de Referencia

| Pieza | Versión / Paquete | Notas |
|---|---|---|
| **Node.js** | **22 LTS** (`node:22-alpine` en Docker) | Fijar con `.nvmrc` o `engines.node` en `package.json` |
| **Gestor de paquetes** | **pnpm** (vía Corepack) | Único gestor permitido (bloquear `npm`/`yarn` con `preinstall: only-allow pnpm`) |
| **Framework** | **NestJS 11** (`@nestjs/core`, `@nestjs/common`, `@nestjs/platform-express`) | Arquitectura modular limpia |
| **Lenguaje** | **TypeScript 5.7+** | `strict: true`, decoradores habilitados |
| **ORM** | **Prisma 7** con **driver adapters** (`@prisma/adapter-pg` + `pg`) | Sin motor Rust clásico, query-compiler WASM |
| **Base de Datos** | **PostgreSQL / Supabase** (Transaction pooler o conexión directa; Docker local opcional para tests) | Conectado a las 11 tablas del dominio CrediFlow |
| **Config/env** | `@nestjs/config` + `class-validator`/`class-transformer` | Validación estricta del `.env` al arranque (`app.config.ts`) |
| **Auth & Seguridad** | `@nestjs/jwt`, `@nestjs/passport`, `passport`, `passport-jwt`, `bcrypt` | Access token Bearer + Refresh token en cookie `httpOnly` |
| **Docs API** | `@nestjs/swagger` | Expuesto en `/api/docs` con esquemas DTO y Bearer Auth |
| **Tests** | `Jest` (unit) + `supertest` (e2e) | Tests de casos de uso con ports/mocks sin levantar BD |
| **Lint/format** | `eslint` (`typescript-eslint`) + `prettier` | |

---

## 2. Arquitectura de Carpetas (Clean Architecture / Hexagonal por Módulo)

```text
src/
  main.ts                         # Bootstrap: ValidationPipe, CORS, Swagger, CookieParser, ShutdownHooks
  app.module.ts

  context/
    config/
      app.config.ts               # EnvironmentVariables validado con class-validator
    database/
      prisma.module.ts            # Provee PrismaClient global con PrismaPg driver adapter
      prisma.service.ts

  common/                         # Elementos transversales sin lógica de negocio
    decorators/                   # @Public(), @CurrentUser(), @CurrentTenant(), @Roles()
    guards/                       # JwtAuthGuard global, RolesGuard, TenantGuard (aislamiento multi-tenant)
    interceptors/                 # ResponseTransformInterceptor, LoggingInterceptor
    filters/                      # GlobalExceptionFilter (manejo estandarizado de errores HTTP y Prisma)
    interfaces/                   # Request autenticado con TenantContext
    dtos/                         # Paginación genérica, filtros de fecha
    utils/                        # crypto (SHA-256), geo (Haversine < 100m)

  modules/                        # Módulos de dominio de CrediFlow
    auth/                         # Autenticación, JWT, cookies, sesiones
    tenants/                      # Gestión de empresas SaaS, planes y suscripciones
    branches/                     # Sucursales y bóvedas de efectivo
    users/                        # Usuarios del sistema (superadmin, admin, supervisor, cobrador, cliente)
    clients/                      # CRM de clientes, expediente eKYC y score crediticio
    collectors/                   # Cobradores de ruta, telemetría y rastro GPS de paradas
    loans/                        # Solicitud, aprobación, cuotas y amortización de préstamos
    collections/                  # Visitas de campo, cobros, promesas, mora y geocerca (< 100m)
    digital-payments/             # Vouchers de transferencia (Nequi, PSE, Bancolombia, SPEI)
    cash-closing/                 # Liquidaciones de caja diaria 100% neta
    audit/                        # Trazabilidad forense con sello criptográfico SHA-256

prisma/
  schema.prisma                   # Modelos relacionales PostgreSQL
  prisma.config.ts                # Configuración Prisma 7 con driver adapter
  seed.ts                         # Datos semilla iniciales tipados
```

### Estructura Interna de Cada Módulo de Negocio:
```text
modules/<feature>/
  api/
    controllers/                  # Controladores HTTP (solo orquestan)
    dtos/                         # DTOs de entrada/salida con class-validator
  application/
    use-cases/                    # Casos de uso atómicos (una clase con .execute())
    services/                     # Lógica de aplicación compartida
  domain/
    interfaces/                   # Ports (contratos abstractos para repositorios y adapters)
    types/                        # Entidades puras y enums del dominio
  infrastructure/
    adapters/                     # Implementaciones técnicas (bcrypt, generador SHA-256, etc.)
    repositories/                 # Repositorios Prisma que implementan los ports
  <feature>.module.ts             # Registro de providers e inyección de dependencias
```

---

## 3. Modelo de Datos Prisma (`prisma/schema.prisma`) — 11 Entidades CrediFlow

```prisma
datasource db {
  provider = "postgresql"
}

generator client {
  provider        = "prisma-client-js"
  previewFeatures = ["driverAdapters"]
}

enum EstadoSuscripcion {
  activa
  suspendida
  demo
}

enum PlanSaas {
  basico
  pro
  enterprise
}

enum RolUsuario {
  superadmin
  admin
  supervisor
  cobrador
  cliente
}

enum EstadoKyc {
  no_iniciado
  pendiente
  en_revision
  verificado
  rechazado
}

enum EstadoCobrador {
  activo
  en_ruta
  sin_senal
  cierre_entregado
  inactivo
}

enum TipoEventoGps {
  inicio_ruta
  cobro_exitoso
  promesa_pago
  cliente_ausente
  aviso_mora
  posicion_actual
}

enum FrecuenciaPago {
  diario
  semanal
  quincenal
  mensual
}

enum EstadoPrestamo {
  Pendiente
  Activo
  En_Mora
  Pagado
  Rechazado
  Vencido
}

enum OrigenSolicitud {
  app_movil_cliente
  web_admin
  cobrador_campo
}

enum TipoGestionVisita {
  Cobrado
  Promesa_de_pago
  Aviso_de_Mora
  Ausente
  Rechazado
}

enum MetodoPagoDigital {
  Nequi
  PSE
  Bancolombia
  Daviplata
  SPEI
  Transferencia
}

enum EstadoPagoDigital {
  Pendiente_Validacion
  Aprobado
  Rechazado
}

enum EstadoLiquidacion {
  Pendiente
  Entregado_al_Supervisor
  Validada
  Con_Diferencia
}

enum CicloDineroForense {
  Originacion_Desembolso
  Recaudo_Ruta
  Conciliacion_Digital
  Liquidacion_Boveda
  Incidencia_Mora
  Riesgo_Rechazo
  Gob_SaaS
}

model Empresa {
  id                 String             @id @default(uuid()) @db.Uuid
  codigoSlug         String             @unique @map("codigo_slug")
  nombre             String
  nitRfc             String?            @map("nit_rfc")
  pais               String             @default("CO") @db.VarChar(2)
  moneda             String             @default("COP") @db.VarChar(3)
  simboloMoneda      String             @default("$") @map("simbolo_moneda") @db.VarChar(5)
  colorPrimario      String             @default("#1E40AF") @map("color_primario") @db.VarChar(10)
  estadoSuscripcion  EstadoSuscripcion  @default(activa) @map("estado_suscripcion")
  plan               PlanSaas           @default(pro)
  mrrMensualUsd      Decimal            @default(199.00) @map("mrr_mensual_usd") @db.Decimal(10, 2)
  maxCobradores      Int                @default(15) @map("max_cobradores")
  configuracion      Json               @default("{\"tasa_interes_defecto\": 15.0, \"geofence_radio_max_metros\": 100, \"cierre_caja_100_neto\": true}")
  createdAt          DateTime           @default(now()) @map("created_at") @db.Timestamptz
  updatedAt          DateTime           @updatedAt @map("updated_at") @db.Timestamptz

  sucursales         Sucursal[]
  usuarios           Usuario[]
  clientes           Cliente[]
  cobradores         Cobrador[]
  cobradoresRutaGps  CobradorRutaGps[]
  prestamos          Prestamo[]
  visitasRuta        VisitaRuta[]
  pagosDigitales     PagoDigital[]
  liquidaciones      Liquidacion[]
  auditoriaForense   AuditoriaForense[]

  @@map("empresas")
}

model Sucursal {
  id               String       @id @default(uuid()) @db.Uuid
  empresaId        String       @map("empresa_id") @db.Uuid
  nombre           String
  ciudad           String
  direccion        String
  telefono         String?
  efectivoEnBoveda Decimal      @default(0.00) @map("efectivo_en_boveda") @db.Decimal(14, 2)
  activa           Boolean      @default(true)
  createdAt        DateTime     @default(now()) @map("created_at") @db.Timestamptz
  updatedAt        DateTime     @updatedAt @map("updated_at") @db.Timestamptz

  empresa          Empresa      @relation(fields: [empresaId], references: [id], onDelete: Cascade)
  usuarios         Usuario[]
  clientes         Cliente[]
  cobradores       Cobrador[]
  prestamos        Prestamo[]
  liquidaciones    Liquidacion[]

  @@map("sucursales")
}

model Usuario {
  id                   String      @id @default(uuid()) @db.Uuid
  authUserId           String?     @unique @map("auth_user_id") @db.Uuid
  empresaId            String?     @map("empresa_id") @db.Uuid
  sucursalId           String?     @map("sucursal_id") @db.Uuid
  email                String      @unique
  passwordHash         String      @map("password_hash")
  nombreCompleto       String      @map("nombre_completo")
  rol                  RolUsuario
  telefono             String?
  avatarUrl            String?     @map("avatar_url")
  cajaActualSupervisor Decimal     @default(0.00) @map("caja_actual_supervisor") @db.Decimal(14, 2)
  estaActivo           Boolean     @default(true) @map("esta_activo")
  createdAt            DateTime    @default(now()) @map("created_at") @db.Timestamptz
  updatedAt            DateTime    @updatedAt @map("updated_at") @db.Timestamptz

  empresa              Empresa?    @relation(fields: [empresaId], references: [id], onDelete: Cascade)
  sucursal             Sucursal?   @relation(fields: [sucursalId], references: [id], onDelete: SetNull)
  clientes             Cliente[]
  cobradores           Cobrador[]
  prestamosAprobados   Prestamo[]  @relation("PrestamoAprobadoPor")
  pagosValidados       PagoDigital[] @relation("PagoValidadoPor")
  liquidacionesRecibidas Liquidacion[] @relation("LiquidacionRecibidaPor")

  @@map("usuarios")
}

model Cliente {
  id                   String      @id @default(uuid()) @db.Uuid
  empresaId            String      @map("empresa_id") @db.Uuid
  sucursalId           String?     @map("sucursal_id") @db.Uuid
  usuarioId            String?     @map("usuario_id") @db.Uuid
  numeroDocumento      String      @map("numero_documento")
  tipoDocumento        String      @default("CC") @map("tipo_documento") @db.VarChar(10)
  nombres              String
  apellidos            String      @default("")
  telefono             String
  whatsapp             String?
  email                String?
  direccion            String
  barrioZona           String      @default("Centro") @map("barrio_zona")
  latitudDomicilio     Float?      @map("latitud_domicilio")
  longitudDomicilio    Float?      @map("longitud_domicilio")
  kycEstado            EstadoKyc   @default(pendiente) @map("kyc_estado")
  porcentajeBiometria  Decimal?    @default(0.00) @map("porcentaje_biometria") @db.Decimal(5, 2)
  scoreCrediticio      Int         @default(680) @map("score_crediticio")
  calificacionEstrellas Decimal    @default(3.5) @map("calificacion_estrellas") @db.Decimal(2, 1)
  documentosUrls       Json        @default("{}") @map("documentos_urls")
  createdAt            DateTime    @default(now()) @map("created_at") @db.Timestamptz
  updatedAt            DateTime    @updatedAt @map("updated_at") @db.Timestamptz

  empresa              Empresa     @relation(fields: [empresaId], references: [id], onDelete: Cascade)
  sucursal             Sucursal?   @relation(fields: [sucursalId], references: [id], onDelete: SetNull)
  usuario              Usuario?    @relation(fields: [usuarioId], references: [id], onDelete: SetNull)
  prestamos            Prestamo[]
  visitasRuta          VisitaRuta[]
  cobradoresRutaGps    CobradorRutaGps[]
  pagosDigitales       PagoDigital[]

  @@unique([empresaId, numeroDocumento])
  @@map("clientes")
}

model Cobrador {
  id                     String         @id @default(uuid()) @db.Uuid
  empresaId              String         @map("empresa_id") @db.Uuid
  sucursalId             String?        @map("sucursal_id") @db.Uuid
  usuarioId              String?        @map("usuario_id") @db.Uuid
  nombre                 String
  telefono               String
  zonaAsignada           String         @map("zona_asignada")
  estadoOperativo        EstadoCobrador @default(en_ruta) @map("estado_operativo")
  latitudActual          Float          @default(4.6097) @map("latitud_actual")
  longitudActual         Float          @default(-74.0817) @map("longitud_actual")
  precisionGpsMetros     Float?         @default(12.0) @map("precision_gps_metros")
  nivelBateria           Int            @default(85) @map("nivel_bateria")
  dispositivoModelo      String?        @default("Android / Capacitor WebView") @map("dispositivo_modelo")
  metaRecaudoDiaria      Decimal        @default(500000.00) @map("meta_recaudo_diaria") @db.Decimal(14, 2)
  recaudadoHoyEfectivo   Decimal        @default(0.00) @map("recaudado_hoy_efectivo") @db.Decimal(14, 2)
  clientesAsignadosHoy   Int            @default(0) @map("clientes_asignados_hoy")
  clientesVisitadosHoy   Int            @default(0) @map("clientes_visitados_hoy")
  ultimaActualizacionGps DateTime       @default(now()) @map("ultima_actualizacion_gps") @db.Timestamptz
  createdAt              DateTime       @default(now()) @map("created_at") @db.Timestamptz
  updatedAt              DateTime       @updatedAt @map("updated_at") @db.Timestamptz

  empresa                Empresa        @relation(fields: [empresaId], references: [id], onDelete: Cascade)
  sucursal               Sucursal?      @relation(fields: [sucursalId], references: [id], onDelete: SetNull)
  usuario                Usuario?       @relation(fields: [usuarioId], references: [id], onDelete: SetNull)
  prestamos              Prestamo[]
  visitasRuta            VisitaRuta[]
  cobradoresRutaGps      CobradorRutaGps[]
  liquidaciones          Liquidacion[]

  @@map("cobradores")
}

model CobradorRutaGps {
  id             String        @id @default(uuid()) @db.Uuid
  empresaId      String        @map("empresa_id") @db.Uuid
  cobradorId     String        @map("cobrador_id") @db.Uuid
  clienteId      String?       @map("cliente_id") @db.Uuid
  ordenParada    Int           @default(1) @map("orden_parada")
  latitud        Float
  longitud       Float
  tipoEvento     TipoEventoGps @map("tipo_evento")
  etiquetaCliente String?      @map("etiqueta_cliente")
  montoRecaudado Decimal?      @map("monto_recaudado") @db.Decimal(14, 2)
  detalle        String?
  horaEvento     DateTime      @default(now()) @map("hora_evento") @db.Timestamptz

  empresa        Empresa       @relation(fields: [empresaId], references: [id], onDelete: Cascade)
  cobrador       Cobrador      @relation(fields: [cobradorId], references: [id], onDelete: Cascade)
  cliente        Cliente?      @relation(fields: [clienteId], references: [id], onDelete: SetNull)

  @@index([cobradorId, horaEvento])
  @@map("cobradores_ruta_gps")
}

model Prestamo {
  id                    String          @id @default(uuid()) @db.Uuid
  codigoReferencia      String?         @map("codigo_referencia")
  empresaId             String          @map("empresa_id") @db.Uuid
  sucursalId            String?         @map("sucursal_id") @db.Uuid
  clienteId             String          @map("cliente_id") @db.Uuid
  cobradorId            String?         @map("cobrador_id") @db.Uuid
  montoSolicitado       Decimal         @map("monto_solicitado") @db.Decimal(14, 2)
  montoAprobado         Decimal         @map("monto_aprobado") @db.Decimal(14, 2)
  tasaInteresPorcentaje Decimal         @default(15.00) @map("tasa_interes_porcentaje") @db.Decimal(5, 2)
  interesTotal          Decimal         @map("interes_total") @db.Decimal(14, 2)
  totalAPagar           Decimal         @map("total_a_pagar") @db.Decimal(14, 2)
  saldoPendiente        Decimal         @map("saldo_pendiente") @db.Decimal(14, 2)
  valorCuota            Decimal         @map("valor_cuota") @db.Decimal(14, 2)
  cuotasTotales         Int             @map("cuotas_totales")
  cuotasPagadas         Int             @default(0) @map("cuotas_pagadas")
  cuotasRestantes       Int             @map("cuotas_restantes")
  frecuencia            FrecuenciaPago  @default(diario)
  diasMora              Int             @default(0) @map("dias_mora")
  estado                EstadoPrestamo  @default(Pendiente)
  origenSolicitud       OrigenSolicitud @default(app_movil_cliente) @map("origen_solicitud")
  motivoRechazo         String?         @map("motivo_rechazo")
  aprobadoPorUsuarioId  String?         @map("aprobado_por_usuario_id") @db.Uuid
  fechaDesembolso       DateTime?       @map("fecha_desembolso") @db.Date
  fechaVencimiento      DateTime?       @map("fecha_vencimiento") @db.Date
  proximoCobroFecha     DateTime?       @map("proximo_cobro_fecha") @db.Date
  createdAt             DateTime        @default(now()) @map("created_at") @db.Timestamptz
  updatedAt             DateTime        @updatedAt @map("updated_at") @db.Timestamptz

  empresa               Empresa         @relation(fields: [empresaId], references: [id], onDelete: Cascade)
  sucursal              Sucursal?       @relation(fields: [sucursalId], references: [id], onDelete: SetNull)
  cliente               Cliente         @relation(fields: [clienteId], references: [id], onDelete: Restrict)
  cobrador              Cobrador?       @relation(fields: [cobradorId], references: [id], onDelete: SetNull)
  aprobadoPor           Usuario?        @relation("PrestamoAprobadoPor", fields: [aprobadoPorUsuarioId], references: [id], onDelete: SetNull)
  visitasRuta           VisitaRuta[]
  pagosDigitales        PagoDigital[]

  @@index([empresaId, estado])
  @@map("prestamos")
}

model VisitaRuta {
  id                       String            @id @default(uuid()) @db.Uuid
  empresaId                String            @map("empresa_id") @db.Uuid
  prestamoId               String            @map("prestamo_id") @db.Uuid
  clienteId                String            @map("cliente_id") @db.Uuid
  cobradorId               String            @map("cobrador_id") @db.Uuid
  tipoGestion              TipoGestionVisita @map("tipo_gestion")
  montoCobrado             Decimal           @default(0.00) @map("monto_cobrado") @db.Decimal(14, 2)
  fechaPromesaPago         DateTime?         @map("fecha_promesa_pago") @db.Date
  observaciones            String?
  latitudVisita            Float             @map("latitud_visita")
  longitudVisita           Float             @map("longitud_visita")
  distanciaAlClienteMetros Float             @default(15.0) @map("distancia_al_cliente_metros")
  cumpleGeocerca100m       Boolean           @default(true) @map("cumple_geocerca_100m")
  liquidacionId            String?           @map("liquidacion_id") @db.Uuid
  createdAt                DateTime          @default(now()) @map("created_at") @db.Timestamptz

  empresa                  Empresa           @relation(fields: [empresaId], references: [id], onDelete: Cascade)
  prestamo                 Prestamo          @relation(fields: [prestamoId], references: [id], onDelete: Cascade)
  cliente                  Cliente           @relation(fields: [clienteId], references: [id], onDelete: Cascade)
  cobrador                 Cobrador          @relation(fields: [cobradorId], references: [id], onDelete: Cascade)
  liquidacion              Liquidacion?      @relation(fields: [liquidacionId], references: [id], onDelete: SetNull)

  @@index([empresaId, createdAt(sort: Desc)])
  @@map("visitas_ruta")
}

model PagoDigital {
  id                    String            @id @default(uuid()) @db.Uuid
  empresaId             String            @map("empresa_id") @db.Uuid
  prestamoId            String            @map("prestamo_id") @db.Uuid
  clienteId             String            @map("cliente_id") @db.Uuid
  monto                 Decimal           @db.Decimal(14, 2)
  metodoPago            MetodoPagoDigital @map("metodo_pago")
  referenciaBancaria    String            @map("referencia_bancaria")
  bancoOrigen           String?           @map("banco_origen")
  comprobanteUrl        String            @map("comprobante_url")
  estado                EstadoPagoDigital @default(Pendiente_Validacion)
  validadoPorUsuarioId  String?           @map("validado_por_usuario_id") @db.Uuid
  motivoRechazo         String?           @map("motivo_rechazo")
  fechaReporte          DateTime          @default(now()) @map("fecha_reporte") @db.Timestamptz
  fechaValidacion       DateTime?         @map("fecha_validacion") @db.Timestamptz

  empresa               Empresa           @relation(fields: [empresaId], references: [id], onDelete: Cascade)
  prestamo              Prestamo          @relation(fields: [prestamoId], references: [id], onDelete: Cascade)
  cliente               Cliente           @relation(fields: [clienteId], references: [id], onDelete: Cascade)
  validadoPor           Usuario?          @relation("PagoValidadoPor", fields: [validadoPorUsuarioId], references: [id], onDelete: SetNull)

  @@index([empresaId, estado])
  @@map("pagos_digitales")
}

model Liquidacion {
  id                          String            @id @default(uuid()) @db.Uuid
  empresaId                   String            @map("empresa_id") @db.Uuid
  sucursalId                  String?           @map("sucursal_id") @db.Uuid
  cobradorId                  String            @map("cobrador_id") @db.Uuid
  supervisorReceptorId        String?           @map("supervisor_receptor_id") @db.Uuid
  fechaCierre                 DateTime          @default(now()) @map("fecha_cierre") @db.Date
  cantidadVisitasCobradas     Int               @default(0) @map("cantidad_visitas_cobradas")
  montoEfectivoReportado      Decimal           @map("monto_efectivo_reportado") @db.Decimal(14, 2)
  montoEfectivoRecibidoBoveda Decimal?          @map("monto_efectivo_recibido_boveda") @db.Decimal(14, 2)
  diferenciaDescuadre         Decimal           @default(0.00) @map("diferencia_descuadre") @db.Decimal(14, 2)
  estado                      EstadoLiquidacion @default(Pendiente)
  observacionesCobrador       String?           @map("observaciones_cobrador")
  observacionesSupervisor     String?           @map("observaciones_supervisor")
  createdAt                   DateTime          @default(now()) @map("created_at") @db.Timestamptz
  validadoAt                  DateTime?         @map("validado_at") @db.Timestamptz

  empresa                     Empresa           @relation(fields: [empresaId], references: [id], onDelete: Cascade)
  sucursal                    Sucursal?         @relation(fields: [sucursalId], references: [id], onDelete: SetNull)
  cobrador                    Cobrador          @relation(fields: [cobradorId], references: [id], onDelete: Restrict)
  supervisorReceptor          Usuario?          @relation("LiquidacionRecibidaPor", fields: [supervisorReceptorId], references: [id], onDelete: SetNull)
  visitasRuta                 VisitaRuta[]

  @@index([empresaId, estado])
  @@map("liquidaciones")
}

model AuditoriaForense {
  id                 String             @id @default(uuid()) @db.Uuid
  codigoTrx          String             @unique @map("codigo_trx")
  empresaId          String             @map("empresa_id") @db.Uuid
  cicloDinero        CicloDineroForense @map("ciclo_dinero")
  tipoEvento         String             @map("tipo_evento")
  accionTitulo       String             @map("accion_titulo")
  detalleOperacion   String             @map("detalle_operacion")
  actorOrigenId      String?            @map("actor_origen_id") @db.Uuid
  actorOrigenNombre  String             @map("actor_origen_nombre")
  actorOrigenRol     String             @map("actor_origen_rol")
  actorDestinoNombre String?            @map("actor_destino_nombre")
  montoInvolucrado   Decimal            @default(0.00) @map("monto_involucrado") @db.Decimal(14, 2)
  latitud            Float?
  longitud           Float?
  precisionGpsMetros Float?             @map("precision_gps_metros")
  dispositivoInfo    String?            @map("dispositivo_info")
  ipOrigen           String?            @map("ip_origen")
  bateriaPorcentaje  Int?               @map("bateria_porcentaje")
  hashSha256         String             @map("hash_sha256")
  createdAt          DateTime           @default(now()) @map("created_at") @db.Timestamptz

  empresa            Empresa            @relation(fields: [empresaId], references: [id], onDelete: Cascade)

  @@index([empresaId, createdAt(sort: Desc)])
  @@map("auditoria_forense")
}
```

---

## 4. Reglas de Negocio Esenciales del Backend

1. **Aislamiento Multi-Tenant Estricto (`TenantGuard`):**
   - El payload del JWT contiene `empresaId` y `rol`.
   - Salvo usuarios con rol `superadmin`, ninguna consulta o mutación puede operar fuera del `empresaId` autenticado.
2. **Validación de Geofencing en el Servidor (`< 100m`):**
   - Al registrar un cobro (`POST /collections/visits`), el backend calcula con la fórmula de Haversine la distancia entre `(latitudVisita, longitudVisita)` y las coordenadas del domicilio del cliente `(latitudDomicilio, longitudDomicilio)`.
   - Si la distancia supera el radio configurado en la empresa (`geofence_radio_max_metros`, por defecto 100m), la operación se deniega con `403 Forbidden` (`Distancia excede radio permitido para cobro`).
3. **Cierre de Caja 100% Neto (`POST /cash-closing/liquidations`):**
   - El backend suma automáticamente el monto total recaudado de las visitas del día con estado `Cobrado`.
   - No permite deducción de gastos operativos; el monto reportado debe coincidir exactamente con el 100% del efectivo de las cuotas cobradas.
4. **Sello Criptográfico Inmutable SHA-256 en Auditoría:**
   - Cada evento financiero (`cobro`, `aprobacion`, `liquidacion`) genera un hash inmutable:
     `hash = SHA256(codigoTrx + empresaId + actorId + monto + latitud + longitud + timestamp + previousHash)`.
5. **Transacciones Atómicas con Prisma (`prisma.$transaction`):**
   - Un cobro en campo actualiza:
     1. Disminución de `saldoPendiente` y aumento de `cuotasPagadas` en `prestamos`.
     2. Creación del registro en `visitasRuta`.
     3. Creación del punto en `cobradoresRutaGps` con tipo `cobro_exitoso`.
     4. Creación del asiento en `auditoriaForense`.
     *Todo en una única transacción ACID.*

---

## 5. `.env.example` para CreditoBack

```dotenv
# --- Servidor ---
PORT=3000
NODE_ENV=development

# --- Base de Datos (Supabase Transaction Pooler o Session Connection) ---
# Formato Supabase: postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true
DATABASE_URL="postgresql://postgres:tu_password_aqui@db.tu_ref.supabase.co:5432/postgres"

# --- Seguridad JWT ---
JWT_SECRET=super_secret_jwt_crediflow_saas_production_key_change_me_2026
JWT_EXPIRES_IN=8h
JWT_REFRESH_EXPIRES_IN=7d

# --- CORS / Clientes Permitidos ---
# URLs de CreditoWeb y CreditoMovil (Capacitor y Localhost)
FRONTEND_URLS=http://localhost:5173,http://localhost:5174,capacitor://localhost,http://localhost

# --- Cookie httpOnly del Refresh Token ---
COOKIE_SAMESITE=lax
COOKIE_PATH=/api/auth
COOKIE_PERSISTENT=true
```

---

## 6. Procedimiento de Arranque Paso a Paso

```bash
# 1. Inicializar NestJS con pnpm en el repo clonado
corepack enable
pnpm dlx @nestjs/cli new . --package-manager pnpm --skip-git --directory .

# 2. Configurar package.json
# Añadir: "preinstall": "npx only-allow pnpm"

# 3. Instalar dependencias de runtime
pnpm add @nestjs/config @nestjs/jwt @nestjs/passport @nestjs/swagger \
  passport passport-jwt bcrypt class-validator class-transformer \
  cookie-parser @prisma/client @prisma/adapter-pg pg

# 4. Instalar dependencias de desarrollo
pnpm add -D prisma @types/bcrypt @types/passport-jwt @types/cookie-parser @types/pg

# 5. Inicializar Prisma y driver adapter
pnpm exec prisma init --datasource-provider postgresql

# 6. Generar cliente Prisma a partir de schema.prisma
pnpm exec prisma generate
```
